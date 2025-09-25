import { saveEmail } from "./openbox.service";

export interface EmailData {
  account: string;
  subject: string;
  from: string;
  to: string[];
  date: string;
  body: string;
  messageId: string;
  folder: string;
}

export async function processEmail(account: string, msg: any) {
  const email: EmailData = {
    account,
    subject: msg.envelope.subject,
    from: msg.envelope.from[0].address,
    to: msg.envelope.to.map((to: any) => to.address),
    date: msg.envelope.date.toISOString(),
    body: msg.source.toString(),
    messageId: msg.envelope.messageId,
    folder: msg.envelope.folder,
  };

  // console.log("📩 New Email:", email);

  await saveEmail(email);
}
