import geminiModel from "../config/geminiAI";
import ErrorResponse from "../utils/errorResponse";
import { getEmailById } from "./elasticsearch.service";
import { searchEmbeddings } from "./vectorDB.service";

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

  const category = (await geminiModel.invoke(prompt)).content as string;

  return category;
}

// Generate suggested reply using Gemini AI
export async function generateSuggestedReply(messageId: string) {
  // fetch email from Elasticsearch
  const email = await getEmailById(messageId);

  if (!email) throw new ErrorResponse("Email not found", 404);

  // search agenda/context from Pinecone
  const agendaMatches = await searchEmbeddings(email.category);

  if (!agendaMatches) throw new ErrorResponse("Agenda not found", 404);

  const prompt = `
  You are an AI assistant suggesting professional replies to emails.

  Context (agenda/product details):
  """${agendaMatches}"""

  Incoming Email:
  From: ${email.from}
  Subject: ${email.subject}
  Body:
  """${email.body}"""

  Write a polite, professional reply email body for the incoming email for me to send.

  Keep it very concise and to the point.

  create reply message according to the Context (agenda/product details) that I provided.`;

  const response = (await geminiModel.invoke(prompt)).content as string;

  return response;
}
