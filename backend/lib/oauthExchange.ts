import crypto from "crypto";

// Bridges the backend<->Google OAuth exchange (server-to-server, already
// secure) to the mobile app over a custom-scheme deep link (exp://...) -
// an inherently weaker channel than HTTPS. Rather than putting real
// access/refresh tokens in that URL (logged by the OS, crash reporters,
// deep-link history), the redirect carries a single-use, short-lived
// opaque code; the app immediately exchanges it for real tokens over a
// normal HTTPS POST. In-memory only, matching this codebase's existing
// ephemeral-state patterns (usersSocket, rateLimiter) since Redis/BullMQ
// are disabled.
const EXCHANGE_CODE_TTL_MS = 60_000;

interface MobileAuthExchangePayload {
  userId: string;
  accessToken: string;
  refreshToken: string;
}

const pendingExchanges = new Map<
  string,
  { payload: MobileAuthExchangePayload; expiresAt: number }
>();

export const createMobileAuthExchangeCode = (
  payload: MobileAuthExchangePayload,
): string => {
  const code = crypto.randomBytes(32).toString("hex");
  pendingExchanges.set(code, { payload, expiresAt: Date.now() + EXCHANGE_CODE_TTL_MS });
  return code;
};

export const consumeMobileAuthExchangeCode = (
  code: string,
): MobileAuthExchangePayload | null => {
  const entry = pendingExchanges.get(code);
  pendingExchanges.delete(code); // single-use regardless of outcome
  if (!entry || entry.expiresAt < Date.now()) return null;
  return entry.payload;
};
