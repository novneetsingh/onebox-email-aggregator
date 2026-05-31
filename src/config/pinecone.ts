import { Pinecone } from "@pinecone-database/pinecone";
import logger from "../utils/logger";

export const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

export const pineconeIndex = pinecone.index(process.env.PINECONE_INDEX_NAME!);

export const checkPineconeConnection = async () => {
  try {
    await pinecone.listIndexes();
    logger.info("✅ Pinecone connection established");
  } catch (error) {
    logger.error("❌ Pinecone connection failed:", error);
    process.exit(1);
  }
};
