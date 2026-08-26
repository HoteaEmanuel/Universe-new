import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/socket.js", () => ({
  getActivePostUsers: vi.fn(),
}));
vi.mock("../repository/post.repository.js", () => ({
  findPostById: vi.fn(),
}));
vi.mock("../repository/user.repository.js", () => ({
  findUserById: vi.fn(),
}));
vi.mock("../repository/notification.repository.js", () => ({
  createNotification: vi.fn(),
  emitNewNotification: vi.fn(),
}));
vi.mock("../repository/comment.repository.js", () => ({
  createCommentTx: vi.fn(),
  deleteCommentTx: vi.fn(),
  findCommentById: vi.fn(),
  likeCommentTx: vi.fn(),
  removeCommentLikeTx: vi.fn(),
}));
vi.mock("./mention.service.js", () => ({
  resolveMentionedUsers: vi.fn(),
}));

import { getActivePostUsers } from "../lib/socket.js";
import {
  createNotification,
  emitNewNotification,
} from "../repository/notification.repository.js";
import {
  createCommentTx,
  deleteCommentTx,
  findCommentById,
  likeCommentTx,
  removeCommentLikeTx,
} from "../repository/comment.repository.js";
import { findPostById } from "../repository/post.repository.js";
import { findUserById } from "../repository/user.repository.js";
import { resolveMentionedUsers } from "./mention.service.js";
import {
  createComment,
  deleteComment,
  likeComment,
  removeCommentLike,
} from "./comment.service.js";

describe("comment.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(resolveMentionedUsers).mockResolvedValue([]);
    vi.mocked(getActivePostUsers).mockReturnValue(undefined);
    vi.mocked(findUserById).mockResolvedValue({ id: "user-1", firstName: "Jane" } as never);
    vi.mocked(createNotification).mockResolvedValue({ id: "notif-1" } as never);
  });

  describe("createComment", () => {
    it("rejects when the post doesn't exist", async () => {
      vi.mocked(findPostById).mockResolvedValue(null);
      await expect(
        createComment({ id: "post-1", userId: "user-1", commentText: "hi" }),
      ).rejects.toThrow("The post doesnt exist");
    });

    it("notifies the post owner for a top-level comment", async () => {
      vi.mocked(findPostById).mockResolvedValue({ id: "post-1", userId: "owner-1" } as never);
      vi.mocked(createCommentTx).mockResolvedValue({ id: "comment-1" } as never);

      await createComment({ id: "post-1", userId: "user-1", commentText: "hi" });

      expect(createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ userId: "owner-1", type: "post-comment", title: "New comment" }),
      );
    });

    it("does not notify the post owner if they are actively viewing the post", async () => {
      vi.mocked(findPostById).mockResolvedValue({ id: "post-1", userId: "owner-1" } as never);
      vi.mocked(createCommentTx).mockResolvedValue({ id: "comment-1" } as never);
      vi.mocked(getActivePostUsers).mockReturnValue(new Set(["owner-1"]));

      await createComment({ id: "post-1", userId: "user-1", commentText: "hi" });

      expect(createNotification).not.toHaveBeenCalled();
    });

    it("does not notify yourself for commenting on your own post", async () => {
      vi.mocked(findPostById).mockResolvedValue({ id: "post-1", userId: "user-1" } as never);
      vi.mocked(createCommentTx).mockResolvedValue({ id: "comment-1" } as never);

      await createComment({ id: "post-1", userId: "user-1", commentText: "hi" });

      expect(createNotification).not.toHaveBeenCalled();
    });

    it("notifies the parent comment's author on a reply, using 'New reply' wording for both notifications", async () => {
      vi.mocked(findPostById).mockResolvedValue({ id: "post-1", userId: "owner-1" } as never);
      vi.mocked(findCommentById).mockResolvedValue({
        id: "parent-1",
        userId: "parent-author",
        postId: "post-1",
        parentId: null,
      } as never);
      vi.mocked(createCommentTx).mockResolvedValue({ id: "reply-1" } as never);

      await createComment({
        id: "post-1",
        userId: "user-1",
        commentText: "hi",
        parentId: "parent-1",
      });

      expect(createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ userId: "parent-author", type: "post-reply" }),
      );
      expect(createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ userId: "owner-1", type: "post-comment", title: "New reply" }),
      );
    });

    it("does not double-notify the post owner if they are also the parent comment's author", async () => {
      vi.mocked(findPostById).mockResolvedValue({ id: "post-1", userId: "owner-1" } as never);
      vi.mocked(findCommentById).mockResolvedValue({
        id: "parent-1",
        userId: "owner-1",
        postId: "post-1",
        parentId: null,
      } as never);
      vi.mocked(createCommentTx).mockResolvedValue({ id: "reply-1" } as never);

      await createComment({
        id: "post-1",
        userId: "user-1",
        commentText: "hi",
        parentId: "parent-1",
      });

      expect(createNotification).toHaveBeenCalledTimes(1);
    });

    it("notifies mentioned users not already notified via the reply/comment paths", async () => {
      vi.mocked(findPostById).mockResolvedValue({ id: "post-1", userId: "owner-1" } as never);
      vi.mocked(resolveMentionedUsers).mockResolvedValue([
        { id: "owner-1" },
        { id: "mentioned-1" },
      ] as never);
      vi.mocked(createCommentTx).mockResolvedValue({ id: "comment-1" } as never);

      await createComment({ id: "post-1", userId: "user-1", commentText: "hi @owner-1 @mentioned-1" });

      expect(createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ userId: "mentioned-1", type: "comment-mention" }),
      );
      expect(createNotification).not.toHaveBeenCalledWith(
        expect.objectContaining({ userId: "owner-1", type: "comment-mention" }),
      );
    });
  });

  describe("likeComment", () => {
    it("rejects for a nonexistent comment", async () => {
      vi.mocked(findCommentById).mockResolvedValue(null);
      await expect(likeComment({ commentId: "c1", userId: "user-1" })).rejects.toThrow(
        "Comment not found",
      );
    });

    it("notifies the comment's author", async () => {
      vi.mocked(findCommentById).mockResolvedValue({ id: "c1", userId: "author-1" } as never);
      vi.mocked(likeCommentTx).mockResolvedValue({ id: "like-1" } as never);

      const result = await likeComment({ commentId: "c1", userId: "user-1" });

      expect(result).toEqual({ id: "like-1" });
      expect(createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ userId: "author-1", type: "comment-like" }),
      );
    });

    it("does not notify when liking your own comment", async () => {
      vi.mocked(findCommentById).mockResolvedValue({ id: "c1", userId: "user-1" } as never);
      vi.mocked(likeCommentTx).mockResolvedValue({ id: "like-1" } as never);

      await likeComment({ commentId: "c1", userId: "user-1" });

      expect(createNotification).not.toHaveBeenCalled();
      expect(emitNewNotification).not.toHaveBeenCalled();
    });
  });

  it("removeCommentLike delegates to the repository", async () => {
    await removeCommentLike("c1", "user-1");
    expect(removeCommentLikeTx).toHaveBeenCalledWith("c1", "user-1");
  });

  it("deleteComment delegates to the repository", async () => {
    await deleteComment("c1");
    expect(deleteCommentTx).toHaveBeenCalledWith("c1");
  });
});
