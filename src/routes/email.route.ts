import { Router, Request, Response } from "express";
import { searchEmail } from "../services/openbox.service";

const router = Router();

router.post("/:query", async (req: Request, res: Response) => {
  const query = req.params.query;

  const result = await searchEmail(query as string);

  res.status(200).json({
    success: result.length > 0 ? true : false,
    message: result.length > 0 ? "Emails found" : "No emails found",
    data: result.length > 0 ? result : [],
  });
});

export default router;
