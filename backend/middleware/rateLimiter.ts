import type { Request, Response, NextFunction } from "express";

interface RateLimiterOptions {
  windowMs: number;
  max: number;
  keyFn?: (req: Request) => string;
  message?: string;
}

const ipKey = (req: Request) =>
  (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "unknown";

export const createRateLimiter = ({
  windowMs,
  max,
  keyFn = ipKey,
  message = "Too many requests. Please try again shortly.",
}: RateLimiterOptions) => {
  const tracker = new Map<string, { count: number; expiresAt: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyFn(req);
    const now = Date.now();
    const entry = tracker.get(key);

    if (!entry || entry.expiresAt < now) {
      tracker.set(key, { count: 1, expiresAt: now + windowMs });
      return next();
    }

    entry.count++;
    if (entry.count > max) {
      return res.status(429).json({ message });
    }
    return next();
  };
};

export const rateLimiter = createRateLimiter({ windowMs: 10_000, max: 5 });
