import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../repository/block.repository.js", () => ({
  createBlock: vi.fn(),
  deleteBlock: vi.fn(),
  findBlock: vi.fn(),
  findBlockEitherDirection: vi.fn(),
  findBlockedUsersForBlocker: vi.fn(),
}));
vi.mock("../repository/conversation.repository.js", () => ({
  findConversationByParticipants: vi.fn(),
  setConversationHiddenAt: vi.fn(),
}));
vi.mock("../lib/blockCache.js", () => ({
  invalidateBidirectionalBlockedIds: vi.fn(),
}));

import { invalidateBidirectionalBlockedIds } from "../lib/blockCache.js";
import {
  createBlock,
  findBlock,
} from "../repository/block.repository.js";
import { findConversationByParticipants } from "../repository/conversation.repository.js";
import { blockUser } from "./block.service.js";

describe("blockUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects blocking yourself without touching the repository", async () => {
    await expect(
      blockUser({ authUserId: "user-a", targetUserId: "user-a" }),
    ).rejects.toThrow("You cannot block yourself");

    expect(createBlock).not.toHaveBeenCalled();
  });

  it("creates a block and invalidates the cache when none exists yet", async () => {
    vi.mocked(findBlock).mockResolvedValue(null);
    vi.mocked(findConversationByParticipants).mockResolvedValue(null);

    await blockUser({ authUserId: "user-a", targetUserId: "user-b" });

    expect(createBlock).toHaveBeenCalledWith("user-a", "user-b");
    expect(invalidateBidirectionalBlockedIds).toHaveBeenCalledWith("user-a", "user-b");
  });

  it("does not create a duplicate block if one already exists", async () => {
    vi.mocked(findBlock).mockResolvedValue({ id: "existing-block" } as never);
    vi.mocked(findConversationByParticipants).mockResolvedValue(null);

    await blockUser({ authUserId: "user-a", targetUserId: "user-b" });

    expect(createBlock).not.toHaveBeenCalled();
  });
});
