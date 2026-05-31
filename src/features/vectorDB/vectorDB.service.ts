import { pinecone, pineconeIndex } from "../../config/pinecone";
import { knowledgeBaseData } from "../../utils/knowledgeBase";
import { PineconeRecord, EmbeddingsList } from "@pinecone-database/pinecone";

export async function insertEmbeddings() {
  const embeddings: PineconeRecord[] = await createEmbeddings();
  await pineconeIndex
    .namespace(process.env.PINECONE_NAMESPACE!)
    .upsert(embeddings);
}

async function createEmbeddings(): Promise<PineconeRecord[]> {
  const rawEmbeddings: EmbeddingsList = await pinecone.inference.embed(
    process.env.PINECONE_EMBEDDING_MODEL!,
    knowledgeBaseData.map((item) => item.content),
    { inputType: "passage", truncate: "END" },
  );

  return knowledgeBaseData.map((item, idx) => ({
    id: idx.toString(),
    values: (rawEmbeddings.data[idx] as any).values,
    metadata: { category: item.category, content: item.content },
  }));
}

export async function deleteEmbeddings() {
  await pineconeIndex.namespace(process.env.PINECONE_NAMESPACE!).deleteAll();
}

export async function searchEmbeddings(query: string) {
  const queryEmbeddings = await pinecone.inference.embed(
    process.env.PINECONE_EMBEDDING_MODEL!,
    [query],
    { inputType: "passage", truncate: "END" },
  );

  const results = await pineconeIndex
    .namespace(process.env.PINECONE_NAMESPACE!)
    .query({
      vector: (queryEmbeddings.data[0] as any).values,
      topK: 1,
      includeMetadata: true,
      filter: { category: { $eq: query } },
    });

  return results.matches[0]?.metadata?.content;
}
