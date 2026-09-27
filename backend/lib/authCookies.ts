import type { CookieOptions, Response } from "express";

export const ACCESS_TOKEN_MAX_AGE = 1000 * 60 * 15; // 15 minutes
export const REFRESH_TOKEN_MAX_AGE = 1000 * 60 * 60 * 24 * 30; // 30 days

// The frontend and backend live on different *.onrender.com subdomains,
// which the browser treats as different sites (onrender.com is on the public
// suffix list) - SameSite=Strict/Lax cookies never ride along on those
// cross-site requests, so login would appear to succeed but every request
// after it would show up unauthenticated. SameSite=None requires Secure,
// which is already true whenever this runs in production.
const authCookieAttributes = (): CookieOptions => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
});

export const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string,
) => {
  const attributes = authCookieAttributes();

  res.cookie("accessToken", accessToken, {
    ...attributes,
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });
  res.cookie("refreshToken", refreshToken, {
    ...attributes,
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
};

// A delete has to repeat the exact attributes the cookie was set with. Without
// them it goes out as SameSite=Lax, which the browser rejects outright on a
// cross-site response - the delete never lands and the real cookie stays put,
// so logout and the session-expired path silently fail to end the session.
export const clearAuthCookies = (res: Response) => {
  const attributes = authCookieAttributes();

  res.clearCookie("accessToken", attributes);
  res.clearCookie("refreshToken", attributes);
};
