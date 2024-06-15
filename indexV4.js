import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import { ChatOpenAI } from "@langchain/openai";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { scrapeBlog } from "./webScraperv4.js";
import "dotenv/config";
import { generateRandomID } from "./generateRandomID.js";
import { createMailOptions } from "./emailOptions.js";
import rateLimit from "express-rate-limit";
import Redis from "redis";
import RateLimitRedisStore from "rate-limit-redis";

const app = express();
app.use(cors());
app.use(express.json()); // Middleware to parse JSON bodies

app.use((req, res, next) => {
  console.log(`Incoming request from IP: ${req.ip}`);
  next();
});

(async () => {
  // Create a Redis client
  const redisClient = Redis.createClient({ url: process.env.REDIS_URL });

  // Handle Redis errors
  redisClient.on("error", (err) => {
    console.error("Redis error:", err);
  });

  // Connect the Redis client
  await redisClient.connect();

  // List of IP addresses to exclude from rate limiting
  const excludedIPs = [
    "2603:8001:6500:f367:adea:61b6:18b1:f88e",
    "10.1.27.4",
    "10.1.58.81",
    "192.168.1.19",
    "::1",
  ];

  // Helper function to normalize IP addresses
  const normalizeIp = (ip) => {
    if (ip.startsWith("::ffff:")) {
      return ip.substring(7); // Strip the IPv4-mapped IPv6 prefix
    }
    return ip;
  };

  // Define the rate limiting rule with Redis as the store and a skip function
  const apiLimiter = rateLimit({
    store: new RateLimitRedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args),
    }),
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 2, // limit each IP to 2 requests per windowMs
    message:
      "You have exceeded the 2 AI Content Analysis reports in 24 hours limit!",
    headers: true,
    skip: (req, res) => excludedIPs.includes(normalizeIp(req.ip)),
  });

  // Custom middleware to check URL-based rate limiting
  const urlLimiter = async (req, res, next) => {
    const { blogUrl } = req.body;
    const ip = normalizeIp(req.ip);
    const urlKey = `rate-limit:${ip}:${blogUrl}`;

    const requests = await redisClient.get(urlKey);

    if (requests) {
      return res.status(422).json({
        message: "You have already analyzed this URL in the past 24 hours.",
      });
    }

    await redisClient.set(urlKey, "1", { EX: 24 * 60 * 60 }); // Set expiry to 24 hours

    next();
  };

  // Apply the rate limiting rule to a specific endpoint
  //app.use("/api/analyze", apiLimiter);

  // Send an email when someone inputs their email for full report
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "mike@theundergroundgroup.com",
      pass: "iowc rovo noxo jkga",
    },
  });

  app.post("/api/send-input-email", (req, res) => {
    const { email, data, subject } = req.body;

    const mailOptions = createMailOptions(email, data, subject);

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).send(error.toString());
      }
      res.send("Email sent: " + info.response);
    });
  });

  // Define a route to process API requests to '/api/analyze'
  app.post("/api/analyze", apiLimiter, urlLimiter, async (req, res) => {
    try {
      const { blogUrl } = req.body;

      // Call your analysis function with the provided URL
      const results = await runAnalysis(blogUrl);

      // Respond with the analysis results
      res.json(results);
    } catch (error) {
      console.error("Error:", error);
      if (error.message === "Aggregated text is empty.") {
        res.status(400).json({ error: "Aggregated text is empty." });
      } else {
        res
          .status(500)
          .json({ error: "An error occurred while processing the request" });
      }
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
})();

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
    const { originalUrl, domainNameWithTLD, aggregatedText } = await scrapeBlog(
      blogUrl
    );
    console.log("TEXT CODEX|n\n", aggregatedText);

    if (!aggregatedText || aggregatedText.trim() === "") {
      throw new Error("Aggregated text is empty.");
    }

    const context = aggregatedText;

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
    //console.log("TARGET AUDIENCE: ", cleanText(response));

    results.keywords = JSON.parse(cleanText(response));

    const overallGradingTemplate = `You are a bot that specializes in analyzing the content of a content creator's website and rating the quality of that content.
    Given a set of context articles, the primary audience for those articles, and the top keywords to reach that audience, make sure to give a rating from 1-10, on the overall quality of the content. Your overall rating should factor in the following key metrics: Relevance, Accuracy, Clarity and Readability, Depth and Detail, Originality, Structure and Organization, Engagement, and SEO. You should not include anything regarding Visual Appeal in your rating. 
    Your feedback should justify your rating with specific examples from the content that demonstrate the effectiveness of the content. Your feedback should be concise.
    Also provide 5 suggestions on how they can improve their overall grade. You should base your suggestions on specific gaps or weaknesses you identify during your analysis. Each suggestion should be actionable and clearly tied to potential improvements in improving the overall quality of the content. In your response, do not number your suggestions.
    Also provide what their Potential Overall Rating could be if the suggested improvements were implemented.
    It is absolutely imperative that your answer be given exactly in the provided JSON format with only the following Keys used: "Rating" which is a Float, "Potential Rating" which is a Float, "Feedback" which is a String and should not have any new line characters and should not have any new line characters, and "Suggestions for Improvement" which is an array of Strings. Do not add anything outside of the braces of the JSON object.
    Context: {context}
    Primary Audience and Keywords: {audience}
    Format: {format}
    `;

    const readabilityTemplate = `You are a bot that specializes in analyzing the content of a content creator's website and rating the quality of that content.
    Given a set of context articles, the primary audience for those articles, and the top keywords to reach that audience, make sure to give a rating from 1-10, on how readable their content is. Your Readability rating should factor in the following key metrics: Language and Vocabulary, Sentence Structure, Paragraph Structure, Logical Flow, Consistency, and Radability Scores. You should not include anything regarding Visual Aids, Typography, and Layout in your rating.
    Your feedback should justify your rating with specific examples from the content that demonstrate the readability of the content. Your feedback should be concise and should not summarize the text.
    Also provide 5 suggestions on how they can improve their articles to be more readable. You should base your suggestions on specific gaps or weaknesses you identify during your analysis. Each suggestion should be actionable and clearly tied to potential improvements in improving the readability of the content. In your response, do not number your suggestions.
    Also provide what their Potential Readability Rating could be if the suggested improvements were implemented.
    Also provide the Flesch Reading Ease Score (FRES).
    Also provide the Tone of Voice for the content in one of the following categories: Very Casual, Somewhat Casual, Neutral, Somewhat Formal, and Very Formal. Your Tone of Voice rating must be only from one of these five selections.
    It is absolutely imperative that your answer be given exactly in the provided JSON format. Do not add anything outside of the braces of the JSON object.
    Context: {context}
    Primary Audience and Keywords: {audience}
    Format: {format}
    `;

    const topicAuthorityTemplate = `You are a bot that specializes in analyzing the content of a content creator's website and rating the quality of that content.
    Given a set of context articles, the primary audience for those articles, and the top keywords to reach that audience, make sure to give a rating from 1-10, on how well they represent Topic Authority. Your Topic Authority rating should factor in the following key metrics: Citation of Sources, Depth of Content, Accuracy and Fact-Checking, Currency of Information, Originality, and Relevance of Content. You should not include anything regarding Feedback and Engagement, Recognition and Endorsements, Balance and Fairness, and Expertise of the Author in your rating.
    Your feedback should justify your rating with specific examples from the content that demonstrate the Topic Authority of the content. Your feedback should be concise and should not summarize the text.
    Also provide 5 suggestions on how they can improve their articles to be have more topic authority. You should base your suggestions on specific gaps or weaknesses you identify during your analysis. Each suggestion should be actionable and clearly tied to potential improvements in improving the Topic Authority of the content. In your response, do not number your suggestions.
    Also provide what their Potential Topic Authority Rating could be if the suggested improvements were implemented.
    It is absolutely imperative that your answer be given exactly in the provided JSON format with only the following Keys used: "Rating" which is a Float, "Potential Rating" which is a Float, "Feedback" which is a String and should not have any new line characters, and "Suggestions for Improvement" which is an array of Strings. Do not add anything outside of the braces of the JSON object.
    Context: {context}
    Primary Audience and Keywords: {audience}
    Format: {format}
    `;

    const valueTemplate = `You are a bot that specializes in analyzing the content of a content creator's website and rating the quality of that content.
    Given a set of context articles, the primary audience for those articles, and the top keywords to reach that audience, make sure to give a rating from 1-10, on how well they are providing Value through their content. Your Content Value rating should factor in the following key metrics: Utility, Informativeness, Relevance, Uniqueness, Depth and Detail, Actionability, and Credibility. You should not include anything regarding Emotional Impact, Quality of Presentation, or Engagement in your rating.
    Your feedback should justify your rating with specific examples from the content that demonstrate the Value of the content. Your feedback should be concise and should not summarize the text.
    Also provide 5 suggestions on how they can improve their content to provide better Value. You should base your suggestions on specific gaps or weaknesses you identify during your analysis. Each suggestion should be actionable and clearly tied to potential improvements in improving the Value of the content. In your response, do not number your suggestions.
    Also provide what their Potential Value Rating could be if the suggested improvements were implemented. 
    It is absolutely imperative that your answer be given exactly in the provided JSON format with only the following Keys used: "Rating" which is a Float, "Potential Rating" which is a Float, "Feedback" which is a String and should not have any new line characters, and "Suggestions for Improvement" which is an array of Strings. Do not add anything outside of the braces of the JSON object.
    Context: {context}
    Primary Audience and Keywords: {audience}
    Format: {format}
    `;

    const seoTemplate = `You are a bot that specializes in analyzing the content of a content creator's website and rating the quality of that content.
    Given a set of context articles, the primary audience for those articles, and the top keywords to reach that audience, make sure to give a rating from 1-10, on how well they are taking advantage of SEO. Your SEO rating should factor in the following key metrics: Keyword Optimization, Content Quality, Internal and External Linking, and Meta Tags. You should not include anything regarding Image Optimization, URL Structure, User Engagement, Page Load Speed, or Content Length in your rating. 
    Your feedback should justify your rating with specific examples from the content that demonstrate the SEO performance of the content. Your feedback should be concise and should not summarize the text.
    Also provide 5 suggestions on how they can improve their SEO. You should base your suggestions on specific gaps or weaknesses you identify during your analysis. Each suggestion should be actionable and clearly tied to potential improvements in improving the SEO performance of the content. In your response, do not number your suggestions.
    Also provide what their Potential SEO Rating could be if the suggested improvements were implemented.
    It is absolutely imperative that your answer be given exactly in the provided JSON format with only the following Keys used: "Rating" which is a Float, "Potential Rating" which is a Float, "Feedback" which is a String and should not have any new line characters, and "Suggestions for Improvement" which is an array of Strings. Do not add anything outside of the braces of the JSON object.
    Context: {context}
    Primary Audience and Keywords: {audience}
    Format: {format}
    `;

    const moreGradesTemplate = `You are a bot that specializes in analyzing the content of a content creator's website and rate the quality of that content.
// Given a set of context articles, the primary audience for those articles, and the top keywords to reach that audience, make sure to give a rating from 1-10, on the following categories: Keyword Usage and Meta Tags.
Your Keyword Usage rating should factor in the following key metrics: Relevance of Keywords, Keyword Placement, Density of Keywords, Variety of Keywords, Natural Integration, Keyword Competition, Keyword Consistency, and Keyword Intent.
Your Meta Tag rating should factor in the following key metrics: Meta Title Relevance and Clarity, Meta Tag Types, Meta Title Length, Meta Description Relevance, Meta Description Length, Meta Tag Keyword Integration, and Meta Tag Uniqueness. You should not include anything regarding Visual Appeal in your rating.
It is absolutely imperative that your answer be given exactly in the provided JSON format. Do not add anything outside of the braces of the JSON object.
Context: {context}
Primary Audience and Keywords: {audience}
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
        format,
      }),
      invokeLLMChain(moreGradesTemplate, context, {
        audience: response,
        format: moreGradesFormat,
        metas,
      }),
    ]);

    //console.log("GRADE:", cleanText(responses[0]));
    results.overallGrade = JSON.parse(cleanText(responses[0]));
    //console.log("Readability:", cleanText(responses[1]));
    results.readability = JSON.parse(cleanText(responses[1]));
    //console.log("Topic Authority:", cleanText(responses[2]));
    results.topicAuthority = JSON.parse(cleanText(responses[2]));
    //console.log("Value:", cleanText(responses[3]));
    results.value = JSON.parse(cleanText(responses[3]));
    //console.log("SEO:", cleanText(responses[4]));
    results.seo = JSON.parse(cleanText(responses[4]));
    //console.log("MORE GRADES:", cleanText(responses[5]));
    results.moreGrades = JSON.parse(cleanText(responses[5]));
    console.log("RESULTS\n\n", results);
    //console.log("CONTEXT\n\n", context);
    results.originalUrl = originalUrl;
    results.subdomain = domainNameWithTLD;
    return results;
  } catch (error) {
    console.error("Error:", error);
    throw error; // Re-throw the error to be caught in the route handler
  }
}

async function invokeLLMChain(template, context, additionalParams = {}) {
  const prompt = PromptTemplate.fromTemplate(template);

  const chain = prompt.pipe(llm).pipe(new StringOutputParser());

  const response = await chain.invoke({ context, ...additionalParams });

  return response;
}
