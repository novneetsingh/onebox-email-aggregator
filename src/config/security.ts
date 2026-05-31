import dotenv from "dotenv";
dotenv.config({ quiet: true });

// Security constants
export const SECURITY_CONFIG = {
  // JWT Configuration
  JWT_OPTIONS: {
    SECRET: process.env.JWT_SECRET,
    EXPIRY: "7d",
  },

  // Cookie Configuration
  COOKIES: {
    AUTH_TOKEN: "auth_token",
    OPTIONS: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax", // lax in dev (cross-port localhost), strict in prod
      domain:
        process.env.NODE_ENV === "production"
          ? process.env.COOKIE_DOMAIN
          : undefined, // No domain in dev for localhost
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
      path: "/",
    },
  },
};
