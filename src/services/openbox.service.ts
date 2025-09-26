import esClient from "../config/elasticsearch";
import geminiModel from "../config/geminiAI";
import { EmailData } from "./emailProcessor.service";

// create a index in elasticsearch
export async function createIndex() {
  await esClient.indices.create({
    index: "openbox-emails",
    body: {
      mappings: {
        properties: {
          account: { type: "keyword" },
          messageId: { type: "keyword" },
          folder: { type: "keyword" },
          subject: { type: "text" },
          from: { type: "text" },
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
    index: "openbox-emails",
    id: `${email.account}-${email.messageId}`,
    body: email,
    refresh: true,
  });
}

// Save emails in bulk in Elasticsearch
export async function saveEmailsInBulk(emails: EmailData[]) {
  const exists = await esClient.indices.exists({ index: "openbox-emails" });
  if (!exists.body) {
    await createIndex();
  }

  const body = emails.flatMap((email) => [
    {
      index: {
        _index: "openbox-emails",
        _id: `${email.account}-${email.messageId}`,
      },
    },
    email,
  ]);

  await esClient.bulk({ body, refresh: true });
}

// Search emails in Elasticsearch
export async function searchEmail(query: string) {
  const response = await esClient.search({
    index: "openbox-emails",
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

// Get all emails from Elasticsearch
export async function getAllEmails() {
  const response = await esClient.search({
    index: "openbox-emails",
    body: {
      query: { match_all: {} },
      sort: [{ date: { order: "desc" } }],
      size: 100,
    },
  });

  return response.body.hits.hits.map((hit: any) => hit._source);
}

// Delete all emails from Elasticsearch
export async function deleteAllEmails() {
  await esClient.deleteByQuery({
    index: "openbox-emails",
    body: {
      query: { match_all: {} },
    },
  });
}

// Categorize email using Gemini AI
export async function categorizeEmail(
  from: string,
  subject: string,
  body: string
): Promise<string> {
  const prompt = `
    You are an email classifier.
    Categories: ["Interested", "Meeting Booked", "Not Interested", "Spam", "Out of Office"]

    Classify the following email into exactly one of the categories.

    From: "${from}"
    Subject: "${subject}"
    Body:
    """${body}"""

    Answer with only the category name.
  `;

  const result = await geminiModel.generateContent(prompt);
  const category = result.response.text().trim();

  return category;
}
