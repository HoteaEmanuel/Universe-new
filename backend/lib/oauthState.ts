import crypto from "crypto";

// Without a `state` value binding the callback to the request that started
// it, an attacker can start their own Google OAuth flow, capture the
// resulting authorization code/callback URL, and trick a victim (already
// logged into their own session on this site) into opening it — logging the
// victim's browser into the attacker's account ("login CSRF"). In-memory,
// single-use, short TTL - matches this codebase's existing ephemeral-state
// pattern (lib/oauthExchange.ts, usersSocket) since Redis/BullMQ are
// disabled, and avoids needing express-session for a JWT-cookie app.
const STATE_TTL_MS = 5 * 60 * 1000;
const pendingStates = new Map<string, number>();

export const createOAuthState = (): string => {
  const state = crypto.randomBytes(24).toString("hex");
  pendingStates.set(state, Date.now() + STATE_TTL_MS);
  return state;
};

export const consumeOAuthState = (state: string | undefined): boolean => {
  if (!state) return false;
  const expiresAt = pendingStates.get(state);
  pendingStates.delete(state); // single-use regardless of outcome
  return !!expiresAt && expiresAt >= Date.now();
};

// Adapter to passport-oauth2's custom state-store interface (arity-detected:
// a 2-arg store()/3-arg verify() means "no session needed", see
// node_modules/passport-oauth2/lib/strategy.js) so the web Google login can
// use the same in-memory state above instead of passport's default
// session-backed store, which this app doesn't have (session: false).
export const googleOAuthStateStore = {
  store(_req: unknown, callback: (err: Error | null, state?: string) => void) {
    callback(null, createOAuthState());
  },
  verify(
    _req: unknown,
    providedState: string,
    callback: (err: Error | null, ok: boolean, info?: { message: string }) => void,
  ) {
    if (!consumeOAuthState(providedState)) {
      return callback(null, false, {
        message: "Invalid or expired authorization request state.",
      });
    }
    callback(null, true);
  },
};
