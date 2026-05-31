import { Request, Response } from "express";
import {
  getEmails,
  searchEmails,
  getEmailById,
  deleteEmailById,
} from "./emails.service";
import ErrorResponse from "../../utils/errorResponse";

/**
 * @route GET /api/v1/emails
 * @query { folder?: string, category?: string, accountId?: string, page?: string, limit?: string }
 * Fetches a paginated list of emails for the user, optionally filtered by folder, category, or account.
 */
export const listEmails = async (req: Request, res: Response) => {
  const {
    folder,
    category,
    accountId,
    page = "1",
    limit = "50",
  } = req.query as Record<string, string>;
  const skip = (Number(page) - 1) * Number(limit);

  const emails = await getEmails(req.user!.id, {
    folder,
    category,
    accountId,
    skip,
    take: Number(limit),
  });

  res.json({ success: true, count: emails.length, data: emails });
};

/**
 * @route GET /api/v1/emails/search
 * @query { q: string }
 * Searches for emails matching the query string in the user's connected accounts.
 */
export const search = async (req: Request, res: Response) => {
  const { q } = req.query as { q: string };
  if (!q) throw new ErrorResponse("Search query is required", 400);

  const results = await searchEmails(req.user!.id, q);
  res.json({ success: true, count: results.length, data: results });
};

/**
 * @route GET /api/v1/emails/:id
 * @params { id: string }
 * Retrieves the full details of a specific email message by its ID.
 */
export const getEmail = async (req: Request, res: Response) => {
  const email = await getEmailById(req.params.id, req.user!.id);
  if (!email) throw new ErrorResponse("Email not found", 404);

  res.json({ success: true, data: email });
};

/**
 * @route DELETE /api/v1/emails/:id
 * @params { id: string }
 * Deletes an email message from the system (and potentially upstream depending on sync strategy).
 */
export const deleteEmail = async (req: Request, res: Response) => {
  const email = await deleteEmailById(req.params.id, req.user!.id);
  if (!email) throw new ErrorResponse("Email not found", 404);

  res.json({ success: true, message: "Email deleted" });
};
