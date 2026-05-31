import { Request, Response } from "express";
import {
  getGmailAuthUrl,
  connectGmailAccount,
  listAccounts,
  disconnectAccount,
} from "./accounts.service";
import ErrorResponse from "../../utils/errorResponse";

/**
 * @route GET /api/v1/accounts
 * Retrieves a list of all Gmail accounts connected by the authenticated user.
 */
export const getAccounts = async (req: Request, res: Response) => {
  const accounts = await listAccounts(req.user!.id);
  res.json({ success: true, data: accounts });
};

/**
 * @route GET /api/v1/accounts/google/connect
 * Redirects the user to the Google OAuth consent screen to connect a new Gmail account.
 */
export const connectGoogle = (req: Request, res: Response) => {
  res.redirect(getGmailAuthUrl(req.user!.id));
};

/**
 * @route GET /api/v1/accounts/google/callback
 * @query { code: string, state: string }
 * Handles the OAuth callback from Google, exchanges the code for tokens, and saves the connected account.
 */
export const googleCallback = async (req: Request, res: Response) => {
  const { code, state: userId } = req.query as { code: string; state: string };

  await connectGmailAccount(code, userId);

  res.redirect(`${process.env.FRONTEND_URL}/settings?connected=true`);
};

/**
 * @route DELETE /api/v1/accounts/:id
 * @params { id: string }
 * Disconnects and soft-deletes a connected Gmail account for the user.
 */
export const removeAccount = async (req: Request, res: Response) => {
  const account = await disconnectAccount(req.params.id, req.user!.id);
  if (!account) throw new ErrorResponse("Account not found", 404);

  res.json({ success: true, message: "Account disconnected" });
};
