import { Router } from "express";
import authRouter from "./features/auth/auth.routes";
import accountsRouter from "./features/accounts/accounts.routes";
import emailsRouter from "./features/emails/emails.routes";
import sseRouter from "./features/sse/sse.routes";
import vectorDBRouter from "./features/vectorDB/vectorDB.routes";
import webhooksRouter from "./features/webhooks/webhooks.routes";

// Versioned API router (/api/v1/...)
const mainRouter = Router();
mainRouter.use("/auth", authRouter);
mainRouter.use("/accounts", accountsRouter);
mainRouter.use("/emails", emailsRouter);
mainRouter.use("/sse", sseRouter);
mainRouter.use("/vector", vectorDBRouter);

// Webhooks mounted separately in index.ts (no /api/v1 prefix — Pub/Sub sends to exact URL)
export { webhooksRouter };
export default mainRouter;
