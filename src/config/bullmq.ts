import { Queue } from "bullmq";
import { redisClient } from "./redis";

const config = {
  connection: redisClient,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: 20,
  },
};

// Gmail webhook sync queue — triggered by Google Pub/Sub push
export const gmailWebhookSyncQueue = new Queue("gmail-webhook-sync", config);

// Gmail backfill queue — runs once on account connect, fetches last 30 days
export const gmailBackfillQueue = new Queue("gmail-backfill", config);

// Gmail watch renewal queue — repeating job, renews Pub/Sub watch every 6 days
export const gmailWatchRenewalQueue = new Queue("gmail-watch-renewal", config);
