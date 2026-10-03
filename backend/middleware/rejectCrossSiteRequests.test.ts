import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { rejectCrossSiteRequests } from "./rejectCrossSiteRequests.js";

const ALLOWED = "https://universe.example.com";
const middleware = rejectCrossSiteRequests([ALLOWED]);

const buildReq = (method: string, headers: Record<string, string> = {}) =>
  ({ method, headers }) as unknown as Request;

const buildRes = () => {
  const res = { status: vi.fn(), json: vi.fn() } as unknown as Response;
  vi.mocked(res.status).mockReturnValue(res);
  return res;
};

describe("rejectCrossSiteRequests middleware", () => {
  let next: NextFunction;
  beforeEach(() => {
    next = vi.fn() as NextFunction;
  });

  it("lets safe methods through even when cross-site", () => {
    const res = buildRes();
    middleware(buildReq("GET", { "sec-fetch-site": "cross-site" }), res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it.each(["POST", "PUT", "PATCH", "DELETE"])("blocks a cross-site %s", (method) => {
    const res = buildRes();
    middleware(
      buildReq(method, { "sec-fetch-site": "cross-site", origin: "https://evil.example" }),
      res,
      next,
    );
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("allows a same-origin POST (the proxied production frontend)", () => {
    const res = buildRes();
    middleware(buildReq("POST", { "sec-fetch-site": "same-origin", origin: ALLOWED }), res, next);
    expect(next).toHaveBeenCalled();
  });

  it("allows a same-site POST (local dev: localhost:5173 -> localhost:5000)", () => {
    const res = buildRes();
    middleware(
      buildReq("POST", { "sec-fetch-site": "same-site", origin: "http://localhost:5173" }),
      res,
      next,
    );
    expect(next).toHaveBeenCalled();
  });

  it("falls back to the Origin allowlist when Sec-Fetch-Site is missing", () => {
    const blockedRes = buildRes();
    middleware(buildReq("POST", { origin: "https://evil.example" }), blockedRes, next);
    expect(blockedRes.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();

    const allowedRes = buildRes();
    middleware(buildReq("POST", { origin: ALLOWED }), allowedRes, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("allows requests with neither header (native mobile app)", () => {
    const res = buildRes();
    middleware(buildReq("POST"), res, next);
    expect(next).toHaveBeenCalled();
  });
});
