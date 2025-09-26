import esClient from "../config/elasticsearch";
import geminiModel from "../config/geminiAI";
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
        fields: ["subject", "from", "body", "category"],
      },
    },
    sort: [{ date: { order: "desc" } }],
  });

  return response.hits.hits.map((hit) => hit._source);
}

// get all emails from Elasticsearch
export async function getAllEmails() {
  const response = await esClient.search({
    index: "openbox-emails",
    query: {
      match_all: {},
    },
    sort: [{ date: { order: "desc" } }],
    size: 100,
  });

  return response.hits.hits.map((hit) => hit._source);
}

// delete all emails from Elasticsearch
export async function deleteAllEmails() {
  await esClient.deleteByQuery({
    index: "openbox-emails",
    query: {
      match_all: {},
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
