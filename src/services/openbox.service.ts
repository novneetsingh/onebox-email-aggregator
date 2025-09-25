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

// save emails in bulk in Elasticsearch
export async function saveEmailsInBulk(emails: EmailData[]) {
  if (emails.length === 0) return;

  const operations = emails.flatMap((email) => [
    {
      index: {
        _index: "openbox-emails",
        _id: `${email.account}-${email.messageId}`,
      },
    },
    email,
  ]);

  await esClient.bulk({ operations });
}

// Search email in Elasticsearch
export async function searchEmail(query: string) {
  const response = await esClient.search({
    index: "openbox-emails",
    query: {
      multi_match: {
        query: query,
        fields: ["subject", "from", "body", "account"],
      },
    },
    _source: ["subject", "from", "account", "date"],
    sort: [{ date: { order: "desc" } }],
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
    sort: [{ date: { order: "desc" } }],
    size: 100,
  });

  return response.hits.hits;
}
