import type { CookieOptions, Response } from "express";

export const ACCESS_TOKEN_MAX_AGE = 1000 * 60 * 15; // 15 minutes
export const REFRESH_TOKEN_MAX_AGE = 1000 * 60 * 60 * 24 * 30; // 30 days

// The web client reaches the API through the frontend's own /api and
// /socket.io rewrite rules, so these cookies are first-party. Lax (not None)
// keeps browsers from attaching them to cross-site POSTs (CSRF); not Strict,
// because the Google OAuth redirect back from accounts.google.com is a
// cross-site top-level navigation that still needs the session.
const authCookieAttributes = (): CookieOptions => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
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
