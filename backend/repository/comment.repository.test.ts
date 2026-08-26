import { beforeEach, describe, expect, it, vi } from "vitest";

const tx = {
  comment: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
  },
  commentLike: {
    create: vi.fn(),
    deleteMany: vi.fn(),
  },
};

vi.mock("../database/prisma.js", () => ({
  prisma: {
    comment: { findMany: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn() },
    commentLike: { findMany: vi.fn() },
    $transaction: vi.fn((callback: (tx: unknown) => unknown) => callback(tx)),
  },
}));

import { prisma } from "../database/prisma.js";
import {
  createCommentTx,
  deleteCommentTx,
  findCommentById,
  getCommentRepliesPage,
  getLikedCommentIds,
  getPostCommentsPage,
  likeCommentTx,
  removeCommentLikeTx,
} from "./comment.repository.js";

describe("comment.repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getPostCommentsPage", () => {
    it("reports hasMore/nextCursor from the lookahead row", async () => {
      vi.mocked(prisma.comment.findMany).mockResolvedValue([{ id: "1" }, { id: "2" }] as never);

      const page = await getPostCommentsPage("post-1", undefined, 1);

      expect(page).toEqual({ comments: [{ id: "1" }], nextCursor: "1", hasMore: true });
      expect(prisma.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { postId: "post-1", parentId: null } }),
      );
    });
  });

  describe("getCommentRepliesPage", () => {
    it("throws when the parent top-level comment doesn't exist", async () => {
      vi.mocked(prisma.comment.findFirst).mockResolvedValue(null);

      await expect(getCommentRepliesPage("post-1", "missing-parent")).rejects.toThrow(
        "Comment not found",
      );
      expect(prisma.comment.findMany).not.toHaveBeenCalled();
    });

    it("returns replies to a valid parent", async () => {
      vi.mocked(prisma.comment.findFirst).mockResolvedValue({ id: "parent-1" } as never);
      vi.mocked(prisma.comment.findMany).mockResolvedValue([{ id: "reply-1" }] as never);

      const page = await getCommentRepliesPage("post-1", "parent-1");

      expect(page).toEqual({ comments: [{ id: "reply-1" }], nextCursor: null, hasMore: false });
    });
  });

  it("findCommentById selects only the fields callers need", async () => {
    await findCommentById("comment-1");

    expect(prisma.comment.findUnique).toHaveBeenCalledWith({
      where: { id: "comment-1" },
      select: { id: true, userId: true, postId: true, parentId: true },
    });
  });

  describe("getLikedCommentIds", () => {
    it("short-circuits to an empty set for no comment ids", async () => {
      const result = await getLikedCommentIds([], "user-1");
      expect(result).toEqual(new Set());
      expect(prisma.commentLike.findMany).not.toHaveBeenCalled();
    });

    it("returns the set of comment ids the user liked", async () => {
      vi.mocked(prisma.commentLike.findMany).mockResolvedValue([
        { commentId: "c1" },
        { commentId: "c2" },
      ] as never);

      const result = await getLikedCommentIds(["c1", "c2", "c3"], "user-1");

      expect(result).toEqual(new Set(["c1", "c2"]));
    });
  });

  describe("createCommentTx", () => {
    it("creates a top-level comment with no parent bookkeeping", async () => {
      tx.comment.create.mockResolvedValue({ id: "comment-1" });

      const result = await createCommentTx({ postId: "post-1", userId: "user-1", text: "Hi" });

      expect(result).toEqual({ id: "comment-1" });
      expect(tx.comment.update).not.toHaveBeenCalled();
    });

    it("rejects a reply to a nonexistent parent", async () => {
      tx.comment.findUnique.mockResolvedValue(null);

      await expect(
        createCommentTx({ postId: "post-1", userId: "user-1", text: "Hi", parentId: "missing" }),
      ).rejects.toThrow("Parent comment not found");
    });

    it("rejects a reply whose parent belongs to a different post", async () => {
      tx.comment.findUnique.mockResolvedValue({ id: "parent-1", postId: "other-post", parentId: null });

      await expect(
        createCommentTx({ postId: "post-1", userId: "user-1", text: "Hi", parentId: "parent-1" }),
      ).rejects.toThrow("Parent comment does not belong to this post");
    });

    it("rejects replying to a reply (no nested threads)", async () => {
      tx.comment.findUnique.mockResolvedValue({ id: "parent-1", postId: "post-1", parentId: "grandparent" });

      await expect(
        createCommentTx({ postId: "post-1", userId: "user-1", text: "Hi", parentId: "parent-1" }),
      ).rejects.toThrow("Cannot reply to a reply");
    });

    it("creates a reply and increments the parent's replies count", async () => {
      tx.comment.findUnique.mockResolvedValue({ id: "parent-1", postId: "post-1", parentId: null });
      tx.comment.create.mockResolvedValue({ id: "reply-1" });

      await createCommentTx({ postId: "post-1", userId: "user-1", text: "Hi", parentId: "parent-1" });

      expect(tx.comment.update).toHaveBeenCalledWith({
        where: { id: "parent-1" },
        data: { repliesCount: { increment: 1 } },
      });
    });
  });

  describe("deleteCommentTx", () => {
    it("decrements the parent's reply count when a reply is deleted", async () => {
      tx.comment.findUnique.mockResolvedValue({ parentId: "parent-1" });
      tx.comment.deleteMany.mockResolvedValue({ count: 1 });

      await deleteCommentTx("reply-1");

      expect(tx.comment.update).toHaveBeenCalledWith({
        where: { id: "parent-1" },
        data: { repliesCount: { decrement: 1 } },
      });
    });

    it("does nothing extra for a top-level comment", async () => {
      tx.comment.findUnique.mockResolvedValue({ parentId: null });
      tx.comment.deleteMany.mockResolvedValue({ count: 1 });

      await deleteCommentTx("comment-1");

      expect(tx.comment.update).not.toHaveBeenCalled();
    });

    it("does not decrement when nothing was actually deleted", async () => {
      tx.comment.findUnique.mockResolvedValue({ parentId: "parent-1" });
      tx.comment.deleteMany.mockResolvedValue({ count: 0 });

      await deleteCommentTx("already-gone");

      expect(tx.comment.update).not.toHaveBeenCalled();
    });
  });

  describe("likeCommentTx", () => {
    it("throws for a nonexistent comment", async () => {
      tx.comment.findUnique.mockResolvedValue(null);
      await expect(likeCommentTx("missing", "user-1")).rejects.toThrow("Comment not found");
    });

    it("creates the like and increments the comment's like count", async () => {
      tx.comment.findUnique.mockResolvedValue({ id: "comment-1" });
      tx.commentLike.create.mockResolvedValue({ id: "like-1" });

      const result = await likeCommentTx("comment-1", "user-1");

      expect(result).toEqual({ id: "like-1" });
      expect(tx.comment.update).toHaveBeenCalledWith({
        where: { id: "comment-1" },
        data: { likesCount: { increment: 1 } },
      });
    });
  });

  describe("removeCommentLikeTx", () => {
    it("throws when there was no like to remove", async () => {
      tx.commentLike.deleteMany.mockResolvedValue({ count: 0 });
      await expect(removeCommentLikeTx("comment-1", "user-1")).rejects.toThrow(
        "Comment Like not found",
      );
      expect(tx.comment.update).not.toHaveBeenCalled();
    });

    it("decrements the like count when a like was removed", async () => {
      tx.commentLike.deleteMany.mockResolvedValue({ count: 1 });

      await removeCommentLikeTx("comment-1", "user-1");

      expect(tx.comment.update).toHaveBeenCalledWith({
        where: { id: "comment-1" },
        data: { likesCount: { decrement: 1 } },
      });
    });
  });
});
