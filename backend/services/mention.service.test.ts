import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../repository/user.repository.js", () => ({
  findUsersByUsernames: vi.fn(),
}));

import { findUsersByUsernames } from "../repository/user.repository.js";
import { resolveMentionedUsers } from "./mention.service.js";

describe("resolveMentionedUsers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("looks up every @mentioned username and excludes the author from the result", async () => {
    vi.mocked(findUsersByUsernames).mockResolvedValue([
      { id: "user-1" },
      { id: "author-1" },
    ] as never);

    const result = await resolveMentionedUsers("hey @user_one and @self", "author-1");

    expect(findUsersByUsernames).toHaveBeenCalledWith(["user_one", "self"]);
    expect(result).toEqual([{ id: "user-1" }]);
  });

  it("returns an empty array for text with no mentions", async () => {
    vi.mocked(findUsersByUsernames).mockResolvedValue([]);
    expect(await resolveMentionedUsers("no mentions", "author-1")).toEqual([]);
  });
});
