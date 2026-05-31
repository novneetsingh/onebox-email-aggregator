import { Router } from "express";
import { handleGmailWebhook } from "./webhooks.controller";

const webhooksRouter = Router();

// /api/webhooks/gmail
webhooksRouter.post("/gmail", handleGmailWebhook);

export default webhooksRouter;
