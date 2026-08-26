import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../database/prisma.js", () => ({
  prisma: { $queryRaw: vi.fn() },
}));

import { prisma } from "../database/prisma.js";
import { searchGroups, searchPosts, searchUsers } from "./search.repository.js";

describe("search.repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("searchUsers trims the lookahead row and reports hasMore", async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ id: "1" }, { id: "2" }]);

    const page = await searchUsers("jane", 1);

    expect(page).toEqual({ items: [{ id: "1" }], hasMore: true });
  });

  it("searchUsers reports hasMore=false when results fit within the limit", async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ id: "1" }]);
    const page = await searchUsers("jane", 20);
    expect(page).toEqual({ items: [{ id: "1" }], hasMore: false });
  });

  it("searchPosts and searchGroups apply the same trim/hasMore shape", async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ id: "1" }, { id: "2" }, { id: "3" }]);
    expect(await searchPosts("campus", 2)).toEqual({ items: [{ id: "1" }, { id: "2" }], hasMore: true });

    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ id: "1" }]);
    expect(await searchGroups("campus", "user-1", 20)).toEqual({ items: [{ id: "1" }], hasMore: false });
  });
});
