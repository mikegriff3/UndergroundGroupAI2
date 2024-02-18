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
import {
  RunnableSequence,
  RunnablePassthrough,
} from "@langchain/core/runnables";

const openAIApiKey = process.env.OPENAI_API_KEY;

const llm = new ChatOpenAI({
  openAIApiKey,
  //temperature: 0.9,
  modelName: "gpt-4",
});

let context;

// Create randomID to store in database metadata
const randomID = generateRandomID();

// Scrape content and create embeddings.

const blogUrl = "https://www.fluxx.io/blog"; // Replace with the URL of the blog you want to scrape
await scrapeBlog(blogUrl)
  .then((aggregatedText) => {
    //console.log("Aggregated Text:", aggregatedText);
    context = aggregatedText;
  })
  .catch((error) => {
    console.error("Error:", error);
  });

try {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1500,
    chunkOverlap: 100,
  });
  const docs = await splitter.createDocuments([context]);

  //console.log("DOCS: ", docs);

  for (let doc in docs) {
    docs[doc]["metadata"]["id"] = randomID;
  }

  const sbApiKey = process.env.SUPA_API_KEY;
  const sbUrl = process.env.SUPA_URL;

  const client = createClient(sbUrl, sbApiKey);

  await SupabaseVectorStore.fromDocuments(
    docs,
    new OpenAIEmbeddings({ openAIApiKey }),
    {
      client,
      tableName: "documents",
    }
  );
} catch (err) {
  console.log(err);
}

const retriever = buildRetriever(randomID);

const retrieval = await retriever.invoke(
  "What is the company's target audience and provide the ten best keywords to target their primary audience and also tell us what the target audience is."
);

//console.log("DOCUMENTS RETRIEVED: ", retrieval);

context = combineDocuments(retrieval);

const audienceTemplate = `You are a bot that specializes in analyzing the content of a content creator's website and rate the quality of that content.
Your primary goal will be to analyze the articles written on a website and indicate the company's primary demographic and what keywords will work best to reach that demographic.
Please provide the ten best keywords to target their primary audience using SEO and also tell us what the target audience is.
Only use the context provided to come up with your answer. Ignore any context about emails, terms of service, feedback, or newsletters.
context: {context}`;

const audiencePrompt = PromptTemplate.fromTemplate(audienceTemplate);

const chain = audiencePrompt.pipe(llm).pipe(new StringOutputParser());

const response = await chain.invoke({
  context: context,
});

console.log("\nTARGET AUDIENCE & KEYWORDS");
console.log("-------------------------------");
console.log(response);

const overallGradingTemplate = `You are a bot that specializes in analyzing the content of a content creator's website and rate the quality of that content.
Given a set of context articles, the primary audience for those articles, and the top keywords to reach that audience, make sure to give a rating from 1-10, with 1 being the worst and 10 being the best, on how well they are effectively reaching out to their audience.
Context: {context}
Primary Audience and Keywords: {audience}`;

// const overallGradingTemplate = `You are a bot that specializes in analyzing the content of a content creator's website and rate the quality of that content.
// Given a set of context articles, the primary audience for those articles, and the top keywords to reach that audience, make sure to give a rating from 1-10, with 1 being the worst and 10 being the best, on how well they are effectively reaching out to their audience.
// Also provide suggestions on how they can improve their articles to better capture their primary audience.
// Context: {context}
// Primary Audience and Keywords: {audience}`;

const overallGradingPrompt = PromptTemplate.fromTemplate(
  overallGradingTemplate
);

const chain2 = overallGradingPrompt.pipe(llm).pipe(new StringOutputParser());

const response2 = await chain2.invoke({
  context: context,
  audience: response,
});

console.log("\nGRADE");
console.log("-------------------------------");
console.log(response2);

const readabilityTemplate = `You are a bot that specializes in analyzing the content of a content creator's website and rate the quality of that content.
// Given a set of context articles, the primary audience for those articles, and the top keywords to reach that audience, make sure to give a rating from 1-10, with 1 being the worst and 10 being the best, on how readable their content is.
// Also provide suggestions on how they can improve their articles to be more readable.
// Context: {context}
// Primary Audience and Keywords: {audience}`;

const readabilityPrompt = PromptTemplate.fromTemplate(readabilityTemplate);

const chain3 = readabilityPrompt.pipe(llm).pipe(new StringOutputParser());

const response3 = await chain3.invoke({
  context: context,
  audience: response,
});

console.log("\nReadability");
console.log("-------------------------------");
console.log(response3);

const topicAuthorityTemplate = `You are a bot that specializes in analyzing the content of a content creator's website and rate the quality of that content.
// Given a set of context articles, the primary audience for those articles, and the top keywords to reach that audience, make sure to give a rating from 1-10, with 1 being the worst and 10 being the best, on how well they represent Topic Authority.
// Also provide suggestions on how they can improve their articles to be have more topic authority.
// Context: {context}
// Primary Audience and Keywords: {audience}`;

const topicAuthorityPrompt = PromptTemplate.fromTemplate(
  topicAuthorityTemplate
);

const chain4 = topicAuthorityPrompt.pipe(llm).pipe(new StringOutputParser());

const response4 = await chain4.invoke({
  context: context,
  audience: response,
});

console.log("Topic Authority");
console.log("-------------------------------");
console.log(response4);

const externalLinkingTemplate = `You are a bot that specializes in analyzing the content of a content creator's website and rate the quality of that content.
// Given a set of context articles, the primary audience for those articles, and the top keywords to reach that audience, make sure to give a rating from 1-10, with 1 being the worst and 10 being the best, on how well they are taking advantage of External Linking for SEO.
// Also provide suggestions on how they can improve their articles to be have better external linking.
// Context: {context}
// Primary Audience and Keywords: {audience}`;

const externalLinkingPrompt = PromptTemplate.fromTemplate(
  externalLinkingTemplate
);

const chain5 = externalLinkingPrompt.pipe(llm).pipe(new StringOutputParser());

const response5 = await chain5.invoke({
  context: context,
  audience: response,
});

console.log("External Linking");
console.log("-------------------------------");
console.log(response5);
