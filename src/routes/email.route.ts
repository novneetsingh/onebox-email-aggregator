import { Router, Request, Response } from "express";
import {
  getAllEmails,
  searchEmail,
  deleteAllEmails,
  getEmailById,
  deleteEmailById,
} from "../services/elasticsearch.service";

import { generateSuggestedReply } from "../services/geminiAI.service";

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

// delete all emails
router.delete("/all", async (req: Request, res: Response) => {
  await deleteAllEmails();

  res.status(200).json({
    success: true,
    message: "All emails deleted",
  });
});

// get a email by messageId
router.get("/searchById/:messageId", async (req: Request, res: Response) => {
  const messageId = req.params.messageId;

  const result = await getEmailById(messageId as string);

  res.status(200).json({
    success: true,
    message: result ? "Email found" : "Email not found",
    data: result,
  });
});

// delete a email by messageId
router.delete("/deleteById/:messageId", async (req: Request, res: Response) => {
  const messageId = req.params.messageId;

  await deleteEmailById(messageId as string);

  res.status(200).json({
    success: true,
    message: "Email deleted",
  });
});

// generate suggested reply
router.get(
  "/generateSuggestedReply/:messageId",
  async (req: Request, res: Response) => {
    const messageId = req.params.messageId;

    const result = await generateSuggestedReply(messageId as string);

    res.status(200).json({
      success: true,
      message: result
        ? "Suggested reply generated"
        : "Suggested reply not generated",
      data: result,
    });
  }
);

export default router;
