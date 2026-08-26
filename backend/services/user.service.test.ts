import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../repository/follow.repository.js", () => ({
  createFollow: vi.fn(),
  deleteFollow: vi.fn(),
  findFollow: vi.fn(),
}));
vi.mock("../repository/post.repository.js", () => ({
  createSavedPost: vi.fn(),
  findPostById: vi.fn(),
  findSavedPostByIds: vi.fn(),
}));
vi.mock("../repository/user.repository.js", () => ({
  findUserById: vi.fn(),
}));
vi.mock("../repository/notification.repository.js", () => ({
  createNotification: vi.fn(),
  emitNewNotification: vi.fn(),
}));

import {
  createFollow,
  deleteFollow,
  findFollow,
} from "../repository/follow.repository.js";
import { createNotification, emitNewNotification } from "../repository/notification.repository.js";
import { createSavedPost, findPostById, findSavedPostByIds } from "../repository/post.repository.js";
import { findUserById } from "../repository/user.repository.js";
import { follow, savePost, unfollow } from "./user.service.js";

describe("user.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("savePost", () => {
    it("rejects for an unknown post", async () => {
      vi.mocked(findPostById).mockResolvedValue(null);
      await expect(savePost({ postId: "post-1", authUserId: "user-1" })).rejects.toThrow(
        "Post not found",
      );
    });

    it("rejects saving your own post", async () => {
      vi.mocked(findPostById).mockResolvedValue({ id: "post-1", userId: "user-1" } as never);
      vi.mocked(findUserById).mockResolvedValue({ id: "user-1" } as never);

      await expect(savePost({ postId: "post-1", authUserId: "user-1" })).rejects.toThrow(
        "Saving works only for other users posts",
      );
    });

    it("rejects saving the same post twice", async () => {
      vi.mocked(findPostById).mockResolvedValue({ id: "post-1", userId: "author-1" } as never);
      vi.mocked(findUserById).mockResolvedValue({ id: "user-1" } as never);
      vi.mocked(findSavedPostByIds).mockResolvedValue({ id: "saved-1" } as never);

      await expect(savePost({ postId: "post-1", authUserId: "user-1" })).rejects.toThrow(
        "Already saved",
      );
      expect(createSavedPost).not.toHaveBeenCalled();
    });

    it("saves the post", async () => {
      vi.mocked(findPostById).mockResolvedValue({ id: "post-1", userId: "author-1" } as never);
      vi.mocked(findUserById).mockResolvedValue({ id: "user-1" } as never);
      vi.mocked(findSavedPostByIds).mockResolvedValue(null);

      await savePost({ postId: "post-1", authUserId: "user-1" });

      expect(createSavedPost).toHaveBeenCalledWith("user-1", "post-1");
    });
  });

  describe("follow", () => {
    it("rejects when either user doesn't exist", async () => {
      vi.mocked(findUserById).mockResolvedValueOnce(null).mockResolvedValueOnce({ id: "user-2" } as never);
      await expect(follow({ authUserId: "user-1", followerId: "user-2" })).rejects.toThrow(
        "User not found",
      );
    });

    it("rejects following someone twice", async () => {
      vi.mocked(findUserById).mockResolvedValue({ id: "user-1" } as never);
      vi.mocked(findFollow).mockResolvedValue({ id: "follow-1" } as never);

      await expect(follow({ authUserId: "user-1", followerId: "user-2" })).rejects.toThrow(
        "Already following",
      );
      expect(createFollow).not.toHaveBeenCalled();
    });

    it("creates the follow and notifies the followed user", async () => {
      vi.mocked(findUserById).mockResolvedValue({ id: "user-1", firstName: "Jane" } as never);
      vi.mocked(findFollow).mockResolvedValue(null);
      vi.mocked(createNotification).mockResolvedValue({ id: "notif-1" } as never);

      await follow({ authUserId: "user-1", followerId: "user-2" });

      expect(createFollow).toHaveBeenCalledWith({ authUserId: "user-1", followerId: "user-2" });
      expect(emitNewNotification).toHaveBeenCalledWith("user-2", { id: "notif-1" });
    });
  });

  describe("unfollow", () => {
    it("rejects when not currently following", async () => {
      vi.mocked(findUserById).mockResolvedValue({ id: "user-1" } as never);
      vi.mocked(findFollow).mockResolvedValue(null);

      await expect(unfollow({ authUserId: "user-1", unfollowerId: "user-2" })).rejects.toThrow(
        "Not following",
      );
      expect(deleteFollow).not.toHaveBeenCalled();
    });

    it("removes the follow", async () => {
      vi.mocked(findUserById).mockResolvedValue({ id: "user-1" } as never);
      vi.mocked(findFollow).mockResolvedValue({ id: "follow-1" } as never);

      await unfollow({ authUserId: "user-1", unfollowerId: "user-2" });

      expect(deleteFollow).toHaveBeenCalledWith({ authUserId: "user-1", unfollowerId: "user-2" });
    });
  });
});
