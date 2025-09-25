import esClient from "../config/elasticsearch";
import { EmailData } from "./emailProcessor.service";

// Save email to Elasticsearch
export async function saveEmail(email: EmailData) {
  const response = await esClient.index({
    index: "emails",
    id: `${email.account}-${email.messageId}`,
    document: email,
  });

  console.log("Email saved successfully:", response);
}

// Search email in Elasticsearch
export async function searchEmail(query: string) {
  const response = await esClient.search({
    index: "emails",
    query: {
      multi_match: {
        query: query,
        fields: ["subject", "from", "body", "account", "date"],
      },
    },
  });

  console.log(response);

  return response.hits.hits;
}
