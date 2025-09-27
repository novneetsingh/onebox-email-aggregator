import { pinecone, pineconeIndex } from "../config/pinecone";
import { knowledgeBaseData } from "../utils/knowledgeBase";
import { PineconeRecord, EmbeddingsList } from "@pinecone-database/pinecone";

// insert embeddings into vectorDB
export async function insertEmbeddings() {
  const embeddings: PineconeRecord[] = await createEmbeddings();

  await pineconeIndex
    .namespace(process.env.PINECONE_NAMESPACE!)
    .upsert(embeddings);
}

// create embeddings from knowledge base data
export async function createEmbeddings(): Promise<PineconeRecord[]> {
  // Get the raw embeddings from Pinecone inference
  const rawEmbeddings: EmbeddingsList = await pinecone.inference.embed(
    process.env.PINECONE_EMBEDDING_MODEL!,
    knowledgeBaseData.map((item) => item.content),
    { inputType: "passage", truncate: "END" }
  );

  // Map raw embeddings to PineconeRecord format
  const records: PineconeRecord[] = knowledgeBaseData.map((item, idx) => ({
    id: idx.toString(),
    values: (rawEmbeddings.data[idx] as any).values,
    metadata: {
      category: item.category,
      content: item.content,
    },
  }));

  return records;
}

// delete embeddings from vectorDB
export async function deleteEmbeddings() {
  await pineconeIndex.namespace(process.env.PINECONE_NAMESPACE!).deleteAll();
}

// search embeddings
export async function searchEmbeddings(query: string) {
  const queryEmbeddings = await pinecone.inference.embed(
    process.env.PINECONE_EMBEDDING_MODEL!,
    [query],
    { inputType: "passage", truncate: "END" }
  );

  const results = await pineconeIndex
    .namespace(process.env.PINECONE_NAMESPACE!)
    .query({
      vector: (queryEmbeddings.data[0] as any).values,
      topK: 1,
      includeMetadata: true,
      filter: {
        category: {
          $eq: query,
        },
      },
    });

  return results.matches[0]?.metadata?.content;
}
