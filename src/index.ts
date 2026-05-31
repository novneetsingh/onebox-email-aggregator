import "dotenv/config";
import express, { Application, NextFunction, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { checkOpenSearchConnection } from "./config/opensearch";
import { checkRedisConnection } from "./config/redis";
import { checkPineconeConnection } from "./config/pinecone";
import { checkDbConnection } from "./config/prisma";
import { checkGeminiConnection } from "./config/geminiAI";
import mainRouter, { webhooksRouter } from "./routes";
import { startWorkers } from "./workers/workers";
import ErrorResponse from "./utils/errorResponse";
import logger from "./utils/logger";

const app: Application = express();

// ── Core middleware ────────────────────────────────────────────────────────────
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));

// ── Request logger ─────────────────────────────────────────────────────────────
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on("finish", () =>
    logger.http(
      `[${req.method}] ${req.originalUrl} ${res.statusCode} (${Date.now() - start}ms)`,
    ),
  );
  next();
});

// ── Health check ───────────────────────────────────────────────────────────────
app.get("/", (_req: Request, res: Response) => {
  res.send("Onebox Email Aggregator API is running");
});

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use("/api/webhooks", webhooksRouter); // No /api/v1 — Pub/Sub needs exact URL
app.use("/api/v1", mainRouter);

// ── Global error handler ───────────────────────────────────────────────────────
app.use(
  (err: ErrorResponse, req: Request, res: Response, _next: NextFunction) => {
    logger.error(
      `[${req.method}] ${req.originalUrl} - ${err.message}\n${err.stack}`,
    );
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  },
);

// ── Startup ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  logger.info(`🚀 Onebox API running at http://localhost:${PORT}`);
  await checkDbConnection();
  checkOpenSearchConnection();
  checkRedisConnection();
  checkPineconeConnection();
  checkGeminiConnection();
  startWorkers();
});
