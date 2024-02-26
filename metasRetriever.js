import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings } from "@langchain/openai";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const openAIApiKey = process.env.OPENAI_API_KEY;

const embeddings = new OpenAIEmbeddings({ openAIApiKey });
const sbApiKey = process.env.SUPA_API_KEY;
const sbUrl = process.env.SUPA_URL;
const client = createClient(sbUrl, sbApiKey);

const vectorStoreMetas = new SupabaseVectorStore(embeddings, {
  client,
  tableName: "metas",
  queryName: "match_documents_metas",
});

export function buildMetasRetriever(blogID) {
  let searchKwargs = { k: 5, filter: { id: blogID } };
  return vectorStoreMetas.asRetriever((searchKwargs = searchKwargs));
}
// const retriever = vectorStore.asRetriever();

// export { retriever };
