import esClient from "../config/elasticsearch";
import { EmailData } from "./emailProcessor.service";

// create a index in elasticsearch
export async function createIndex() {
  await esClient.indices.create({
    index: process.env.ES_INDEX_NAME!,
    body: {
      mappings: {
        properties: {
          account: { type: "keyword" },
          messageId: { type: "keyword" },
          folder: { type: "keyword" },
          subject: { type: "text" },
          from: { type: "text" },
          to: { type: "text" },
          body: { type: "text" },
          category: { type: "keyword" },
          date: { type: "date" },
        },
      },
    },
  });
}

// Save email to Elasticsearch
export async function saveEmail(email: EmailData) {
  await esClient.index({
    index: process.env.ES_INDEX_NAME!,
    id: email.messageId,
    body: email,
    refresh: true,
  });
}

// Save emails in bulk in Elasticsearch
export async function saveEmailsInBulk(emails: EmailData[]) {
  const exists = await esClient.indices.exists({
    index: process.env.ES_INDEX_NAME!,
  });
  if (!exists.body) {
    await createIndex();
  }

  const body = emails.flatMap((email) => [
    {
      index: {
        _index: process.env.ES_INDEX_NAME!,
        _id: email.messageId,
      },
    },
    email,
  ]);

  await esClient.bulk({ body, refresh: true });
}

// Search emails in Elasticsearch
export async function searchEmail(query: string) {
  const response = await esClient.search({
    index: process.env.ES_INDEX_NAME!,
    body: {
      query: {
        multi_match: {
          query,
          fields: ["subject", "from", "body", "category"],
        },
      },
      sort: [{ date: { order: "desc" } }],
    },
  });

  return response.body.hits.hits.map((hit: any) => hit._source);
}

// get a email by messageId
export async function getEmailById(messageId: string) {
  const response = await esClient.get({
    index: process.env.ES_INDEX_NAME!,
    id: messageId,
  });

  return response.body._source;
}

// Get all emails from Elasticsearch
export async function getAllEmails() {
  const response = await esClient.search({
    index: process.env.ES_INDEX_NAME!,
    body: {
      query: { match_all: {} },
      sort: [{ date: { order: "desc" } }],
      size: 100,
    },
  });

  return response.body.hits.hits.map((hit: any) => hit._source);
}

// delete a email by messageId
export async function deleteEmailById(messageId: string) {
  await esClient.delete({
    index: process.env.ES_INDEX_NAME!,
    id: messageId,
  });
}

// Delete all emails from Elasticsearch
export async function deleteAllEmails() {
  await esClient.deleteByQuery({
    index: process.env.ES_INDEX_NAME!,
    body: {
      query: { match_all: {} },
    },
  });
}
