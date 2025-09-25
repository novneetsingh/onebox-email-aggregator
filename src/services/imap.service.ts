import { ImapFlow } from "imapflow";
import { processEmail } from "./emailProcessor.service";

export async function startImap(accountConfig: any) {
  const client = new ImapFlow(accountConfig);

  await client.connect();

  console.log(`✅ Connected to ${accountConfig.auth.user}`);

  // Lock inbox
  // let lock = await client.getMailboxLock("INBOX");

  // Open mailbox
  await client.mailboxOpen("INBOX");

  // Get date for 1 day ago
  const since = new Date();
  since.setDate(since.getDate() - 1);

  // Search for messages since that date
  const messages = await client.search({ since });

  if (!messages) {
    // console.log("📭 No emails found in the last 1 day");
    return;
  }

  // Fetch the matching messages
  for await (let msg of client.fetch(messages, {
    envelope: true,
    source: true,
  })) {
    await processEmail(accountConfig.name, msg);
  }

  // Real-time listener for new messages
  // client.on("exists", async (msgCount) => {
  //   const newMsg = await client.fetchOne(`${msgCount}`, {
  //     envelope: true,
  //     source: true,
  //   });
  //   console.log("⚡ New Email:", newMsg.envelope.subject);
  //   await processEmail(accountConfig.name, newMsg);
  // });

  // lock.release();

  // Don’t logout immediately — keep connection alive for IDLE mode
  // await client.logout();
}
