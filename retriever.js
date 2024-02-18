import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings } from "@langchain/openai";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const openAIApiKey = process.env.OPENAI_API_KEY;

const embeddings = new OpenAIEmbeddings({ openAIApiKey });
const sbApiKey = process.env.SUPA_API_KEY;
const sbUrl = process.env.SUPA_URL;
const client = createClient(sbUrl, sbApiKey);

const vectorStore = new SupabaseVectorStore(embeddings, {
  client,
  tableName: "documents",
  queryName: "match_documents",
});

export function buildRetriever(blogID) {
  let searchKwargs = { k: 15, filter: { id: blogID } };
  return vectorStore.asRetriever((searchKwargs = searchKwargs));
}
// const retriever = vectorStore.asRetriever();

// export { retriever };
