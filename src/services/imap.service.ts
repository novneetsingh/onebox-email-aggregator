import { ImapFlow } from "imapflow";
import { processEmail, EmailData } from "./emailProcessor.service";
import { saveEmailsInBulk, saveEmail } from "./openbox.service";
import { sendSlackNotification } from "./notification.service";

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
    let emailBatch: EmailData[] = [];

    for await (let msg of client.fetch(messages, {
      envelope: true,
      source: true,
    })) {
      emailBatch.push(await processEmail(accountConfig.name, msg));
    }

    if (emailBatch.length > 0) {
      await saveEmailsInBulk(emailBatch);

      console.log(`💾 Saved ${emailBatch.length} emails.`);
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

    const email = await processEmail(accountConfig.name, newMsg);

    // Save email and send slack notification if email is interested
    await Promise.all([
      saveEmail(email),
      email.category === "Interested" && sendSlackNotification(email),
    ]);

    console.log("💾 Saved new email.");
  });
}
