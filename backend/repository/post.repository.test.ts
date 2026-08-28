import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../database/prisma.js", () => ({
  prisma: {
    post: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    savedPost: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { prisma } from "../database/prisma.js";
import {
  createPost,
  createSavedPost,
  findAllPosts,
  findFollowingPosts,
  findPostById,
  findPostForReport,
  findPostsByTag,
  findPostsByText,
  findSavedPostByIds,
  findUniversityPosts,
  findUserPosts,
  findUserSavedPosts,
  findOpportunities,
  softDeletePost,
} from "./post.repository.js";

const post = (id: string) => ({ id });

describe("post.repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("findPostById includes the standard post relations", async () => {
    vi.mocked(prisma.post.findUnique).mockResolvedValue(post("post-1") as never);

    await findPostById("post-1");

    expect(prisma.post.findUnique).toHaveBeenCalledWith({
      where: { id: "post-1" },
      include: expect.objectContaining({ event: expect.anything(), poll: expect.anything() }),
    });
  });

  describe("pagination (findAllPosts / findFollowingPosts / findUniversityPosts)", () => {
    it("findAllPosts reports hasMore=false and no cursor when a full page isn't exceeded", async () => {
      vi.mocked(prisma.post.findMany).mockResolvedValue([post("1"), post("2")] as never);

      const page = await findAllPosts(undefined, 10);

      expect(page).toEqual({ posts: [post("1"), post("2")], nextCursor: null, hasMore: false });
    });

    it("findAllPosts trims the lookahead row and reports hasMore=true with the last visible id as cursor", async () => {
      vi.mocked(prisma.post.findMany).mockResolvedValue([post("1"), post("2"), post("3")] as never);

      const page = await findAllPosts(undefined, 2);

      expect(page).toEqual({ posts: [post("1"), post("2")], nextCursor: "2", hasMore: true });
    });

    it("findAllPosts passes the cursor and excluded ids through to prisma", async () => {
      vi.mocked(prisma.post.findMany).mockResolvedValue([]);

      await findAllPosts("post-5", 10, ["blocked-1"]);

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { removedAt: null, userId: { notIn: ["blocked-1"] } },
          cursor: { id: "post-5" },
          skip: 1,
          take: 11,
        }),
      );
    });

    it("findFollowingPosts filters by followingIds and excludes blocked users", async () => {
      vi.mocked(prisma.post.findMany).mockResolvedValue([]);

      await findFollowingPosts(["user-a", "user-b"], undefined, 10, ["blocked-1"]);

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            removedAt: null,
            userId: { in: ["user-a", "user-b"], notIn: ["blocked-1"] },
          },
        }),
      );
    });

    it("findUniversityPosts filters by the user's university", async () => {
      vi.mocked(prisma.post.findMany).mockResolvedValue([]);

      await findUniversityPosts("MIT", undefined, 10, []);

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { removedAt: null, user: { university: "MIT" } } }),
      );
    });

    it("excludes soft-removed posts from every feed query", async () => {
      vi.mocked(prisma.post.findMany).mockResolvedValue([]);

      await findAllPosts();
      await findFollowingPosts([]);
      await findUniversityPosts(null);

      for (const call of vi.mocked(prisma.post.findMany).mock.calls) {
        expect((call[0] as { where: { removedAt: null } }).where.removedAt).toBeNull();
      }
    });
  });

  it("filters the opportunities board by structured fields and active lifecycle", async () => {
    vi.mocked(prisma.post.findMany).mockResolvedValue([]);

    await findOpportunities({
      viewerId: "user-1",
      limit: 12,
      status: "active",
      sort: "deadline",
      opportunityType: "internship",
      workplaceType: "remote",
      q: "react",
      excludeUserIds: ["blocked-1"],
    });

    expect(prisma.post.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        type: "opportunity",
        removedAt: null,
        opportunityType: "internship",
        workplaceType: "remote",
        userId: { notIn: ["blocked-1"] },
        NOT: expect.any(Object),
      }),
      orderBy: expect.arrayContaining([expect.objectContaining({ deadlineAt: expect.any(Object) })]),
      take: 13,
    }));
  });

  it("findUserPosts orders by newest first and excludes removed posts", async () => {
    vi.mocked(prisma.post.findMany).mockResolvedValue([]);

    await findUserPosts("user-1");

    expect(prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1", removedAt: null },
        orderBy: { createdAt: "desc" },
      }),
    );
  });

  it("findUserSavedPosts includes the nested post relations", async () => {
    vi.mocked(prisma.savedPost.findMany).mockResolvedValue([]);

    await findUserSavedPosts("user-1");

    expect(prisma.savedPost.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user-1" } }),
    );
  });

  describe("createPost", () => {
    it("omits tags/mentions/poll when none are provided", async () => {
      vi.mocked(prisma.post.create).mockResolvedValue(post("post-1") as never);

      await createPost({ userId: "user-1", title: "Hello" });

      expect(prisma.post.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-1",
          title: "Hello",
          imagesUrls: [],
          imagesPublicIds: [],
          tags: undefined,
          mentionedUsers: undefined,
          poll: undefined,
        }),
      });
    });

    it("builds connectOrCreate tags, mention connects, and a nested poll when provided", async () => {
      vi.mocked(prisma.post.create).mockResolvedValue(post("post-1") as never);

      await createPost({
        userId: "user-1",
        title: "Hello",
        tags: ["campus"],
        mentionedUserIds: ["user-2"],
        poll: { question: "Q?", options: ["A", "B"] },
      });

      const call = vi.mocked(prisma.post.create).mock.calls[0]![0] as never as {
        data: {
          tags: { connectOrCreate: { where: { name: string } }[] };
          mentionedUsers: { connect: { id: string }[] };
          poll: { create: { question: string; options: { create: { text: string; position: number }[] } } };
        };
      };
      expect(call.data.tags.connectOrCreate).toEqual([{ where: { name: "campus" }, create: { name: "campus" } }]);
      expect(call.data.mentionedUsers.connect).toEqual([{ id: "user-2" }]);
      expect(call.data.poll.create.question).toBe("Q?");
      expect(call.data.poll.create.options.create).toEqual([
        { text: "A", position: 0 },
        { text: "B", position: 1 },
      ]);
    });
  });

  it("findPostsByText searches title and body case-insensitively, excluding removed posts", async () => {
    vi.mocked(prisma.post.findMany).mockResolvedValue([]);

    await findPostsByText("campus life");

    expect(prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          removedAt: null,
          OR: [
            { title: { contains: "campus life", mode: "insensitive" } },
            { body: { contains: "campus life", mode: "insensitive" } },
          ],
        },
      }),
    );
  });

  it("findPostsByTag filters by tag name, excluding removed posts", async () => {
    vi.mocked(prisma.post.findMany).mockResolvedValue([]);

    await findPostsByTag("campus");

    expect(prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { removedAt: null, tags: { some: { name: "campus" } } },
      }),
    );
  });

  it("findPostForReport selects the fields needed to build a report snapshot", async () => {
    vi.mocked(prisma.post.findUnique).mockResolvedValue({
      id: "post-1",
      userId: "user-1",
      title: "Title",
      body: "Body",
      imagesUrls: [],
      user: { username: "alice" },
    } as never);

    const result = await findPostForReport("post-1");

    expect(prisma.post.findUnique).toHaveBeenCalledWith({
      where: { id: "post-1" },
      select: expect.objectContaining({
        title: true,
        body: true,
        imagesUrls: true,
        user: { select: { username: true } },
      }),
    });
    expect(result?.user.username).toBe("alice");
  });

  it("softDeletePost stamps removedAt/removedReason/removedByUserId", async () => {
    vi.mocked(prisma.post.update).mockResolvedValue(post("post-1") as never);

    await softDeletePost({ postId: "post-1", reason: "spam", byUserId: "admin-1" });

    expect(prisma.post.update).toHaveBeenCalledWith({
      where: { id: "post-1" },
      data: {
        removedAt: expect.any(Date),
        removedReason: "spam",
        removedByUserId: "admin-1",
      },
    });
  });

  it("findSavedPostByIds looks up the composite unique key", async () => {
    await findSavedPostByIds("user-1", "post-1");

    expect(prisma.savedPost.findUnique).toHaveBeenCalledWith({
      where: { userId_postId: { userId: "user-1", postId: "post-1" } },
    });
  });

  it("createSavedPost inserts the save row", async () => {
    await createSavedPost("user-1", "post-1");

    expect(prisma.savedPost.create).toHaveBeenCalledWith({
      data: { userId: "user-1", postId: "post-1" },
    });
  });
});
