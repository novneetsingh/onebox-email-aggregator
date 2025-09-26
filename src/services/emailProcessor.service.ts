import { categorizeEmail } from "./openbox.service";
import { simpleParser } from "mailparser";

export interface EmailData {
  account: string;
  subject: string;
  from: string;
  date: Date;
  body: string;
  messageId: string;
  folder: string;
  category: string;
}

// Transform the IMAP message and return it
export async function processEmail(
  account: string,
  msg: any
): Promise<EmailData> {
  const textBody: string = await extractTextBody(msg.source.toString());
  const sender: string = msg.envelope.from[0].address;
  const subject: string = msg.envelope.subject;

  const email: EmailData = {
    account,
    subject,
    from: sender,
    date: msg.envelope.date,
    body: textBody,
    messageId: msg.envelope.messageId,
    folder: "INBOX",
    category: await categorizeEmail(sender, subject, textBody),
  };

  return email;
}

// Extract text body from the email
export async function extractTextBody(source: string): Promise<string> {
  const parsed = await simpleParser(source);

  // This gives you only the plain text version (no HTML, no CSS, no headers)
  return parsed.text || "";
}
