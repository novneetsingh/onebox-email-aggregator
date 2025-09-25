import esClient from "../config/elasticsearch";
import { EmailData } from "./emailProcessor.service";

// Save email to Elasticsearch
export async function saveEmail(email: EmailData) {
  await esClient.index({
    index: "openbox-emails",
    id: `${email.account}-${email.messageId}`,
    document: email,
  });
}

// Search email in Elasticsearch
export async function searchEmail(query: string) {
  const response = await esClient.search({
    index: "openbox-emails",
    query: {
      multi_match: {
        query: query,
        fields: ["subject", "from", "body", "account", "date"],
      },
    },
    _source: ["subject", "from", "account", "date"],
  });

  return response.hits.hits;
}

// get all emails from Elasticsearch
export async function getAllEmails() {
  const response = await esClient.search({
    index: "openbox-emails",
    query: {
      match_all: {},
    },
    _source: ["subject", "from", "account", "date"],
  });

  return response.hits.hits;
}
