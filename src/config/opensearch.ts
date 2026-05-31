import { Client } from "@opensearch-project/opensearch";
import logger from "../utils/logger";

export const openSearchClient = new Client({
  node: process.env.OPENSEARCH_URL!,
});

export const openSearchIndexName = process.env.OS_INDEX_NAME!;

export async function checkOpenSearchConnection() {
  try {
    await openSearchClient.info();
    logger.info("✅ OpenSearch connection established");
  } catch (error) {
    logger.error("❌ OpenSearch connection failed:", error);
    process.exit(1);
  }
}
