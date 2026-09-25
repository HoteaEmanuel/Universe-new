import type { Request, Response, NextFunction } from "express";

interface RateLimiterOptions {
  windowMs: number;
  max: number;
  keyFn?: (req: Request) => string;
  message?: string;
}

// req.ip (not the raw X-Forwarded-For header) - Express only trusts that
// header's IP when `trust proxy` is configured for the real reverse proxy
// hop count, so a client can't spoof it by sending its own X-Forwarded-For.
const ipKey = (req: Request) => req.ip || req.socket.remoteAddress || "unknown";

// Combines IP with the request's email/account identifier where the body has
// one, so spoofing the IP alone doesn't fully bypass throttling on auth
// routes like login/signup/forgot-password/verify-email.
const authKey = (req: Request) => {
  const ip = ipKey(req);
  const email = req.body?.email;
  return typeof email === "string" && email.length > 0
    ? `${ip}:${email.toLowerCase()}`
    : ip;
};

export const createRateLimiter = ({
  windowMs,
  max,
  keyFn = ipKey,
  message = "Too many requests. Please try again shortly.",
}: RateLimiterOptions) => {
  const tracker = new Map<string, { count: number; expiresAt: number }>();

  // Without this, every distinct key (IP, or IP+email on auth routes) this
  // limiter has ever seen stays in memory forever, since a passing request
  // never deletes its own entry - just leaves it to expire unread.
  const sweepInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of tracker) {
      if (entry.expiresAt < now) tracker.delete(key);
    }
  }, windowMs);
  sweepInterval.unref();

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

export const rateLimiter = createRateLimiter({
  windowMs: 10_000,
  max: 5,
  keyFn: authKey,
});
