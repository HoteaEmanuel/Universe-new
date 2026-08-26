import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../database/prisma.js", () => ({
  prisma: {
    follow: { findUnique: vi.fn(), create: vi.fn(), delete: vi.fn() },
  },
}));

import { prisma } from "../database/prisma.js";
import { createFollow, deleteFollow, findFollow } from "./follow.repository.js";

describe("follow.repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("findFollow maps authUserId/followerId onto followerId/followingId", async () => {
    await findFollow({ authUserId: "user-a", followerId: "user-b" });
    expect(prisma.follow.findUnique).toHaveBeenCalledWith({
      where: { followerId_followingId: { followerId: "user-a", followingId: "user-b" } },
    });
  });

  it("createFollow records the caller as the follower", async () => {
    await createFollow({ authUserId: "user-a", followerId: "user-b" });
    expect(prisma.follow.create).toHaveBeenCalledWith({
      data: { followerId: "user-a", followingId: "user-b" },
    });
  });

  it("deleteFollow removes the caller's follow of unfollowerId", async () => {
    await deleteFollow({ authUserId: "user-a", unfollowerId: "user-b" });
    expect(prisma.follow.delete).toHaveBeenCalledWith({
      where: { followerId_followingId: { followerId: "user-a", followingId: "user-b" } },
    });
  });
});
