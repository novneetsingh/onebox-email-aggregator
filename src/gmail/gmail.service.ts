import { google } from "googleapis";
import { prisma } from "../config/prisma";
import { decrypt, encrypt } from "../utils/encrypt";
import { gmailBackfillQueue, gmailWatchRenewalQueue } from "../config/bullmq";
import logger from "../utils/logger";

const PUBSUB_TOPIC = `projects/${process.env.GOOGLE_CLOUD_PROJECT_ID}/topics/${process.env.PUBSUB_TOPIC_NAME}`;

/** Creates an authenticated OAuth2 client for a given EmailAccount. Auto-refreshes tokens. */
export const getOAuth2Client = async (accountId: string) => {
  const account = await prisma.emailAccount.findUniqueOrThrow({
    where: { id: accountId },
  });

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );

  oauth2Client.setCredentials({
    access_token: decrypt(account.accessToken),
    refresh_token: decrypt(account.refreshToken),
  });

  // Persist refreshed access token automatically
  oauth2Client.on("tokens", async (tokens) => {
    if (tokens.access_token) {
      await prisma.emailAccount.update({
        where: { id: accountId },
        data: { accessToken: encrypt(tokens.access_token) },
      });
    }
  });

  return oauth2Client;
};

/** Registers Gmail Pub/Sub watch — tells Google to push to our topic when inbox changes */
export const registerGmailWatch = async (accountId: string): Promise<void> => {
  const auth = await getOAuth2Client(accountId);
  const gmail = google.gmail({ version: "v1", auth });

  const res = await gmail.users.watch({
    userId: "me",
    requestBody: { topicName: PUBSUB_TOPIC, labelIds: ["INBOX"] },
  });

  const expiry = res.data.expiration
    ? new Date(Number(res.data.expiration))
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.emailAccount.update({
    where: { id: accountId },
    data: { historyId: res.data.historyId ?? undefined, watchExpiry: expiry },
  });

  logger.info(
    `Gmail watch registered for ${accountId}, expires ${expiry.toISOString()}`,
  );
};

/** Returns new message IDs since the given historyId */
export const getNewMessageIds = async (
  accountId: string,
  startHistoryId: string,
): Promise<string[]> => {
  const auth = await getOAuth2Client(accountId);
  const gmail = google.gmail({ version: "v1", auth });

  const res = await gmail.users.history.list({
    userId: "me",
    startHistoryId,
    historyTypes: ["messageAdded"],
    labelId: "INBOX",
  });

  if (!res.data.history) return [];

  return res.data.history
    .flatMap((r) => r.messagesAdded ?? [])
    .map((m) => m.message?.id)
    .filter(Boolean) as string[];
};

export interface ParsedEmail {
  messageId: string;
  threadId: string;
  subject: string;
  from: string;
  to: string[];
  snippet: string;
  body: string;
  date: Date;
  folder: string;
}

/** Fetches and parses a single Gmail message */
export const fetchMessage = async (
  accountId: string,
  gmailMessageId: string,
): Promise<ParsedEmail | null> => {
  try {
    const auth = await getOAuth2Client(accountId);
    const gmail = google.gmail({ version: "v1", auth });

    const res = await gmail.users.messages.get({
      userId: "me",
      id: gmailMessageId,
      format: "full",
    });
    const msg = res.data;
    if (!msg?.payload) return null;

    const headers = msg.payload.headers ?? [];
    const getHeader = (name: string) =>
      headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())
        ?.value ?? "";

    const labelIds = msg.labelIds ?? [];
    let folder = "inbox";
    if (labelIds.includes("SENT")) folder = "sent";
    else if (labelIds.includes("SPAM")) folder = "spam";
    else if (labelIds.includes("TRASH")) folder = "trash";

    return {
      messageId: msg.id!,
      threadId: msg.threadId ?? msg.id!,
      subject: getHeader("Subject") || "(no subject)",
      from: getHeader("From"),
      to: getHeader("To")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      snippet: (msg.snippet ?? "").slice(0, 200),
      body: extractPlainText(msg.payload) ?? msg.snippet ?? "",
      date: new Date(getHeader("Date") || Date.now()),
      folder,
    };
  } catch (err) {
    logger.error(`Failed to fetch Gmail message ${gmailMessageId}:`, err);
    return null;
  }
};

const extractPlainText = (payload: any): string | null => {
  if (!payload) return null;
  if (payload.mimeType === "text/plain" && payload.body?.data)
    return Buffer.from(payload.body.data, "base64url").toString("utf-8");

  for (const part of payload.parts ?? []) {
    const text = extractPlainText(part);
    if (text) return text;
  }
  return null;
};

/** Enqueues all inbox messages from the last 30 days for processing */
export const enqueueBackfill = async (accountId: string): Promise<void> => {
  const auth = await getOAuth2Client(accountId);
  const gmail = google.gmail({ version: "v1", auth });

  const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
  let pageToken: string | undefined;
  const allIds: string[] = [];

  do {
    const res = await gmail.users.messages.list({
      userId: "me",
      q: `after:${thirtyDaysAgo} in:anywhere`,
      maxResults: 500,
      pageToken,
    });
    for (const m of res.data.messages ?? []) if (m.id) allIds.push(m.id);
    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);

  logger.info(
    `Enqueueing ${allIds.length} messages for backfill on account ${accountId}`,
  );

  for (let i = 0; i < allIds.length; i += 50) {
    await gmailBackfillQueue.add("backfill-batch", {
      accountId,
      messageIds: allIds.slice(i, i + 50),
    });
  }
};

/** Schedules repeating watch renewal every 6 days (watch expires in 7) */
export const scheduleWatchRenewal = async (
  accountId: string,
): Promise<void> => {
  await gmailWatchRenewalQueue.add(
    "renew-watch",
    { accountId },
    { repeat: { every: 6 * 24 * 60 * 60 * 1000 }, jobId: `renew-${accountId}` },
  );
};
