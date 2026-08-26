import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../database/prisma.js", () => ({
  prisma: {
    like: { findUnique: vi.fn(), create: vi.fn(), delete: vi.fn(), deleteMany: vi.fn() },
  },
}));

import { prisma } from "../database/prisma.js";
import { createLike, deleteLike, deleteLikes, findLikeByPostAndUser } from "./like.repository.js";

describe("like.repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("findLikeByPostAndUser looks up the composite unique key", async () => {
    await findLikeByPostAndUser("post-1", "user-1");
    expect(prisma.like.findUnique).toHaveBeenCalledWith({
      where: { userId_postId: { userId: "user-1", postId: "post-1" } },
    });
  });

  it("createLike inserts a like row", async () => {
    await createLike("post-1", "user-1");
    expect(prisma.like.create).toHaveBeenCalledWith({ data: { userId: "user-1", postId: "post-1" } });
  });

  it("deleteLike removes a single like by composite key", async () => {
    await deleteLike("post-1", "user-1");
    expect(prisma.like.delete).toHaveBeenCalledWith({
      where: { userId_postId: { userId: "user-1", postId: "post-1" } },
    });
  });

  it("deleteLikes removes every like on a post", async () => {
    await deleteLikes("post-1");
    expect(prisma.like.deleteMany).toHaveBeenCalledWith({ where: { postId: "post-1" } });
  });
});
