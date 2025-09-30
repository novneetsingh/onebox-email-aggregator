import { Worker } from "bullmq";
import redis from "../config/redis";
import { sendSlackNotification } from "./notification.service";
import { saveEmailsInBulk, saveEmail } from "./elasticsearch.service";
import { Job } from "bullmq";
import { EmailData } from "./emailProcessor.service";

// create workers
export const startWorkers = () => {
  console.log("Workers started...");

  // save email worker
  new Worker(
    "incoming-email",
    async (job: Job) => {
      if (job.name === "process-batch-emails") {
        const emails: EmailData[] = job.data;
        await saveEmailsInBulk(emails);

        console.log(
          `💾 Saved ${emails.length} historical emails in Elasticsearch.`
        );
      } else if (job.name === "process-incoming-email") {
        const email: EmailData = job.data;
        await saveEmail(email);

        console.log(`💾 Saved new email in Elasticsearch.`);
      }
    },
    {
      connection: redis,
      concurrency: 10,
    }
  );

  // send notification worker
  new Worker(
    "send-notification",
    async (job: Job) => {
      const email: EmailData = job.data;
      await sendSlackNotification(email);

      console.log(`🚀 Sent notification for email ${email.messageId}`);
    },
    {
      connection: redis,
      concurrency: 10,
    }
  );
};
