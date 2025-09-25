export interface EmailData {
  account: string;
  subject: string;
  from: string;
  replyTo: string[];
  date: Date;
  body: string;
  messageId: string;
  folder: string;
}

// Transform the IMAP message and return it
export function processEmail(account: string, msg: any): EmailData {
  const email: EmailData = {
    account,
    subject: msg.envelope.subject,
    from: msg.envelope.from[0].address,
    replyTo: msg.envelope.replyTo.map((to: any) => to.address),
    date: msg.envelope.date,
    body: msg.source.toString(),
    messageId: msg.envelope.messageId,
    folder: "INBOX",
  };

  return email;
}
