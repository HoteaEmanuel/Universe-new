import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../repository/search.repository.js", () => ({
  searchGroups: vi.fn(),
  searchPosts: vi.fn(),
  searchUsers: vi.fn(),
}));

import {
  searchGroups,
  searchPosts,
  searchUsers,
} from "../repository/search.repository.js";
import { getSearchOverview } from "./search.service.js";

describe("getSearchOverview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("runs all three searches with the shared preview limit and blocked-id filtering", async () => {
    vi.mocked(searchUsers).mockResolvedValue({ items: [{ id: "u1" }], hasMore: false } as never);
    vi.mocked(searchPosts).mockResolvedValue({ items: [{ id: "p1" }], hasMore: false } as never);
    vi.mocked(searchGroups).mockResolvedValue({ items: [{ id: "g1" }], hasMore: false } as never);

    const result = await getSearchOverview("campus", "user-1", ["blocked-1"]);

    expect(searchUsers).toHaveBeenCalledWith("campus", 5, undefined, ["blocked-1"]);
    expect(searchPosts).toHaveBeenCalledWith("campus", 5, undefined, ["blocked-1"]);
    expect(searchGroups).toHaveBeenCalledWith("campus", "user-1", 5);
    expect(result).toEqual({
      users: { items: [{ id: "u1" }], hasMore: false },
      posts: { items: [{ id: "p1" }], hasMore: false },
      groups: { items: [{ id: "g1" }], hasMore: false },
    });
  });
});
