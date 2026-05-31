import { google } from "googleapis";
import { prisma } from "../../config/prisma";
import { generateToken } from "../../utils/jwtUtils";

// Shared OAuth2 client for login (profile + email scopes only)
const loginOAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CALLBACK_URL, // e.g. http://localhost:3000/api/v1/auth/google/callback
);

/** Returns the Google login consent URL */
export const getLoginAuthUrl = () =>
  loginOAuth2Client.generateAuthUrl({
    access_type: "online",
    scope: ["openid", "email"],
  });

/** Exchanges the auth code for the user's email, then upserts the User row */
export const loginWithGoogle = async (code: string) => {
  // Exchange code → tokens
  const { tokens } = await loginOAuth2Client.getToken(code);
  loginOAuth2Client.setCredentials(tokens);

  // Fetch just the email from Google's userinfo endpoint
  const oauth2 = google.oauth2({ version: "v2", auth: loginOAuth2Client });
  const { data } = await oauth2.userinfo.get();

  if (!data.email || !data.id) throw new Error("Google did not return email");

  // Upsert user — only store email + googleId
  const user = await prisma.user.upsert({
    where: { googleId: data.id },
    create: { googleId: data.id, email: data.email },
    update: { email: data.email },
  });

  return { user, token: generateToken(user.id) };
};
