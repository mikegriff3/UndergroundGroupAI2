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

const openAIApiKey = process.env.OPENAI_API_KEY;

const llm = new ChatOpenAI({
  openAIApiKey,
  //temperature: 0.9,
  //modelName: "gpt-4",
});

let context;
let metas;

// Create randomID to store in database metadata
const randomID = generateRandomID();

async function runAnalysis() {
  try {
    const blogUrl = "https://www.theundergroundgroup.com/blog-temp"; // Replace with the URL of the blog you want to scrape
    const { aggregatedText, aggregatedMetaTags } = await scrapeBlog(blogUrl);

    // Initialize Supabase client
    const sbApiKey = process.env.SUPA_API_KEY;
    const sbUrl = process.env.SUPA_URL;
    const client = createClient(sbUrl, sbApiKey);

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 2250,
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

    const format = `Rating: X.X/10

    Feedback: <String>

    Suggestions for improvement:
    1. <String>
    2. <String>
    3. <String>
    4. <String>
    5. <String>`;

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
// Given a set of context articles, the primary audience for those articles, and the top keywords to reach that audience, make sure to give a rating from 1-10, with 1 being the worst and 10 being the best, on how well they are effectively reaching out to their audience.
// Also provide 5 suggestions on how they can improve their overall grade.
// Your answer should be given exactly in the provided format.
// Context: {context}
// Primary Audience and Keywords: {audience}
// Format: {format}`;

    const readabilityTemplate = `You are a bot that specializes in analyzing the content of a content creator's website and rate the quality of that content.
// Given a set of context articles, the primary audience for those articles, and the top keywords to reach that audience, make sure to give a rating from 1-10, with 1 being the worst and 10 being the best, on how readable their content is.
// Also provide 5 suggestions on how they can improve their articles to be more readable.
// Your answer should be given exactly in the provided format.
// Context: {context}
// Primary Audience and Keywords: {audience}
// Format: {format}`;

    const topicAuthorityTemplate = `You are a bot that specializes in analyzing the content of a content creator's website and rate the quality of that content.
// Given a set of context articles, the primary audience for those articles, and the top keywords to reach that audience, make sure to give a rating from 1-10, with 1 being the worst and 10 being the best, on how well they represent Topic Authority.
// Also provide 5 suggestions on how they can improve their articles to be have more topic authority.
// Your answer should be given exactly in the provided format.
// Context: {context}
// Primary Audience and Keywords: {audience}
// Format: {format}`;

    const externalLinkingTemplate = `You are a bot that specializes in analyzing the content of a content creator's website and rate the quality of that content.
// Given a set of context articles, the primary audience for those articles, and the top keywords to reach that audience, make sure to give a rating from 1-10, with 1 being the worst and 10 being the best, on how well they are taking advantage of External Linking for SEO.
// Also provide 5 suggestions on how they can improve their articles to be have better external linking.
// Your answer should be given exactly in the provided format.
// Context: {context}
// Primary Audience and Keywords: {audience}
// Format: {format}`;

    const metasTemplate = `You are a bot that specializes in analyzing the content of a content creator's website and rate the quality of that content.
// Given a set of context articles, the primary audience for those articles, the top keywords to reach that audience, and the meta tags found on those articles, make sure to give a rating from 1-10, with 1 being the worst and 10 being the best, on how well they are taking advantage of using meta tags for SEO.
// Also provide 5 suggestions on how they can improve their meta tag usage for SEO purposes.
// Your answer should be given exactly in the provided format.
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
        format,
      }),
      invokeLLMChain(topicAuthorityTemplate, context, {
        audience: response,
        format,
      }),
      invokeLLMChain(externalLinkingTemplate, context, {
        audience: response,
        format,
      }),
      invokeLLMChain(metasTemplate, context, {
        audience: response,
        metas,
        format,
      }),
    ]);

    console.log("GRADE:", responses[0]);
    console.log("Readability:", responses[1]);
    console.log("Topic Authority:", responses[2]);
    console.log("External Linking:", responses[3]);
    console.log("META TAGS:", responses[4]);
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

runAnalysis();

// Scrape content and create embeddings.

// const blogUrl = "https://www.theundergroundgroup.com/blog-temp"; // Replace with the URL of the blog you want to scrape
// await scrapeBlog(blogUrl)
//   .then(({ aggregatedText, aggregatedMetaTags }) => {
//     //console.log("Aggregated Text:", aggregatedText);
//     //console.log("Aggregated Metas:", aggregatedMetaTags);
//     context = aggregatedText;
//     metas = aggregatedMetaTags;
//   })
//   .catch((error) => {
//     console.error("Error:", error);
//   });

// try {
//   const splitter = new RecursiveCharacterTextSplitter({
//     chunkSize: 2250,
//     chunkOverlap: 100,
//   });
//   const docs = await splitter.createDocuments([context]);

//   const metaSplitter = new RecursiveCharacterTextSplitter({
//     chunkSize: 2000,
//     chunkOverlap: 0,
//     separators: ["\n\n"],
//   });

//   const metaChunks = await metaSplitter.createDocuments([metas]);

//   //console.log(metaChunks);

//   for (let doc in docs) {
//     docs[doc]["metadata"]["id"] = randomID;
//   }

//   for (let chunk in metaChunks) {
//     metaChunks[chunk]["metadata"]["id"] = randomID;
//   }

//   //console.log("META CHUNKS: ", metaChunks);

//   const sbApiKey = process.env.SUPA_API_KEY;
//   const sbUrl = process.env.SUPA_URL;

//   const client = createClient(sbUrl, sbApiKey);

//   await SupabaseVectorStore.fromDocuments(
//     docs,
//     new OpenAIEmbeddings({ openAIApiKey }),
//     {
//       client,
//       tableName: "documents",
//     }
//   );
//   // Add meta chunks to Metas database.
//   await SupabaseVectorStore.fromDocuments(
//     metaChunks,
//     new OpenAIEmbeddings({ openAIApiKey }),
//     {
//       client,
//       tableName: "metas",
//     }
//   );
// } catch (err) {
//   console.log(err);
// }

// const retriever = buildRetriever(randomID);
// const metasRetriever = buildMetasRetriever(randomID);

// const retrieval = await retriever.invoke(
//   "What is the company's target audience and provide the ten best keywords to target their primary audience and also tell us what the target audience is."
// );
// const metasRetrieval = await metasRetriever.invoke(
//   "Find the meta tags that most accurately represent the target audience that the company is trying to target."
// );

// //console.log("METAS RETRIEVED: ", metasRetrieval);

// context = combineDocuments(retrieval);
// metas = combineDocuments(metasRetrieval);

// const format = `Rating: X.X/10

// Feedback: <String>

// Suggestions for improvement:
// 1. <String>
// 2. <String>
// 3. <String>
// 4. <String>
// 5. <String>
// `;

// const audienceTemplate = `You are a bot that specializes in analyzing the content of a content creator's website and rate the quality of that content.
// Your primary goal will be to analyze the articles written on a website and indicate the company's primary demographic and what keywords will work best to reach that demographic.
// Please provide the ten best keywords to target their primary audience using SEO and also tell us what the target audience is.
// Only use the context provided to come up with your answer. Ignore any context about emails, terms of service, feedback, or newsletters.
// context: {context}`;

// const audiencePrompt = PromptTemplate.fromTemplate(audienceTemplate);

// const chain = audiencePrompt.pipe(llm).pipe(new StringOutputParser());

// const response = await chain.invoke({
//   context: context,
// });

// console.log("\nTARGET AUDIENCE & KEYWORDS");
// console.log("-------------------------------");
// console.log(response);

// const overallGradingTemplate = `You are a bot that specializes in analyzing the content of a content creator's website and rate the quality of that content.
// Given a set of context articles, the primary audience for those articles, and the top keywords to reach that audience, make sure to give a rating from 1-10, with 1 being the worst and 10 being the best, on how well they are effectively reaching out to their audience.
// Also provide 5 suggestions on how they can improve their overall grade.
// Your answer should be given exactly in the provided format.
// Context: {context}
// Primary Audience and Keywords: {audience}
// Format: {format}`;

// const overallGradingPrompt = PromptTemplate.fromTemplate(
//   overallGradingTemplate
// );

// const chain2 = overallGradingPrompt.pipe(llm).pipe(new StringOutputParser());

// const response2 = await chain2.invoke({
//   context: context,
//   audience: response,
//   format: format,
// });

// console.log("\nGRADE");
// console.log("-------------------------------");
// console.log(response2);

// const readabilityTemplate = `You are a bot that specializes in analyzing the content of a content creator's website and rate the quality of that content.
// // Given a set of context articles, the primary audience for those articles, and the top keywords to reach that audience, make sure to give a rating from 1-10, with 1 being the worst and 10 being the best, on how readable their content is.
// // Also provide 5 suggestions on how they can improve their articles to be more readable.
// // Your answer should be given exactly in the provided format.
// // Context: {context}
// // Primary Audience and Keywords: {audience}
// // Format: {format}`;

// const readabilityPrompt = PromptTemplate.fromTemplate(readabilityTemplate);

// const chain3 = readabilityPrompt.pipe(llm).pipe(new StringOutputParser());

// const response3 = await chain3.invoke({
//   context: context,
//   audience: response,
//   format: format,
// });

// console.log("\nReadability");
// console.log("-------------------------------");
// console.log(response3);

// const topicAuthorityTemplate = `You are a bot that specializes in analyzing the content of a content creator's website and rate the quality of that content.
// // Given a set of context articles, the primary audience for those articles, and the top keywords to reach that audience, make sure to give a rating from 1-10, with 1 being the worst and 10 being the best, on how well they represent Topic Authority.
// // Also provide 5 suggestions on how they can improve their articles to be have more topic authority.
// // Your answer should be given exactly in the provided format.
// // Context: {context}
// // Primary Audience and Keywords: {audience}
// // Format: {format}`;

// const topicAuthorityPrompt = PromptTemplate.fromTemplate(
//   topicAuthorityTemplate
// );

// const chain4 = topicAuthorityPrompt.pipe(llm).pipe(new StringOutputParser());

// const response4 = await chain4.invoke({
//   context: context,
//   audience: response,
//   format: format,
// });

// console.log("Topic Authority");
// console.log("-------------------------------");
// console.log(response4);

// const externalLinkingTemplate = `You are a bot that specializes in analyzing the content of a content creator's website and rate the quality of that content.
// // Given a set of context articles, the primary audience for those articles, and the top keywords to reach that audience, make sure to give a rating from 1-10, with 1 being the worst and 10 being the best, on how well they are taking advantage of External Linking for SEO.
// // Also provide 5 suggestions on how they can improve their articles to be have better external linking.
// // Your answer should be given exactly in the provided format.
// // Context: {context}
// // Primary Audience and Keywords: {audience}
// // Format: {format}`;

// const externalLinkingPrompt = PromptTemplate.fromTemplate(
//   externalLinkingTemplate
// );

// const chain5 = externalLinkingPrompt.pipe(llm).pipe(new StringOutputParser());

// const response5 = await chain5.invoke({
//   context: context,
//   audience: response,
//   format: format,
// });

// console.log("External Linking");
// console.log("-------------------------------");
// console.log(response5);

// const metasTemplate = `You are a bot that specializes in analyzing the content of a content creator's website and rate the quality of that content.
// // Given a set of context articles, the primary audience for those articles, the top keywords to reach that audience, and the meta tags found on those articles, make sure to give a rating from 1-10, with 1 being the worst and 10 being the best, on how well they are taking advantage of using meta tags for SEO.
// // Also provide 5 suggestions on how they can improve their meta tag usage for SEO purposes.
// // Your answer should be given exactly in the provided format.
// // Context: {context}
// // Primary Audience and Keywords: {audience}
// // Meta Tags: {metas}
// // Format: {format}`;

// const metasPrompt = PromptTemplate.fromTemplate(metasTemplate);

// const chain6 = metasPrompt.pipe(llm).pipe(new StringOutputParser());

// const response6 = await chain6.invoke({
//   context: context,
//   audience: response,
//   metas: metas,
//   format: format,
// });

// console.log("META TAGS");
// console.log("-------------------------------");
// console.log(response6);
