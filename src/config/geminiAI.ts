import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import logger from "../utils/logger";

export const geminiModel = new ChatGoogleGenerativeAI({
  model: "gemini-3.5-flash",
  apiKey: process.env.GEMINI_API_KEY!,
});

export const checkGeminiConnection = async () => {
  try {
    await geminiModel.invoke("Hello Gemini");
    logger.info("✅ Gemini connection established");
  } catch (error) {
    logger.error("❌ Gemini connection failed:", error);
    process.exit(1);
  }
};
