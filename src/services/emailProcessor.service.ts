import { simpleParser } from "mailparser";
import { categorizeEmail } from "./geminiAI.service";

export interface EmailData {
  account: string;
  subject: string;
  from: string;
  to: string;
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
  const to: string =
    msg.envelope.to?.[0]?.address ||
    msg.envelope.cc?.[0]?.address ||
    msg.envelope.bcc?.[0]?.address;

  const email: EmailData = {
    account,
    subject,
    from: sender,
    to,
    date: msg.envelope.date,
    body: textBody,
    messageId: msg.envelope.messageId,
    folder: "INBOX",
    category: await categorizeEmail(sender, subject, textBody),
  };

  return email;
}

// Extract text body from the email
// This gives you only the plain text version (no HTML, no CSS, no headers)
export async function extractTextBody(source: string): Promise<string> {
  const parsedText = (await simpleParser(source)).text?.trim();

  // if parsed text is empty or undefined, return the stripped html
  if (!parsedText || parsedText === "") {
    return stripHtml(source);
  }

  return parsedText;
}

// strip html from the email
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
