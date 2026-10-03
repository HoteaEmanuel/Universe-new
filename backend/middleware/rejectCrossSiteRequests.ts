import type { NextFunction, Request, Response } from "express";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// CSRF defense in depth on top of SameSite=Lax cookies. Sec-Fetch-Site is
// computed by the browser, so it's trusted first and needs no config; the
// Origin allowlist only covers older browsers that don't send it. Requests
// with neither header (the native mobile app, server-to-server) can't carry
// a victim's browser cookies, so they pass.
export const rejectCrossSiteRequests =
  (allowedOrigins: string[]) => (req: Request, res: Response, next: NextFunction) => {
    if (SAFE_METHODS.has(req.method)) return next();

    const fetchSite = req.headers["sec-fetch-site"];
    const origin = req.headers.origin;
    const isCrossSite = fetchSite
      ? fetchSite === "cross-site"
      : origin !== undefined && !allowedOrigins.includes(origin);

    if (isCrossSite) {
      return res.status(403).json({ message: "Cross-site request blocked" });
    }
    next();
  };
