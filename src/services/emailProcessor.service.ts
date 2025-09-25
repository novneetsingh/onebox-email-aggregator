import { saveEmail } from "./openbox.service";

export interface EmailData {
  account: string;
  subject: string;
  from: string;
  to: string[];
  date: Date;
  body: string;
  messageId: string;
  folder: string;
}

// Process email and save to Elasticsearch
export async function processEmail(account: string, msg: any) {
  const email: EmailData = {
    account,
    subject: msg.envelope.subject,
    from: msg.envelope.from[0].address,
    to: msg.envelope.to.map((to: any) => to.address),
    date: msg.envelope.date,
    body: msg.source.toString(),
    messageId: msg.envelope.messageId,
    folder: "INBOX",
  };

  await saveEmail(email);
}
