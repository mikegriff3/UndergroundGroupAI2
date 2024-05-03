import express from "express";
import cors from "cors";
import { ChatOpenAI } from "@langchain/openai";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { scrapeBlog } from "./webScraper.js";
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

const app = express();
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

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
  //temperature: 1.5,
  //modelName: "gpt-4-turbo-preview",
});

async function runAnalysis(blogUrl) {
  let context;
  let metas;
  let results = {};
  // Create randomID to store in database metadata
  const randomID = generateRandomID();
  try {
    //const blogUrl = "https://www.theundergroundgroup.com/old-blog"; // Replace with the URL of the blog you want to scrape
    const { aggregatedText, aggregatedMetaTags } = await scrapeBlog(blogUrl);
    //console.log("TEXT CODEX|n\n", aggregatedText);

    // Initialize Supabase client
    const sbApiKey = process.env.SUPA_API_KEY;
    const sbUrl = process.env.SUPA_URL;
    const client = createClient(sbUrl, sbApiKey);

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 3000,
      chunkOverlap: 100,
    });
    const docs = await splitter.createDocuments([aggregatedText]);

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
        "What is the company's target audience and provide the ten best keywords to target their primary audience and also tell us what the target audience is."
      ),
      metasRetriever.invoke(
        "Find the meta tags that most accurately represent the target audience that the company is trying to target."
      ),
    ]);

    const context = combineDocuments(retrieval);
    const metas = combineDocuments(metasRetrieval);

    const audienceFormat = `Target Audience: <String>

    Top 10 Keywords:
    1. <String>
    2. <String>
    3. <String>
    4. <String>
    5. <String>
    6. <String>
    7. <String>
    8. <String>
    9. <String>
    10. <String>`;

    const format = `Rating: X.X

    Potential Rating: X.X

    Feedback: <String>

    Suggestions for improvement:
    1. <String>
    2. <String>
    3. <String>
    4. <String>
    5. <String>`;

    const readabilityFormat = `Rating: X.X

    Potential Rating: X.X

    Feedback: <String>

    Flesch Reading Ease Score (FRES): XX.X

    Tone of Voice: 

    Suggestions for improvement:
    1. <String>
    2. <String>
    3. <String>
    4. <String>
    5. <String>`;

    const moreGradesFormat = `Keyword Usage Rating: X.X
    
    Feedback: <String>
    
    Meta Tags Rating: X.X
    
    Feedback: <String>`;

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
    console.log("TARGET AUDIENCE: ", response);

    let lines = response.split(/\n/);
    let temp = lines[0].split(/\s+/);
    results.targetAudience = temp.slice(2).join(" ");
    results.keywords = processArray(lines, 10);

    const overallGradingTemplate = `You are a bot that specializes in analyzing the content of a content creator's website and rate the quality of that content.
// Given a set of context articles, the primary audience for those articles, and the top keywords to reach that audience, make sure to give a rating from 1-10, with 1 being the worst and 10 being the best, on how well they are effectively reaching out to their audience. 
// Also provide 5 suggestions on how they can improve their overall grade.
// Also provide what their Potential Overall Rating could be if the suggested improvements were implemented. You should be a very tough critic with your Potential Rating. Note: Your assessment must end immediately after the fifth suggestion without any additional feedback or commentary.
// It is absolutely imperative that your answer be given exactly in the provided format. Note: Your assessment must end immediately after the fifth suggestion without any additional feedback or commentary.
// You should be a very tough critic when giving your rating.
// Context: {context}
// Primary Audience and Keywords: {audience}
// Format: {format}`;

    const readabilityTemplate = `You are a bot that specializes in analyzing the content of a content creator's website and rate the quality of that content.
// Given a set of context articles, the primary audience for those articles, and the top keywords to reach that audience, make sure to give a rating from 1-10, with 1 being the worst and 10 being the best, on how readable their content is.
// Also provide 5 suggestions on how they can improve their articles to be more readable.
// Also provide what their Potential Readability Rating could be if the suggested improvements were implemented. You should be a very tough critic with your Potential Rating. Note: Your assessment must end immediately after the fifth suggestion without any additional feedback or commentary.
// Also provide the Flesch Reading Ease Score (FRES).
// Also provide the Tone of Voice for the content in one of the followiing categories: Very Casual, Somewhat Casual, Neutral, Somewhat Formal, and Very Formal
// It is absolutely imperative that your answer be given exactly in the provided format. Note: Your assessment must end immediately after the fifth suggestion without any additional feedback or commentary.
// You should be a very tough critic when giving your rating.
// Context: {context}
// Primary Audience and Keywords: {audience}
// Format: {format}`;

    const topicAuthorityTemplate = `You are a bot that specializes in analyzing the content of a content creator's website and rate the quality of that content.
// Given a set of context articles, the primary audience for those articles, and the top keywords to reach that audience, make sure to give a rating from 1-10, with 1 being the worst and 10 being the best, on how well they represent Topic Authority.
// Also provide 5 suggestions on how they can improve their articles to be have more topic authority.
// Also provide what their Potential Topic Authority Rating could be if the suggested improvements were implemented. You should be a very tough critic with your Potential Rating. Note: Your assessment must end immediately after the fifth suggestion without any additional feedback or commentary.
// It is absolutely imperative that your answer be given exactly in the provided format. Note: Your assessment must end immediately after the fifth suggestion without any additional feedback or commentary.
// You should be a very tough critic when giving your rating.
// Context: {context}
// Primary Audience and Keywords: {audience}
// Format: {format}`;

    const valueTemplate = `You are a bot that specializes in analyzing the content of a content creator's website and rate the quality of that content.
// Given a set of context articles, the primary audience for those articles, and the top keywords to reach that audience, make sure to give a rating from 1-10, with 1 being the worst and 10 being the best, on how well they are providing Value through their content.
// Also provide 5 suggestions on how they can improve their content to provide better Value.
// Also provide what their Potential Value Rating could be if the suggested improvements were implemented. You should be a very tough critic with your Potential Rating. Note: Your assessment must end immediately after the fifth suggestion without any additional feedback or commentary.
// It is absolutely imperative that your answer be given exactly in the provided format. Note: Your assessment must end immediately after the fifth suggestion without any additional feedback or commentary.
// You should be a very tough critic when giving your rating.
// Context: {context}
// Primary Audience and Keywords: {audience}
// Format: {format}`;

    const seoTemplate = `You are a bot that specializes in analyzing the content of a content creator's website and rate the quality of that content.
// Given a set of context articles, the primary audience for those articles, the top keywords to reach that audience, and the meta tags found on those articles, make sure to give a rating from 1-10, with 1 being the worst and 10 being the best, on how well they are taking advantage of SEO.
// Also provide 5 suggestions on how they can improve their SEO.
// Also provide what their Potential SEO Rating could be if the suggested improvements were implemented. You should be a very tough critic with your Potential Rating. Note: Your assessment must end immediately after the fifth suggestion without any additional feedback or commentary.
// It is absolutely imperative that your answer be given exactly in the provided format. Note: Your assessment must end immediately after the fifth suggestion without any additional feedback or commentary.
// You should be a very tough critic when giving your rating.
// Context: {context}
// Primary Audience and Keywords: {audience}
// Meta Tags: {metas}
// Format: {format}`;

    const moreGradesTemplate = `You are a bot that specializes in analyzing the content of a content creator's website and rate the quality of that content.
// Given a set of context articles, the primary audience for those articles, the top keywords to reach that audience, and the Meta Tags found on those articles, make sure to give a rating from 1-10, with 1 being the worst and 10 being the best, on the following categories: Keyword Usage and Meta Tags.
// It is absolutely imperative that your answer be given exactly in the provided format. 
// You should be a very tough critic when giving your rating.
// Context: {context}
// Primary Audience and Keywords: {audience}
// Meta Tags: {metas}
// Format: {format}`;

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

    console.log("GRADE:", responses[0]);
    results.overallGrade = formatAnswer(responses[0]);
    console.log("Readability:", responses[1]);
    results.readability = formatReadabilityAnswer(responses[1]);
    console.log("Topic Authority:", responses[2]);
    results.topicAuthority = formatAnswer(responses[2]);
    console.log("Value:", responses[3]);
    results.value = formatAnswer(responses[3]);
    console.log("SEO:", responses[4]);
    results.seo = formatAnswer(responses[4]);
    console.log("MORE GRADES:", responses[5]);
    results.moreGrades = formatMoreGradesAnswer(responses[5]);
    //console.log("RESULTS\n\n", results);
    //console.log("CONTEXT\n\n", context);
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

function formatAnswer(answer) {
  let data = {};

  let lines = answer.split(/\n/);
  //console.log("LINES: ", lines);
  let rating = lines[0].split(/\s+/);
  data.rating = rating.slice(1).join(" ");
  let potential = lines[2].split(/\s+/);
  data.potential = potential.slice(2).join(" ");
  let feedback = lines[4].split(/\s+/);
  data.feedback = feedback.slice(1).join(" ");
  data.suggestions = processArray(lines, 5);

  return data;
}

function formatReadabilityAnswer(answer) {
  let data = {};

  let lines = answer.split(/\n/);
  //console.log("LINES: ", lines);
  let rating = lines[0].split(/\s+/);
  data.rating = rating.slice(1).join(" ");
  let potential = lines[2].split(/\s+/);
  data.potential = potential.slice(2).join(" ");
  let feedback = lines[4].split(/\s+/);
  data.feedback = feedback.slice(1).join(" ");
  let fres = lines[6].split(/\s+/);
  data.fres = fres[fres.length - 1];
  // Using regex to find text after the colon ':' and stop either before a parenthesis '(' or at the end of the string
  let tone = lines[8].match(/:\s*([^()]*)(?=\s*\(|$)/);
  data.tov = tone ? tone[1].trim() : "";
  data.suggestions = processArray(lines, 5);

  return data;
}

function formatMoreGradesAnswer(answer) {
  let data = {};
  let lines = answer.split(/\n/);
  let keys = lines[0].split(/\s+/);
  data.keywordUsageRating = keys[keys.length - 1];
  let keysFeedback = lines[2].split(/\s+/);
  data.keywordUsageFeedback = keysFeedback.slice(1).join(" ");
  let metas = lines[4].split(/\s+/);
  data.metaRating = metas[metas.length - 1];
  let metasFeedback = lines[6].split(/\s+/);
  data.metaFeedback = metasFeedback.slice(1).join(" ");
  return data;
}

function processArray(arr, items) {
  // Get the last 10 items of the array
  let lastNItems = arr.slice(-items);

  // Remove the first word from each item in the new array
  let processedArray = lastNItems.map((item) => {
    // Split the item into words
    let words = item.split(/\s+/);
    // Remove the first word and join the remaining words
    return words.slice(1).join(" ");
  });

  return processedArray;
}

//const analysis = await runAnalysis();
//console.log(analysis);
