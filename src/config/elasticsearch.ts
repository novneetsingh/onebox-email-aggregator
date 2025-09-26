import { Client } from "@elastic/elasticsearch";

const esClient = new Client({
  node: process.env.ES_URL!,
});

export async function checkEsConnection() {
  try {
    await esClient.ping();
    console.log("✅ Connected to Bonsai Elasticsearch.");
  } catch (error) {
    console.error("❌ Elasticsearch connection failed:", error);
    process.exit(1);
  }
}

export default esClient;
