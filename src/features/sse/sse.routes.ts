import { Router, Request, Response } from "express";
import sseBus from "../../utils/sseBus";
import { protect } from "../../middleware/auth.middleware";

const sseRouter = Router();

sseRouter.use(protect);

/**
 * @route GET /api/v1/sse/events
 * Establishes a Server-Sent Events (SSE) connection to stream real-time updates to the authenticated client.
 */
sseRouter.get("/events", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  const userId = req.user!.id;
  res.write(`data: ${JSON.stringify({ type: "connected", userId })}\n\n`);

  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  sseBus.on(userId, send);

  const heartbeat = setInterval(() => res.write(": ping\n\n"), 30000);

  req.on("close", () => {
    clearInterval(heartbeat);
    sseBus.off(userId, send);
  });
});

export default sseRouter;
