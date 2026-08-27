import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../repository/post.repository.js", () => ({
  findPostById: vi.fn(),
  findUserPosts: vi.fn(),
  findUserSavedPosts: vi.fn(),
  createPost: vi.fn(),
  findAllPosts: vi.fn(),
  findFollowingPosts: vi.fn(),
  findUniversityPosts: vi.fn(),
  findPostsByText: vi.fn(),
  findPostsByTag: vi.fn(),
  findOpportunities: vi.fn(),
  setOpportunityClosed: vi.fn(),
}));
vi.mock("../repository/user.repository.js", () => ({
  findUserById: vi.fn(),
}));
vi.mock("../database/prisma.js", () => ({
  prisma: {
    follow: { findMany: vi.fn() },
    post: { update: vi.fn(), delete: vi.fn() },
    savedPost: { findMany: vi.fn() },
  },
}));
vi.mock("../lib/storage.js", () => ({
  uploadImage: vi.fn(),
  deleteImages: vi.fn(),
}));
vi.mock("../repository/like.repository.js", () => ({
  createLike: vi.fn(),
  deleteLike: vi.fn(),
  deleteLikes: vi.fn(),
  findLikeByPostAndUser: vi.fn(),
}));
vi.mock("../repository/notification.repository.js", () => ({
  createNotification: vi.fn(),
  emitNewNotification: vi.fn(),
}));
vi.mock("./mention.service.js", () => ({
  resolveMentionedUsers: vi.fn(),
}));

import { prisma } from "../database/prisma.js";
import { deleteImages, uploadImage } from "../lib/storage.js";
import {
  createLike,
  deleteLike,
  deleteLikes,
  findLikeByPostAndUser,
} from "../repository/like.repository.js";
import {
  createNotification,
  emitNewNotification,
} from "../repository/notification.repository.js";
import {
  createPost,
  findAllPosts,
  findFollowingPosts,
  findPostById,
  findUniversityPosts,
  findUserPosts,
  findUserSavedPosts,
} from "../repository/post.repository.js";
import { findUserById } from "../repository/user.repository.js";
import { resolveMentionedUsers } from "./mention.service.js";
import {
  createNewPost,
  deletePost,
  getPosts,
  getSavedPosts,
  getUserPosts,
  likePost,
  unlikePost,
  updatePost,
} from "./post.service.js";

describe("post.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(resolveMentionedUsers).mockResolvedValue([]);
    vi.mocked(deleteImages).mockResolvedValue(undefined as never);
  });

  describe("getUserPosts", () => {
    it("rejects for an unknown user", async () => {
      vi.mocked(findUserById).mockResolvedValue(null);
      await expect(getUserPosts("user-1")).rejects.toThrow("User does not exist");
    });

    it("returns the user's posts through toPostDTO", async () => {
      vi.mocked(findUserById).mockResolvedValue({ id: "user-1" } as never);
      vi.mocked(findUserPosts).mockResolvedValue([{ id: "post-1", tags: [{ name: "campus" }] }] as never);

      const posts = await getUserPosts("user-1");

      expect(posts).toEqual([{ id: "post-1", tags: ["campus"] }]);
    });
  });

  describe("getSavedPosts", () => {
    it("rejects for an unknown user", async () => {
      vi.mocked(findUserById).mockResolvedValue(null);
      await expect(getSavedPosts("user-1")).rejects.toThrow("User doesnt exist");
    });

    it("unwraps the saved-post rows to their posts", async () => {
      vi.mocked(findUserById).mockResolvedValue({ id: "user-1" } as never);
      vi.mocked(findUserSavedPosts).mockResolvedValue([
        { post: { id: "post-1" } },
      ] as never);

      const posts = await getSavedPosts("user-1");

      expect(posts).toEqual([{ id: "post-1" }]);
    });
  });

  describe("getPosts", () => {
    beforeEach(() => {
      vi.mocked(findUserById).mockResolvedValue({ id: "user-1", university: "MIT" } as never);
      vi.mocked(findUserSavedPosts).mockResolvedValue([{ postId: "post-2" }] as never);
    });

    it("rejects for an unknown user", async () => {
      vi.mocked(findUserById).mockResolvedValue(null);
      await expect(getPosts({ userId: "user-1", feed: "Global" })).rejects.toThrow(
        "User not found",
      );
    });

    it("uses the global feed for 'Global' or an empty feed name", async () => {
      vi.mocked(findAllPosts).mockResolvedValue({ posts: [{ id: "post-1" }], nextCursor: null, hasMore: false } as never);

      await getPosts({ userId: "user-1", feed: "Global" });

      expect(findAllPosts).toHaveBeenCalled();
      expect(findFollowingPosts).not.toHaveBeenCalled();
    });

    it("marks previously saved posts as isSaved", async () => {
      vi.mocked(findAllPosts).mockResolvedValue({
        posts: [{ id: "post-1" }, { id: "post-2" }],
        nextCursor: null,
        hasMore: false,
      } as never);

      const result = await getPosts({ userId: "user-1", feed: "Global" });

      expect(result.posts).toEqual([
        { id: "post-1", isSaved: false },
        { id: "post-2", isSaved: true },
      ]);
    });

    it("resolves following ids and delegates to findFollowingPosts for the Following feed", async () => {
      vi.mocked(prisma.follow.findMany).mockResolvedValue([{ followingId: "user-2" }] as never);
      vi.mocked(findFollowingPosts).mockResolvedValue({ posts: [], nextCursor: null, hasMore: false } as never);

      await getPosts({ userId: "user-1", feed: "Following" });

      expect(findFollowingPosts).toHaveBeenCalledWith(["user-2"], undefined, 10, []);
    });

    it("uses the user's university for any other feed name", async () => {
      vi.mocked(findUniversityPosts).mockResolvedValue({ posts: [], nextCursor: null, hasMore: false } as never);

      await getPosts({ userId: "user-1", feed: "University" });

      expect(findUniversityPosts).toHaveBeenCalledWith("MIT", undefined, 10, []);
    });
  });

  describe("createNewPost", () => {
    it("creates a post with deduped lowercase tags from both the tag field and inline hashtags", async () => {
      vi.mocked(createPost).mockResolvedValue({ id: "post-1" } as never);
      vi.mocked(findUserById).mockResolvedValue({ id: "user-1", firstName: "Jane" } as never);

      await createNewPost({
        body: { title: "Hi", body: "Loving #Campus life", tags: "Campus fun" },
        userId: "user-1",
      });

      expect(createPost).toHaveBeenCalledWith(
        expect.objectContaining({ tags: ["campus", "fun"] }),
      );
    });

    it("uploads images and passes their URLs/keys through", async () => {
      vi.mocked(uploadImage).mockResolvedValue({ url: "https://cdn/img.jpg", key: "img-key" });
      vi.mocked(createPost).mockResolvedValue({ id: "post-1" } as never);
      vi.mocked(findUserById).mockResolvedValue({ id: "user-1" } as never);
      const image = { buffer: Buffer.from(""), mimetype: "image/jpeg" } as Express.Multer.File;

      await createNewPost({ body: { title: "Hi", tags: "" }, userId: "user-1", images: [image] });

      expect(createPost).toHaveBeenCalledWith(
        expect.objectContaining({ imageUrls: ["https://cdn/img.jpg"], imagePublicIds: ["img-key"] }),
      );
    });

    it("notifies each mentioned user", async () => {
      vi.mocked(resolveMentionedUsers).mockResolvedValue([{ id: "user-2" }] as never);
      vi.mocked(createPost).mockResolvedValue({ id: "post-1" } as never);
      vi.mocked(findUserById).mockResolvedValue({ id: "user-1", firstName: "Jane" } as never);
      vi.mocked(createNotification).mockResolvedValue({ id: "notif-1" } as never);

      await createNewPost({ body: { title: "Hi", body: "@user-2 check this", tags: "" }, userId: "user-1" });

      expect(createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ userId: "user-2", type: "post-mention", postId: "post-1" }),
      );
      expect(emitNewNotification).toHaveBeenCalledWith("user-2", { id: "notif-1" });
    });

    it("rejects opportunity publishing by an unverified account", async () => {
      vi.mocked(findUserById).mockResolvedValue({
        id: "user-1", role: "user", accountType: "normal", identityVerified: "true",
      } as never);

      await expect(createNewPost({
        userId: "user-1",
        body: {
          title: "Intern", tags: "internship", type: "opportunity",
          opportunityType: "internship", workplaceType: "remote",
          companyName: "Acme", applyUrl: "https://example.com/apply",
        },
      })).rejects.toThrow("Only verified businesses can publish opportunities");
      expect(createPost).not.toHaveBeenCalled();
    });

    it("passes structured opportunity fields for a verified business", async () => {
      vi.mocked(findUserById).mockResolvedValue({
        id: "business-1", role: "user", accountType: "business", identityVerified: "true",
      } as never);
      vi.mocked(createPost).mockResolvedValue({ id: "post-1" } as never);

      await createNewPost({
        userId: "business-1",
        body: {
          title: "Intern", tags: "internship", type: "opportunity",
          opportunityType: "internship", workplaceType: "remote",
          companyName: "Acme", applyUrl: "https://example.com/apply",
        },
      });

      expect(createPost).toHaveBeenCalledWith(expect.objectContaining({
        type: "opportunity", opportunityType: "internship", workplaceType: "remote",
        companyName: "Acme", applyUrl: "https://example.com/apply",
      }));
    });
  });

  describe("likePost", () => {
    it("rejects when the user or post doesn't exist", async () => {
      vi.mocked(findPostById).mockResolvedValue(null);
      vi.mocked(findUserById).mockResolvedValue({ id: "user-1" } as never);

      await expect(likePost({ postId: "post-1", userId: "user-1" })).rejects.toThrow(
        "User or post not found",
      );
    });

    it("rejects a duplicate like", async () => {
      vi.mocked(findPostById).mockResolvedValue({ id: "post-1", userId: "user-2" } as never);
      vi.mocked(findUserById).mockResolvedValue({ id: "user-1" } as never);
      vi.mocked(findLikeByPostAndUser).mockResolvedValue({ id: "like-1" } as never);

      await expect(likePost({ postId: "post-1", userId: "user-1" })).rejects.toThrow(
        "Post already liked",
      );
      expect(createLike).not.toHaveBeenCalled();
    });

    it("likes the post and notifies the author", async () => {
      vi.mocked(findPostById).mockResolvedValue({ id: "post-1", userId: "user-2" } as never);
      vi.mocked(findUserById).mockResolvedValue({ id: "user-1", firstName: "Jane" } as never);
      vi.mocked(findLikeByPostAndUser).mockResolvedValue(null);
      vi.mocked(createNotification).mockResolvedValue({ id: "notif-1" } as never);

      await likePost({ postId: "post-1", userId: "user-1" });

      expect(createLike).toHaveBeenCalledWith("post-1", "user-1");
      expect(createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ userId: "user-2", type: "post-like" }),
      );
    });

    it("does not notify when liking your own post", async () => {
      vi.mocked(findPostById).mockResolvedValue({ id: "post-1", userId: "user-1" } as never);
      vi.mocked(findUserById).mockResolvedValue({ id: "user-1" } as never);
      vi.mocked(findLikeByPostAndUser).mockResolvedValue(null);

      await likePost({ postId: "post-1", userId: "user-1" });

      expect(createLike).toHaveBeenCalled();
      expect(createNotification).not.toHaveBeenCalled();
    });
  });

  describe("unlikePost", () => {
    it("rejects when there's no existing like", async () => {
      vi.mocked(findPostById).mockResolvedValue({ id: "post-1" } as never);
      vi.mocked(findUserById).mockResolvedValue({ id: "user-1" } as never);
      vi.mocked(findLikeByPostAndUser).mockResolvedValue(null);

      await expect(unlikePost({ postId: "post-1", userId: "user-1" })).rejects.toThrow(
        "Post not liked",
      );
      expect(deleteLike).not.toHaveBeenCalled();
    });

    it("removes an existing like", async () => {
      vi.mocked(findPostById).mockResolvedValue({ id: "post-1" } as never);
      vi.mocked(findUserById).mockResolvedValue({ id: "user-1" } as never);
      vi.mocked(findLikeByPostAndUser).mockResolvedValue({ id: "like-1" } as never);

      await unlikePost({ postId: "post-1", userId: "user-1" });

      expect(deleteLike).toHaveBeenCalledWith("post-1", "user-1");
    });
  });

  describe("updatePost", () => {
    it("rejects with no post data", async () => {
      await expect(
        updatePost({ postData: undefined as never, postId: "post-1" }),
      ).rejects.toThrow("No post data");
    });

    it("rejects for an unknown post", async () => {
      vi.mocked(findPostById).mockResolvedValue(null);
      await expect(updatePost({ postData: {}, postId: "post-1" })).rejects.toThrow(
        "Post not found",
      );
    });

    it("keeps retained image keys and deletes storage keys for dropped images", async () => {
      vi.mocked(findPostById).mockResolvedValue({
        id: "post-1",
        imagesUrls: ["https://cdn/a.jpg", "https://cdn/b.jpg"],
        imagesPublicIds: ["key-a", "key-b"],
      } as never);

      await updatePost({ postData: { images: "https://cdn/a.jpg" }, postId: "post-1" });

      expect(prisma.post.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            imagesUrls: ["https://cdn/a.jpg"],
            imagesPublicIds: ["key-a"],
          }),
        }),
      );
      expect(deleteImages).toHaveBeenCalledWith(["key-b"]);
    });

    it("does not attempt to delete storage images when nothing was removed", async () => {
      vi.mocked(findPostById).mockResolvedValue({
        id: "post-1",
        imagesUrls: ["https://cdn/a.jpg"],
        imagesPublicIds: ["key-a"],
      } as never);

      await updatePost({ postData: { images: ["https://cdn/a.jpg"] }, postId: "post-1" });

      expect(deleteImages).not.toHaveBeenCalled();
    });
  });

  describe("deletePost", () => {
    it("rejects for an unknown post", async () => {
      vi.mocked(findPostById).mockResolvedValue(null);
      await expect(deletePost({ postId: "post-1" })).rejects.toThrow("Post not found");
    });

    it("deletes likes, the post row, and any stored images", async () => {
      vi.mocked(findPostById).mockResolvedValue({
        id: "post-1",
        imagesPublicIds: ["key-a"],
      } as never);

      await deletePost({ postId: "post-1" });

      expect(deleteLikes).toHaveBeenCalledWith("post-1");
      expect(prisma.post.delete).toHaveBeenCalledWith({ where: { id: "post-1" } });
      expect(deleteImages).toHaveBeenCalledWith(["key-a"]);
    });

    it("skips storage cleanup when the post has no images", async () => {
      vi.mocked(findPostById).mockResolvedValue({ id: "post-1", imagesPublicIds: [] } as never);

      await deletePost({ postId: "post-1" });

      expect(deleteImages).not.toHaveBeenCalled();
    });
  });
});
