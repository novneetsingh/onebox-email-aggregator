import axios from "axios";
import { EmailData } from "./emailProcessor.service";

// send slack notification
export async function sendSlackNotification(email: EmailData) {
  const message = {
    text: `🚀 New Interested Email!  
    From: ${email.from}  
    Subject: ${email.subject}
    Body: ${email.body}`,
  };

  await axios.post(process.env.SLACK_WEBHOOK_URL!, message, {
    headers: { "Content-Type": "application/json" },
  });

  
}
