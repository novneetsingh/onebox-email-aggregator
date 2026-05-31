import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { gmailWebhookSyncQueue } from "../../config/bullmq";
import logger from "../../utils/logger";

/**
 * @route POST /api/webhooks/gmail
 * @body { message: { data: string } }
 * Receives real-time push notifications from Google Pub/Sub whenever an inbox changes.
 * Always returns 200 — non-2xx causes Pub/Sub to retry forever.
 */
export const handleGmailWebhook = async (req: Request, res: Response) => {
  const pubsubMessage = req.body?.message;

  if (!pubsubMessage?.data) {
    logger.warn("Webhook: malformed Pub/Sub message (no data)");
    return res.sendStatus(204);
  }

  const { emailAddress, historyId } = JSON.parse(
    Buffer.from(pubsubMessage.data, "base64").toString("utf-8"),
  ) as { emailAddress: string; historyId: string };

  logger.info(`Webhook: ${emailAddress}, historyId=${historyId}`);

  const account = await prisma.emailAccount.findFirst({
    where: { email: emailAddress, isActive: true },
  });

  if (!account) {
    logger.warn(`Webhook: no active account for ${emailAddress}`);
    return res.sendStatus(200);
  }

  await gmailWebhookSyncQueue.add("sync-new-emails", {
    accountId: account.id,
    userId: account.userId,
    newHistoryId: historyId,
    previousHistoryId: account.historyId,
  });

  await prisma.emailAccount.update({
    where: { id: account.id },
    data: { historyId },
  });

  res.sendStatus(200);
};
