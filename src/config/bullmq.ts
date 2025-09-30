import { Queue } from "bullmq";
import redis from "./redis";

const config = {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
};

// incoming email queue
export const incomingEmailQueue = new Queue("incoming-email", config);

// notification queue
export const notificationQueue = new Queue("send-notification", config);
