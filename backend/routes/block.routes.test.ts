import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/block.service.js", () => ({
  blockUser: vi.fn(),
  unblockUser: vi.fn(),
  getBlockedUsers: vi.fn(),
}));

import { blockUser, getBlockedUsers } from "../services/block.service.js";
import blockRouter from "./block.routes.js";

const buildApp = (userId: string) => {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.userId = userId;
    next();
  });
  app.use("/api/blocks", blockRouter);
  return app;
};

describe("block.routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("POST /block calls the service and returns 200 for a valid body", async () => {
    const app = buildApp("user-a");

    const res = await request(app).post("/api/blocks/block").send({ userId: "user-b" });

    expect(res.status).toBe(200);
    expect(blockUser).toHaveBeenCalledWith({ authUserId: "user-a", targetUserId: "user-b" });
  });

  it("POST /block returns 400 when userId is missing", async () => {
    const app = buildApp("user-a");

    const res = await request(app).post("/api/blocks/block").send({});

    expect(res.status).toBe(400);
    expect(blockUser).not.toHaveBeenCalled();
  });

  it("GET / returns the blocked users from the service", async () => {
    vi.mocked(getBlockedUsers).mockResolvedValue([{ id: "block-1" }] as never);
    const app = buildApp("user-a");

    const res = await request(app).get("/api/blocks");

    expect(res.status).toBe(200);
    expect(res.body.blockedUsers).toEqual([{ id: "block-1" }]);
  });
});
