import { Request, Response } from "express";
import { getLoginAuthUrl, loginWithGoogle } from "./auth.service";
import { SECURITY_CONFIG } from "../../config/security";

/**
 * @route GET /api/v1/auth/google
 * Redirects the user to the Google OAuth consent screen to begin the login process.
 */
export const redirectToGoogle = (_req: Request, res: Response) => {
  res.redirect(getLoginAuthUrl());
};

/**
 * @route GET /api/v1/auth/google/callback
 * @query { code: string }
 * Handles the callback from Google OAuth, exchanges the code for a token, sets the authentication cookie, and redirects the user to the dashboard.
 */
export const googleCallback = async (req: Request, res: Response) => {
  const { code } = req.query as { code: string };
  const { token } = await loginWithGoogle(code);

  res.cookie(
    SECURITY_CONFIG.COOKIES.AUTH_TOKEN,
    token,
    SECURITY_CONFIG.COOKIES.OPTIONS as any,
  );
  res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
};

/**
 * @route GET /api/v1/auth/me
 * Retrieves the currently logged-in user's profile information based on their active session.
 */
export const getMe = (req: Request, res: Response) => {
  res.json({ success: true, data: req.user });
};

/**
 * @route POST /api/v1/auth/logout
 * Logs the user out by clearing their authentication cookie.
 */
export const logout = (_req: Request, res: Response) => {
  res.clearCookie(SECURITY_CONFIG.COOKIES.AUTH_TOKEN, { path: "/" });
  res.json({ success: true, message: "Logged out" });
};
