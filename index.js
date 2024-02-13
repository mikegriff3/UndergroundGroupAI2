import { ChatOpenAI } from "@langchain/openai";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { scrapeBlog } from "./webScraper.js";
import "dotenv/config";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { createClient } from "@supabase/supabase-js";
import { SupabaseVectorStore } from "langchain/vectorstores/supabase";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { retriever } from "./retriever.js";
import { combineDocuments } from "./combineDocuments.js";
import { generateRandomID } from "./generateRandomId.js";
import {
  RunnableSequence,
  RunnablePassthrough,
} from "@langchain/core/runnables";
import { formatDocumentsAsString } from "langchain/util/document";

const openAIApiKey = process.env.OPENAI_API_KEY;

const llm = new ChatOpenAI({ openAIApiKey });

let context;

// Scrape content and create embeddings.

// const blogUrl = "https://www.chasejarvis.com/blog/"; // Replace with the URL of the blog you want to scrape
// await scrapeBlog(blogUrl)
//   .then((aggregatedText) => {
//     //console.log("Aggregated Text:", aggregatedText);
//     context = aggregatedText;
//   })
//   .catch((error) => {
//     console.error("Error:", error);
//   });

// try {
//   const splitter = new RecursiveCharacterTextSplitter({
//     chunkSize: 500,
//     chunkOverlap: 50,
//   });
//   const docs = await splitter.createDocuments([context]);

//   //console.log("DOCS: ", docs);

//   const randomID = generateRandomID();

//   for (let doc in docs) {
//     docs[doc]["metadata"]["id"] = randomID;
//   }

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
// } catch (err) {
//   console.log(err);
// }

// const answerTemplate = `You are a bot that specializes in analyzing the content of a content creator's website and rate the quality of that content.
// Your primary goal will be to analyze the articles written on a website and indicate the company's primary demographic and what keywords will work best to reach that demographic.
// Please provide the ten best keywords to target their primary audience and also tell us what the target audience is.
// Only use the context provided to come up with your answer.
// context: {context}`;

// const prompt = PromptTemplate.fromTemplate(answerTemplate);

// const retrieval = await retriever.invoke(
//   "What is the company's target audience and provide the ten best keywords to target their primary audience and also tell us what the target audience is."
// );

// context = combineDocuments(retrieval);

// const chain = prompt.pipe(llm).pipe(new StringOutputParser());

// const response = await chain.invoke({
//   context: context,
// });

// console.log(response);
