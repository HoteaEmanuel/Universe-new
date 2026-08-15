import { createRateLimiter } from "./rateLimiter.js";
import type { Request } from "express";

export const messageRateLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 20,
  keyFn: (req: Request) => req.userId ?? req.socket.remoteAddress ?? "unknown",
  message: "You're sending messages too quickly. Please wait a moment and try again.",
});
