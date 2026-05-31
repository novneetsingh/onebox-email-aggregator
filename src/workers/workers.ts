import { Worker, Job } from "bullmq";
import { redisClient } from "../config/redis";
import { prisma } from "../config/prisma";
import { openSearchClient } from "../config/opensearch";
import {
  fetchMessage,
  getNewMessageIds,
  registerGmailWatch,
} from "../gmail/gmail.service";
import sseBus from "../utils/sseBus";
import logger from "../utils/logger";

const OS_INDEX = process.env.OS_INDEX_NAME ?? "onebox-emails";

/** Saves a parsed email to Postgres + OpenSearch. Skips silently if already exists. */
const saveEmail = async (
  userId: string,
  accountId: string,
  parsed: Awaited<ReturnType<typeof fetchMessage>>,
) => {
  if (!parsed) return null;

  try {
    const email = await prisma.email.upsert({
      where: { messageId: parsed.messageId },
      create: {
        userId,
        accountId,
        messageId: parsed.messageId,
        threadId: parsed.threadId,
        subject: parsed.subject,
        snippet: parsed.snippet,
        body: parsed.body,
        from: parsed.from,
        to: parsed.to,
        folder: parsed.folder,
        category: "uncategorized",
        isRead: false,
        date: parsed.date,
      },
      update: {},
    });

    await openSearchClient.index({
      index: OS_INDEX,
      id: parsed.messageId,
      body: {
        userId,
        accountId,
        subject: parsed.subject,
        from: parsed.from,
        to: parsed.to,
        body: parsed.body,
        snippet: parsed.snippet,
        folder: parsed.folder,
        date: parsed.date,
      },
      refresh: false,
    });

    return email;
  } catch (err: any) {
    if (err?.code === "P2002") return null; // Already exists
    throw err;
  }
};

// ── Worker 1: gmail-webhook-sync ─────────────────────────────────────────────
new Worker(
  "gmail-webhook-sync",
  async (job: Job) => {
    const { accountId, userId, newHistoryId, previousHistoryId } = job.data;

    if (!previousHistoryId) {
      logger.info(
        `[webhook-sync] No previous historyId for ${accountId} — skipping`,
      );
      return;
    }

    const messageIds = await getNewMessageIds(accountId, previousHistoryId);
    logger.info(
      `[webhook-sync] ${messageIds.length} new message(s) for ${accountId}`,
    );

    for (const gmailMsgId of messageIds) {
      const parsed = await fetchMessage(accountId, gmailMsgId);
      const saved = await saveEmail(userId, accountId, parsed);

      if (saved) {
        sseBus.emit(userId, "new-email", {
          id: saved.id,
          subject: saved.subject,
          from: saved.from,
          snippet: saved.snippet,
          date: saved.date,
          folder: saved.folder,
          accountId: saved.accountId,
        });
        logger.info(`[webhook-sync] Saved & pushed: ${saved.subject}`);
      }
    }
  },
  { connection: redisClient, concurrency: 5 },
);

// ── Worker 2: gmail-backfill ──────────────────────────────────────────────────
new Worker(
  "gmail-backfill",
  async (job: Job) => {
    const { accountId, messageIds } = job.data;
    const account = await prisma.emailAccount.findUniqueOrThrow({
      where: { id: accountId },
      select: { userId: true },
    });

    logger.info(
      `[backfill] Processing batch of ${messageIds.length} for ${accountId}`,
    );

    for (const gmailMsgId of messageIds) {
      const parsed = await fetchMessage(accountId, gmailMsgId);
      await saveEmail(account.userId, accountId, parsed);
    }

    logger.info(`[backfill] Batch done for ${accountId}`);
  },
  { connection: redisClient, concurrency: 2 },
);

// ── Worker 3: gmail-watch-renewal ─────────────────────────────────────────────
new Worker(
  "gmail-watch-renewal",
  async (job: Job) => {
    const { accountId } = job.data;
    const account = await prisma.emailAccount.findUnique({
      where: { id: accountId },
    });

    if (!account?.isActive) {
      logger.info(`[watch-renewal] Skipping inactive account ${accountId}`);
      return;
    }

    await registerGmailWatch(accountId);
    logger.info(`[watch-renewal] Watch renewed for ${accountId}`);
  },
  { connection: redisClient, concurrency: 3 },
);

export const startWorkers = () =>
  logger.info(
    "✅ BullMQ workers started: webhook-sync, backfill, watch-renewal",
  );
