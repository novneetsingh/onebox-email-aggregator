import { Router, Request, Response } from "express";
import { getAllEmails, searchEmail } from "../services/openbox.service";

const router = Router();

// search email by text query
router.get("/search/:query", async (req: Request, res: Response) => {
  const query = req.params.query;

  const result = await searchEmail(query as string);

  res.status(200).json({
    success: true,
    message: result.length > 0 ? "Emails found" : "No emails found",
    count: result.length,
    data: result,
  });
});

// get all emails
router.get("/all", async (req: Request, res: Response) => {
  const result = await getAllEmails();

  res.status(200).json({
    success: true,
    message: result.length > 0 ? "Emails found" : "No emails found",
    count: result.length,
    data: result,
  });
});

export default router;
