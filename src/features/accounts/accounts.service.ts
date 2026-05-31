import { google } from "googleapis";
import { prisma } from "../../config/prisma";
import { encrypt } from "../../utils/encrypt";
import {
  registerGmailWatch,
  enqueueBackfill,
  scheduleWatchRenewal,
} from "../../gmail/gmail.service";

const GMAIL_CALLBACK_URL = `${process.env.BACKEND_URL ?? "http://localhost:3000"}/api/v1/accounts/google/callback`;

// Shared OAuth2 client for Gmail account connection
const gmailOAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  GMAIL_CALLBACK_URL,
);

/** Returns the Gmail consent URL — encodes userId in state so callback knows who is connecting */
export const getGmailAuthUrl = (userId: string) =>
  gmailOAuth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // Always return refresh_token
    scope: [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/gmail.modify",
    ],
    state: userId, // ← passed back by Google in callback query param
  });

/** Exchanges the code, saves the account, then triggers watch + backfill */
export const connectGmailAccount = async (code: string, userId: string) => {
  const { tokens } = await gmailOAuth2Client.getToken(code);

  if (!tokens.refresh_token)
    throw new Error(
      "No refresh token — please revoke access in Google and try again.",
    );

  // Get email address for this Gmail account
  gmailOAuth2Client.setCredentials(tokens);
  const oauth2 = google.oauth2({ version: "v2", auth: gmailOAuth2Client });
  const { data } = await oauth2.userinfo.get();

  if (!data.email) throw new Error("Google did not return email");

  // Upsert account — safe to reconnect
  const account = await prisma.emailAccount.upsert({
    where: { userId_email: { userId, email: data.email } },
    create: {
      userId,
      provider: "gmail",
      email: data.email,
      accessToken: encrypt(tokens.access_token!),
      refreshToken: encrypt(tokens.refresh_token),
    },
    update: {
      accessToken: encrypt(tokens.access_token!),
      refreshToken: encrypt(tokens.refresh_token),
      isActive: true,
    },
  });

  // Kick off background tasks (non-blocking — errors are logged, not fatal)
  await Promise.allSettled([
    registerGmailWatch(account.id),
    enqueueBackfill(account.id),
    scheduleWatchRenewal(account.id),
  ]);

  return account;
};

/** List all active connected accounts for a user */
export const listAccounts = (userId: string) =>
  prisma.emailAccount.findMany({
    where: { userId, isActive: true },
    select: {
      id: true,
      email: true,
      provider: true,
      watchExpiry: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

/** Soft-delete an account (sets isActive = false) */
export const disconnectAccount = async (accountId: string, userId: string) => {
  const account = await prisma.emailAccount.findFirst({
    where: { id: accountId, userId },
  });
  if (!account) return null;

  await prisma.emailAccount.update({
    where: { id: accountId },
    data: { isActive: false },
  });

  return account;
};
