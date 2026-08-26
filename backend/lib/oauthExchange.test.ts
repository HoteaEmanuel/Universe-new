import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  consumeMobileAuthExchangeCode,
  createMobileAuthExchangeCode,
} from "./oauthExchange.js";

describe("mobile auth exchange codes", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const payload = {
    userId: "user-1",
    accessToken: "access-1",
    refreshToken: "refresh-1",
  };

  it("returns the payload for a freshly created code", () => {
    const code = createMobileAuthExchangeCode(payload);
    expect(consumeMobileAuthExchangeCode(code)).toEqual(payload);
  });

  it("is single-use: a code cannot be consumed twice", () => {
    const code = createMobileAuthExchangeCode(payload);
    consumeMobileAuthExchangeCode(code);
    expect(consumeMobileAuthExchangeCode(code)).toBeNull();
  });

  it("returns null for an unknown code", () => {
    expect(consumeMobileAuthExchangeCode("not-a-real-code")).toBeNull();
  });

  it("expires codes after 60 seconds", () => {
    const code = createMobileAuthExchangeCode(payload);
    vi.advanceTimersByTime(60_001);
    expect(consumeMobileAuthExchangeCode(code)).toBeNull();
  });

  it("still returns the payload just before expiry", () => {
    const code = createMobileAuthExchangeCode(payload);
    vi.advanceTimersByTime(59_000);
    expect(consumeMobileAuthExchangeCode(code)).toEqual(payload);
  });
});
