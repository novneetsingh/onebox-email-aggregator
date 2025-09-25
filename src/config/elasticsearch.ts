import { Client } from "@elastic/elasticsearch";

const esClient = new Client({
  node: "http://localhost:9200",
});

export async function checkEsConnection() {
  try {
    const response = await esClient.ping();

    if (response) {
      console.log("✅ Elasticsearch connection is healthy.");
      return;
    }
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

export default esClient;
