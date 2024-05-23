import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import { ChatOpenAI } from "@langchain/openai";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { scrapeBlog } from "./webscraperV2.js";
import "dotenv/config";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { createClient } from "@supabase/supabase-js";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings } from "@langchain/openai";
import { combineDocuments } from "./combineDocuments.js";
import { generateRandomID } from "./generateRandomId.js";
import { buildRetriever } from "./retriever.js";
import { buildMetasRetriever } from "./metasRetriever.js";
import {
  RunnableSequence,
  RunnablePassthrough,
} from "@langchain/core/runnables";
import { createMailOptions } from "./emailOptions.js";

const app = express();
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

// Send an email when someone inputs their email for full report
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "mike@theundergroundgroup.com",
    pass: "iowc rovo noxo jkga",
  },
});

app.post("/api/send-input-email", (req, res) => {
  const { email, data } = req.body;
  console.log("Testing data for email: ", data);

  const mailOptions = createMailOptions(email, data);

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).send(error.toString());
    }
    res.send("Email sent: " + info.response);
  });
});

// Define a route to process API requests to '/api/analyze'
app.post("/api/analyze", async (req, res) => {
  try {
    //console.log("REQUEST:", req);
    // Ensure you have the necessary request data
    const { blogUrl } = req.body;

    // Call your analysis function with the provided URL
    const results = await runAnalysis(blogUrl);

    // Respond with the analysis results
    res.json(results);
  } catch (error) {
    // Handle errors
    console.error("Error:", error);
    res
      .status(500)
      .json({ error: "An error occurred while processing the request" });
  }
});

// Define a route
app.get("/", (req, res) => {
  res.send("API for Underground Group AI");
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

const openAIApiKey = process.env.OPENAI_API_KEY;

const llm = new ChatOpenAI({
  openAIApiKey,
  temperature: 0.7,
  modelName: "gpt-4o",
});

function cleanText(inputText) {
  // Replace the triple backticks and 'json' at the beginning and the triple backticks at the end
  return inputText.replace(/^```json\n|\n```$/g, "");
}

async function runAnalysis(blogUrl) {
  let context;
  let metas;
  let results = {};
  // Create randomID to store in database metadata
  const randomID = generateRandomID();
  try {
    //const blogUrl = "https://www.theundergroundgroup.com/old-blog"; // Replace with the URL of the blog you want to scrape
    const {
      originalUrl,
      domainNameWithTLD,
      aggregatedText,
      aggregatedMetaTags,
    } = await scrapeBlog(blogUrl);
    //console.log("TEXT CODEX|n\n", aggregatedText);

    // Initialize Supabase client
    const sbApiKey = process.env.SUPA_API_KEY;
    const sbUrl = process.env.SUPA_URL;
    const client = createClient(sbUrl, sbApiKey);

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 8000,
      chunkOverlap: 0,
      separators: ["\n\n"],
    });
    const docs = await splitter.createDocuments([aggregatedText]);
    console.log("CHUNKS: ", docs);

    const metaSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 2000,
      chunkOverlap: 0,
      separators: ["\n\n"],
    });
    const metaChunks = await metaSplitter.createDocuments([aggregatedMetaTags]);

    for (let doc in docs) {
      docs[doc]["metadata"]["id"] = randomID;
    }

    for (let chunk in metaChunks) {
      metaChunks[chunk]["metadata"]["id"] = randomID;
    }

    // Store documents and metadata asynchronously
    await Promise.all([
      SupabaseVectorStore.fromDocuments(
        docs,
        new OpenAIEmbeddings({ openAIApiKey }),
        {
          client,
          tableName: "documents",
        }
      ),
      // Add meta chunks to Metas database.
      SupabaseVectorStore.fromDocuments(
        metaChunks,
        new OpenAIEmbeddings({ openAIApiKey }),
        {
          client,
          tableName: "metas",
        }
      ),
    ]);

    const retriever = buildRetriever(randomID);
    const metasRetriever = buildMetasRetriever(randomID);

    const [retrieval, metasRetrieval] = await Promise.all([
      retriever.invoke(
        `Please summarize the site's content strategy focusing on its target audience. Include details on:
        1. The main goals of the content (e.g., educate, sell, inform).
        2. The readability level of the content, such as language simplicity or complexity.
        3. Demonstrations of topic authority, like expertise in subject matter or credentials.
        4. SEO strategies employed, including the use of specific keywords and their relevance to the content topics.
        5. The overall value provided to readers, such as answering common questions or unique insights offered.
        6. List the top ten keywords used and their alignment with the content's target audience and goals.`
      ),
      metasRetriever.invoke(
        "Find the meta tags that most accurately represent the target audience that the company is trying to target."
      ),
    ]);

    const context = combineDocuments(retrieval);
    const metas = combineDocuments(metasRetrieval);

    const audienceFormat = `{
      "Target Audience": <String>,
      "SEO Keywords":[<String>, <String>, <String>, <String>, <String>, <String>, <String>, <String>, <String>, <String>]
    }`;

    const format = `{
      "Rating": XXX,
      "Potential Rating": X.X,
      "Feedback": <String>,
      "Suggestions for Improvement": [<String>, <String>, <String>, <String>, <String>]
    }`;

    const readabilityFormat = `{
      "Rating": XXX,
      "Potential Rating": X.X,
      "Feedback": <String>,
      "Flesch Reading Ease Score (FRES)": XX.X,
      "Tone of Voice": <String>,
      "Suggestions for Improvement": [<String>, <String>, <String>, <String>, <String>]
    }`;

    const moreGradesFormat = `{
      "Keyword Usage Rating": XXX
      "Keyword Usage Feedback": <String>
      "Meta Tags Rating": XXX
      "Meta Tags Feedback": <String>}`;

    const audienceTemplate = `You are a bot that specializes in analyzing the content of a content creator's website and rate the quality of that content.
    Your primary goal will be to analyze the articles written on a website and indicate the company's primary demographic and what keywords will work best to reach that demographic.
    Please provide the ten best keywords to target their primary audience using SEO and also tell us what the target audience is. 
    Only use the context provided to come up with your answer. Ignore any context about emails, terms of service, feedback, or newsletters.
    It is absolutely imperative that your answer be given exactly in the provided format. 
    context: {context}
    Format: {format}`;

    const audiencePrompt = PromptTemplate.fromTemplate(audienceTemplate);

    const chain = audiencePrompt.pipe(llm).pipe(new StringOutputParser());

    const response = await chain.invoke({
      context: context,
      format: audienceFormat,
    });
    console.log("TARGET AUDIENCE: ", cleanText(response));

    results.keywords = JSON.parse(cleanText(response));

    const overallGradingTemplate = `You are a bot that specializes in analyzing the content of a content creator's website and rating the quality of that content.
    Given a set of context articles, the primary audience for those articles, and the top keywords to reach that audience, make sure to give a rating from 1-10, with 1 being the worst and 10 being the best, on the overall quality of the content. Your overall rating should factor in the following key metrics: Relevance, Accuracy, Clarity and Readability, Depth and Detail, Originality, Structure and Organization, Engagement, and SEO. You should not include anything regarding Visual Appeal in your rating. 
    Your feedback should justify your rating with specific examples from the content that demonstrate the effectiveness of the content. 
    Also provide 5 suggestions on how they can improve their overall grade. You should base your suggestions on specific gaps or weaknesses you identify during your analysis. Each suggestion should be actionable and clearly tied to potential improvements in improving the overall quality of the content. In your response, do not number your suggestions.
    Also provide what their Potential Overall Rating could be if the suggested improvements were implemented. You should be a very tough critic with your Potential Rating.
    It is absolutely imperative that your answer be given exactly in the provided JSON format with only the following Keys used: "Rating" which is a Float, "Potential Rating" which is a Float, "Feedback" which is a String and should not have any new line characters and should not have any new line characters, and "Suggestions for Improvement" which is an array of Strings. Do not add anything outside of the braces of the JSON object.
    Context: {context}
    Primary Audience and Keywords: {audience}
    Format: {format}
    `;

    const readabilityTemplate = `You are a bot that specializes in analyzing the content of a content creator's website and rating the quality of that content.
    Given a set of context articles, the primary audience for those articles, and the top keywords to reach that audience, make sure to give a rating from 1-10, with 1 being the worst and 10 being the best, on how readable their content is. Your Readability rating should factor in the following key metrics: Language and Vocabulary, Sentence Structure, Paragraph Structure, Logical Flow, Consistency, and Radability Scores. You should not include anything regarding Visual Aids, Typography, and Layout in your rating.
    Your feedback should justify your rating with specific examples from the content that demonstrate the readability of the content. 
    Also provide 5 suggestions on how they can improve their articles to be more readable. You should base your suggestions on specific gaps or weaknesses you identify during your analysis. Each suggestion should be actionable and clearly tied to potential improvements in improving the readability of the content. In your response, do not number your suggestions.
    Also provide what their Potential Readability Rating could be if the suggested improvements were implemented. You should be a very tough critic with your Potential Rating.
    Also provide the Flesch Reading Ease Score (FRES).
    Also provide the Tone of Voice for the content in one of the following categories: Very Casual, Somewhat Casual, Neutral, Somewhat Formal, and Very Formal. Your Tone of Voice rating must be only from one of these five selections.
    It is absolutely imperative that your answer be given exactly in the provided JSON format. Do not add anything outside of the braces of the JSON object.
    Context: {context}
    Primary Audience and Keywords: {audience}
    Format: {format}
    `;

    const topicAuthorityTemplate = `You are a bot that specializes in analyzing the content of a content creator's website and rating the quality of that content.
    Given a set of context articles, the primary audience for those articles, and the top keywords to reach that audience, make sure to give a rating from 1-10, with 1 being the worst and 10 being the best, on how well they represent Topic Authority. Your Topic Authority rating should factor in the following key metrics: Citation of Sources, Depth of Content, Accuracy and Fact-Checking, Currency of Information, Originality, and Relevance of Content. You should not include anything regarding Feedback and Engagement, Recognition and Endorsements, Balance and Fairness, and Expertise of the Author in your rating.
    Your feedback should justify your rating with specific examples from the content that demonstrate the Topic Authority of the content. 
    Also provide 5 suggestions on how they can improve their articles to be have more topic authority. You should base your suggestions on specific gaps or weaknesses you identify during your analysis. Each suggestion should be actionable and clearly tied to potential improvements in improving the Topic Authority of the content. In your response, do not number your suggestions.
    Also provide what their Potential Topic Authority Rating could be if the suggested improvements were implemented. You should be a very tough critic with your Potential Rating.
    It is absolutely imperative that your answer be given exactly in the provided JSON format with only the following Keys used: "Rating" which is a Float, "Potential Rating" which is a Float, "Feedback" which is a String and should not have any new line characters, and "Suggestions for Improvement" which is an array of Strings. Do not add anything outside of the braces of the JSON object.
    Context: {context}
    Primary Audience and Keywords: {audience}
    Format: {format}
    `;

    const valueTemplate = `You are a bot that specializes in analyzing the content of a content creator's website and rating the quality of that content.
    Given a set of context articles, the primary audience for those articles, and the top keywords to reach that audience, make sure to give a rating from 1-10, with 1 being the worst and 10 being the best, on how well they are providing Value through their content. Your Content Value rating should factor in the following key metrics: Utility, Informativeness, Relevance, Uniqueness, Depth and Detail, Actionability, and Credibility. You should not include anything regarding Emotional Impact, Quality of Presentation, or Engagement in your rating.
    Your feedback should justify your rating with specific examples from the content that demonstrate the Value of the content. 
    Also provide 5 suggestions on how they can improve their content to provide better Value. You should base your suggestions on specific gaps or weaknesses you identify during your analysis. Each suggestion should be actionable and clearly tied to potential improvements in improving the Value of the content. In your response, do not number your suggestions.
    Also provide what their Potential Value Rating could be if the suggested improvements were implemented. You should be a very tough critic with your Potential Rating. 
    It is absolutely imperative that your answer be given exactly in the provided JSON format with only the following Keys used: "Rating" which is a Float, "Potential Rating" which is a Float, "Feedback" which is a String and should not have any new line characters, and "Suggestions for Improvement" which is an array of Strings. Do not add anything outside of the braces of the JSON object.
    Context: {context}
    Primary Audience and Keywords: {audience}
    Format: {format}
    `;

    const seoTemplate = `You are a bot that specializes in analyzing the content of a content creator's website and rating the quality of that content.
    Given a set of context articles, the primary audience for those articles, the top keywords to reach that audience, and the meta tags found on those articles, make sure to give a rating from 1-10, with 1 being the worst and 10 being the best, on how well they are taking advantage of SEO. Your SEO rating should factor in the following key metrics: Keyword Optimization, Content Quality, Internal and External Linking, and Meta Tags. You should not include anything regarding Image Optimization, URL Structure, User Engagement, Page Load Speed, or Content Length in your rating. 
    Your feedback should justify your rating with specific examples from the content that demonstrate the SEO performance of the content. 
    Also provide 5 suggestions on how they can improve their SEO. You should base your suggestions on specific gaps or weaknesses you identify during your analysis. Each suggestion should be actionable and clearly tied to potential improvements in improving the SEO performance of the content. In your response, do not number your suggestions.
    Also provide what their Potential SEO Rating could be if the suggested improvements were implemented. You should be a very tough critic with your Potential Rating.
    It is absolutely imperative that your answer be given exactly in the provided JSON format with only the following Keys used: "Rating" which is a Float, "Potential Rating" which is a Float, "Feedback" which is a String and should not have any new line characters, and "Suggestions for Improvement" which is an array of Strings. Do not add anything outside of the braces of the JSON object.
    Context: {context}
    Primary Audience and Keywords: {audience}
    Meta Tags: {metas}
    Format: {format}
    `;

    const moreGradesTemplate = `You are a bot that specializes in analyzing the content of a content creator's website and rate the quality of that content.
// Given a set of context articles, the primary audience for those articles, the top keywords to reach that audience, and the Meta Tags found on those articles, make sure to give a rating from 1-10, with 1 being the worst and 10 being the best, on the following categories: Keyword Usage and Meta Tags.
Your Keyword Usage rating should factor in the following key metrics: Relevance of Keywords, Keyword Placement, Density of Keywords, Variety of Keywords, Natural Integration, Keyword Competition, Keyword Consistency, and Keyword Intent.
Your Meta Tag rating should factor in the following key metrics: Meta Title Relevance and Clarity, Meta Tag Types, Meta Title Length, Meta Description Relevance, Meta Description Length, Meta Tag Keyword Integration, and Meta Tag Uniqueness. You should not include anything regarding Visual Appeal in your rating.
It is absolutely imperative that your answer be given exactly in the provided JSON format. Do not add anything outside of the braces of the JSON object.
Context: {context}
Primary Audience and Keywords: {audience}
Meta Tags: {metas}
Format: {format}`;

    // Invoke LLM chain for various prompts
    const responses = await Promise.all([
      invokeLLMChain(overallGradingTemplate, context, {
        audience: response,
        format,
      }),
      invokeLLMChain(readabilityTemplate, context, {
        audience: response,
        format: readabilityFormat,
      }),
      invokeLLMChain(topicAuthorityTemplate, context, {
        audience: response,
        format,
      }),
      invokeLLMChain(valueTemplate, context, {
        audience: response,
        format,
      }),
      invokeLLMChain(seoTemplate, context, {
        audience: response,
        metas,
        format,
      }),
      invokeLLMChain(moreGradesTemplate, context, {
        audience: response,
        format: moreGradesFormat,
        metas,
      }),
    ]);

    console.log("GRADE:", cleanText(responses[0]));
    results.overallGrade = JSON.parse(cleanText(responses[0]));
    console.log("Readability:", cleanText(responses[1]));
    results.readability = JSON.parse(cleanText(responses[1]));
    console.log("Topic Authority:", cleanText(responses[2]));
    results.topicAuthority = JSON.parse(cleanText(responses[2]));
    console.log("Value:", cleanText(responses[3]));
    results.value = JSON.parse(cleanText(responses[3]));
    console.log("SEO:", cleanText(responses[4]));
    results.seo = JSON.parse(cleanText(responses[4]));
    console.log("MORE GRADES:", cleanText(responses[5]));
    results.moreGrades = JSON.parse(cleanText(responses[5]));
    console.log("RESULTS\n\n", results);
    console.log("CONTEXT\n\n", context);
    results.originalUrl = originalUrl;
    results.subdomain = domainNameWithTLD;
    return results;
  } catch (error) {
    console.error("Error:", error);
  }
}

async function invokeLLMChain(template, context, additionalParams = {}) {
  const prompt = PromptTemplate.fromTemplate(template);

  const chain = prompt.pipe(llm).pipe(new StringOutputParser());

  const response = await chain.invoke({ context, ...additionalParams });

  return response;
}
