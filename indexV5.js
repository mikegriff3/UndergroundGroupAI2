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

// Create a Redis client
const redisClient = Redis.createClient({ url: process.env.REDIS_URL });

// Function to check if results exist in Redis
const getResultsFromRedis = async (key, redisClient) => {
  const results = await redisClient.get(key);
  return results ? JSON.parse(results) : null;
};

function extractDomainAndPath(url) {
  try {
    // If the URL does not start with http:// or https://, prepend https://
    if (!url.match(/^[a-zA-Z]+:\/\//)) {
      url = "https://" + url;
    }
    const parsedUrl = new URL(url);
    return `${parsedUrl.hostname}${parsedUrl.pathname}`;
  } catch (e) {
    console.error("Invalid URL", e);
    return null;
  }
}

(async () => {
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
  app.post("/api/analyze", apiLimiter, async (req, res) => {
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
  temperature: 0.5,
  modelName: "gpt-4o",
});

function cleanText(inputText) {
  // Replace the triple backticks and 'json' at the beginning and the triple backticks at the end
  return inputText.replace(/^```json\n|\n```$/g, "");
}

// Function to save results to Redis with 2 weeks expiration time
const saveResultsToRedis = async (key, value, redisClient) => {
  const twoWeeksInSeconds = 14 * 24 * 60 * 60;
  await redisClient.set(key, JSON.stringify(value), { EX: twoWeeksInSeconds });
  console.log(`Saved results to Redis with key: ${key}`);
};

async function runAnalysis(blogUrl) {
  const shortURL = extractDomainAndPath(blogUrl);
  // Check for existing results in Redis
  const existingResults = await getResultsFromRedis(shortURL, redisClient);
  if (existingResults) {
    console.log(`Returning cached results for blogUrl: ${shortURL}`);
    return existingResults;
  }

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
      "Overall": {
        "Rating": XXX,
        "Potential Rating": X.X,
        "Feedback": <String>,
        "Suggestions for Improvement": [<String>, <String>, <String>, <String>, <String>]
        },
      "Readability": {
        "Rating": XXX,
        "Potential Rating": X.X,
        "Feedback": <String>,
        "Flesch Reading Ease Score (FRES)": XX.X,
        "Tone of Voice": <String>,
        "Suggestions for Improvement": [<String>, <String>, <String>, <String>, <String>]
        },
      "Topic Authority": {
        "Rating": XXX,
        "Potential Rating": X.X,
        "Feedback": <String>,
        "Suggestions for Improvement": [<String>, <String>, <String>, <String>, <String>]
        }
    }`;

    const format2 = `{
      "Content Value": {
        "Rating": XXX,
        "Potential Rating": X.X,
        "Feedback": <String>,
        "Suggestions for Improvement": [<String>, <String>, <String>, <String>, <String>]
        },
      "SEO": {
        "Rating": XXX,
        "Potential Rating": X.X,
        "Feedback": <String>,
        "Suggestions for Improvement": [<String>, <String>, <String>, <String>, <String>]
        },
      "Keyword Usage": {
        "Rating": XXX,
        "Potential Rating": X.X,
        "Feedback": <String>,
        "Suggestions for Improvement": [<String>, <String>, <String>, <String>, <String>]
        },
      "Meta Tags": {
        "Rating": XXX,
        "Potential Rating": X.X,
        "Feedback": <String>,
        "Suggestions for Improvement": [<String>, <String>, <String>, <String>, <String>]
        }
    }`;

    const audienceTemplate = `You are a bot that specializes in analyzing the content of a content creator's website and rate the quality of that content.
    Your primary goal will be to analyze the articles written on a website and indicate the company's primary demographic and what keywords will work best to reach that demographic.
    Please provide the ten best keywords to target their primary audience using SEO and also tell us what the target audience is. The top SEO keywords should be keywords most searched by their target audience, not keywords found already in their articles.
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

    const promptTemplate = `You are a bot that specializes in analyzing the content of a content creator's website and rating the quality of that content.
    Given a set of context articles, the primary audience for those articles, and the top keywords to reach that audience, make sure to give a rating from 1-10, on the following categories: Overall Rating, Readability, and Topic Authority.
    Your Overall Rating should factor in the following key metrics: Relevance, Accuracy, Clarity and Readability, Depth and Detail, Originality, Structure and Organization, Engagement, and SEO. You should not include anything regarding Visual Appeal in your Overall Rating.
    Your Readability Rating should factor in the following key metrics: Language and Vocabulary, Sentence Structure, Paragraph Structure, Logical Flow, Consistency, Readability Scores, Visual Aids, Typography, and Layout.
    Also provide the Flesch Reading Ease Score (FRES).
    Also provide the Tone of Voice for the content in one of the following categories: Very Casual, Somewhat Casual, Neutral, Somewhat Formal, and Very Formal. Your Tone of Voice rating must be only from one of these five selections.
    Your Topic Authority Rating should factor in the following key metrics: Citation of Sources, Depth of Content, Accuracy and Fact-Checking, Currency of Information, Originality, and Relevance of Content. You should not include anything regarding Feedback and Engagement, Recognition and Endorsements, Balance and Fairness, and Expertise of the Author in your Topic Authority Rating.
    Your feedback should meticulously justify your rating with specific examples from the content that demonstrate the effectiveness of the content. Your feedback should be a minimum of 5 sentences for each category.
    Also provide 5 suggestions on how they can improve their rating in each category. You should base your suggestions on specific gaps or weaknesses you identify during your analysis. Each suggestion should be actionable and clearly tied to potential improvements in improving the quality of the content. In your response, do not number your suggestions.
    Also provide what their Potential Rating in each category could be if the suggested improvements were implemented.
    It is absolutely imperative that your answer be given exactly in the provided JSON format with only the following Keys used: "Rating" which is a Float, "Potential Rating" which is a Float, "Feedback" which is a String and should not have any new line characters, and "Suggestions for Improvement" which is an array of Strings. Do not add anything outside of the braces of the JSON object.
    Context: {context}
    Primary Audience and Keywords: {audience}
    Format: {format}`;

    const promptTemplate2 = `You are a bot that specializes in analyzing the content of a content creator's website and rating the quality of that content.
    Given a set of context articles, the primary audience for those articles, and the top keywords to reach that audience, make sure to give a rating from 1-10, on the following categories: Content Value, SEO Optimization, Keyword Usage, and Meta Tags.
    Your Content Value Rating should factor in the following key metrics: Utility, Informativeness, Relevance, Uniqueness, Depth and Detail, Actionability, Quality of Presentation, and Credibility. You should not include anything regarding Emotional Impact or Engagement in your Content Value Rating.
    Your SEO Rating should factor in the following key metrics: Keyword Optimization, Content Quality, Internal and External Linking, Image Optimization, Content Length, and Meta Tags. You should not include anything regarding URL Structure, User Engagement, or Page Load Speed in your SEO Rating.
    Your Keyword Usage Rating should factor in the following key metrics: Relevance of Keywords, Keyword Placement, Density of Keywords, Variety of Keywords, Natural Integration, Keyword Competition, Keyword Consistency, and Keyword Intent.
    Your Meta Tag Rating should factor in the following key metrics: Meta Title Relevance and Clarity, Meta Tag Types, Meta Title Length, Meta Description Relevance, Meta Description Length, Meta Tag Keyword Integration, and Meta Tag Uniqueness.
    Your feedback should meticulously justify your rating with specific examples from the content that demonstrate the effectiveness of the content. Your feedback should be a minimum of 5 sentences for each category.
    Also provide 5 suggestions on how they can improve their rating in each category. You should base your suggestions on specific gaps or weaknesses you identify during your analysis. Each suggestion should be actionable and clearly tied to potential improvements in improving the quality of the content. In your response, do not number your suggestions.
    Also provide what their Potential Rating in each category could be if the suggested improvements were implemented.
    It is absolutely imperative that your answer be given exactly in the provided JSON format with only the following Keys used: "Rating" which is a Float, "Potential Rating" which is a Float, "Feedback" which is a String and should not have any new line characters, and "Suggestions for Improvement" which is an array of Strings. Do not add anything outside of the braces of the JSON object.
    Context: {context}
    Primary Audience and Keywords: {audience}
    Format: {format}`;

    // Invoke LLM chain for various prompts
    const responses = await Promise.all([
      invokeLLMChain(promptTemplate, context, {
        audience: response,
        format,
      }),
      invokeLLMChain(promptTemplate2, context, {
        audience: response,
        format: format2,
      }),
    ]);

    results.ratings1 = JSON.parse(cleanText(responses[0]));
    results.ratings2 = JSON.parse(cleanText(responses[1]));
    console.log("RESULTS\n\n", results);
    results.originalUrl = originalUrl;
    results.subdomain = domainNameWithTLD;
    // Save results to Redis
    await saveResultsToRedis(shortURL, results, redisClient);
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
