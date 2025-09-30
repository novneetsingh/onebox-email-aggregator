import { ImapFlow } from "imapflow";
import { processEmail, EmailData } from "./emailProcessor.service";
import { incomingEmailQueue, notificationQueue } from "../config/bullmq";

export async function startImap(accountConfig: any) {
  const client = new ImapFlow({ ...accountConfig, logger: false });
  await client.connect();

  console.log(`✅ Connected to ${accountConfig.auth.user}`);

  await client.mailboxOpen("INBOX");

  const since = new Date();
  since.setDate(since.getDate() - 30); // Fetches for the last 30 days

  const messages = await client.search({ since });

  // --- Initial Fetch with Local Batching ---
  if (messages && messages.length > 0) {
    let emails: EmailData[] = [];

    for await (let msg of client.fetch(messages, {
      envelope: true,
      source: true,
    })) {
      emails.push(await processEmail(accountConfig.name, msg));
    }

    if (emails.length > 0) {
      // enqueue batch to incoming-email queue
      await incomingEmailQueue.add("process-batch-emails", emails);
    }
  } else {
    console.log("📭 No new emails found in the last 30 days");
  }

  // --- Real-time listener for new messages ---
  client.on("exists", async (data) => {
    const newMsg = await client.fetchOne(`${data.count}`, {
      envelope: true,
      source: true,
    });

    const email: EmailData = await processEmail(accountConfig.name, newMsg);

    // enqueue to incoming-email queue and send notification if email is interested
    await Promise.all([
      incomingEmailQueue.add("process-incoming-email", email),
      email.category === "Interested" &&
        notificationQueue.add("send-notification", email),
    ]);
  });
}
