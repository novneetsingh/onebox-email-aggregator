import geminiModel from "../config/geminiAI";

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
