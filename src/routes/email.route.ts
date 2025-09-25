import { Router, Request, Response } from "express";
import { getAllEmails, searchEmail } from "../services/openbox.service";

const router = Router();

// search email by text query
router.post("/search/:query", async (req: Request, res: Response) => {
  const query = req.params.query;

  const result = await searchEmail(query as string);

  res.status(200).json({
    success: result.length > 0 ? true : false,
    message: result.length > 0 ? "Emails found" : "No emails found",
    data: result.length > 0 ? result : [],
  });
});

// get all emails
router.get("/all", async (req: Request, res: Response) => {
  const result = await getAllEmails();

  res.status(200).json({
    success: result.length > 0 ? true : false,
    message: result.length > 0 ? "Emails found" : "No emails found",
    data: result.length > 0 ? result : [],
  });
});

export default router;
