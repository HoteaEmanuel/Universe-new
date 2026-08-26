import type { Request, Response } from "express";
import type {} from "multer";
import { prisma } from "../database/prisma.js";
import { POST_INCLUDE } from "../repository/post.repository.js";
import {
  getViewerRelevantUserIds,
  getFollowConnectedUserIds,
  getShareRecipients,
  getShareRecipientGroups,
} from "../repository/relevance.repository.js";
import { getRelevantFirstPage } from "../lib/relevantFirstPage.js";
import type { UsersWhoLikedQueryInput, SharePostInput } from "../schemas/post.schema.js";
import {
  createNewPost,
  deletePost,
  getPosts,
  getPostsByTag,
  getSavedPosts,
  getSearchedPosts,
  getUserPosts,
  likePost,
  unlikePost,
  updatePost,
  toPostDTO,
} from "../services/post.service.js";
import { sharePostToUsers } from "../services/conversation.service.js";
import { sharePostToGroups } from "../services/group.service.js";

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong";

export const getPost = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        ...POST_INCLUDE,
      },
    });
    if (!post) throw new Error("Post not found");
    if (req.blockedIds?.has(post.userId)) throw new Error("Post not found");
    const savedPost = await prisma.savedPost.findUnique({
      where: { userId_postId: { userId: req.userId as string, postId: id } },
    });
    return res.status(200).json({
      message: "Succes",
      post: {
        ...toPostDTO(post),
        isSaved: !!savedPost,
      },
    });
  } catch (error) {
    return res.status(400).json({ message: "Error, no post found" });
  }
};

export const getUserPostsController = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id as string;
    const userPosts = await getUserPosts(userId);
    return res.status(200).json({ message: "Fetched posts", posts: userPosts });
  } catch (error) {
    return res.status(400).json({ message: "Failed", error: errorMessage(error) });
  }
};

export const getSavedPostsController = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id as string;
    const savedPosts = await getSavedPosts(userId);
    return res
      .status(200)
      .json({ message: "Fetched the saved posts", savedPosts });
  } catch (error) {
    return res.status(400).json({ error: errorMessage(error) });
  }
};

export const checkSaved = async (req: Request, res: Response) => {
  try {
    const postId = req.params.id as string;
    const userId = req.userId as string;
    const savedPost = await prisma.savedPost.findUnique({
      where: { userId_postId: { userId, postId } },
    });
    return res
      .status(200)
      .json({ message: "Checked saved status", isSaved: !!savedPost });
  } catch (error) {
    return res.status(400).json({ message: "Failed", error: errorMessage(error) });
  }
};

export const createPostController = async (req: Request, res: Response) => {
  const images = req.files as Express.Multer.File[] | undefined;
  const postData = {
    body: req.body,
    userId: req.userId as string,
    images,
  };
  try {
    await createNewPost(postData);
    return res.status(201).json({ message: "Post created succesfully!" });
  } catch (error) {
    res.status(400).json({ message: "Could not create post" });
  }
};

export const getPostsController = async (req: Request, res: Response) => {
  try {
    const feed = req.params.feed as string;
    const userId = req.userId as string;
    const cursor = req.query.cursor as string | undefined;
    const limit = req.query.limit as unknown as number;
    const blockedIds = [...(req.blockedIds ?? [])];
    const page = await getPosts({ feed, userId, cursor, limit, blockedIds });
    return res
      .status(200)
      .json({ ...page, message: "Fetched the posts succesfully" });
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const getPostsTags = async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string | undefined)?.toLowerCase() ?? "";
    const tags = await prisma.tag.findMany({
      where: q ? { name: { startsWith: q } } : undefined,
      orderBy: { name: "asc" },
      take: 20,
    });
    return res
      .status(200)
      .json({ tags, message: "Fetched the tags succesfully" });
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const getShareRecipientsController = async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;
    const [recipients, groups] = await Promise.all([
      getShareRecipients(userId),
      getShareRecipientGroups(userId),
    ]);
    return res.status(200).json({ message: "Fetched share recipients", recipients, groups });
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const sharePostController = async (req: Request, res: Response) => {
  try {
    const postId = req.params.id as string;
    const authUserId = req.userId as string;
    const { recipientIds, groupIds } = req.body as SharePostInput;
    const [messages, groupMessages] = await Promise.all([
      recipientIds.length > 0
        ? sharePostToUsers({ authUserId, postId, recipientIds })
        : Promise.resolve([]),
      groupIds.length > 0
        ? sharePostToGroups({ authUserId, postId, groupIds })
        : Promise.resolve([]),
    ]);
    return res.status(201).json({ message: "Post shared", messages, groupMessages });
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const getPostUser = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, username: true, firstName: true, lastName: true, name: true, profilePicture: true },
    });
    return res.status(200).json({ user, message: "Fetched user succesfully" });
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const getRelatedPosts = async (req: Request, res: Response) => {
  try {
    const tag = req.params.tag as string;
    const relatedPosts = await getPostsByTag(tag);
    return res.status(200).json({
      posts: relatedPosts,
      message: "Fetched related posts succesfully",
    });
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const getLikes = async (req: Request, res: Response) => {
  const postId = req.params.id as string;
  try {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) return res.status(400).json({ message: "Post not found" });
    const likesNo = await prisma.like.count({ where: { postId } });
    return res.status(200).json({ message: "Likes returned", likes: likesNo });
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

const LIKE_USER_SELECT = {
  id: true,
  username: true,
  firstName: true,
  lastName: true,
  name: true,
  profilePicture: true,
} as const;

export const getUsersWhoLikedPost = async (req: Request, res: Response) => {
  const postId = req.params.id as string;
  const viewerId = req.userId as string;
  try {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) return res.status(400).json({ message: "Post not found" });

    const { cursor, limit } = req.query as unknown as UsersWhoLikedQueryInput;
    const relevantIds = [...(await getViewerRelevantUserIds(viewerId))];

    const { items, nextCursor, hasMore } = await getRelevantFirstPage({
      cursor,
      limit,
      fetchRelevant: () =>
        relevantIds.length === 0
          ? Promise.resolve([])
          : prisma.like.findMany({
              where: { postId, userId: { in: relevantIds } },
              orderBy: [{ createdAt: "desc" }, { id: "desc" }],
              include: { user: { select: LIKE_USER_SELECT } },
            }),
      fetchNonRelevant: (cursorId, take) =>
        prisma.like.findMany({
          where: {
            postId,
            ...(relevantIds.length > 0 ? { userId: { notIn: relevantIds } } : {}),
          },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          take,
          ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
          include: { user: { select: LIKE_USER_SELECT } },
        }),
    });

    const users = items.map((like) => like.user);
    return res
      .status(200)
      .json({ message: "Users who liked the post", users, nextCursor, hasMore });
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const getRelevantLiker = async (req: Request, res: Response) => {
  const postId = req.params.id as string;
  const viewerId = req.userId as string;
  try {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) return res.status(400).json({ message: "Post not found" });

    const connectedIds = [...(await getFollowConnectedUserIds(viewerId))];
    if (connectedIds.length === 0) {
      return res
        .status(200)
        .json({ message: "No relevant liker", relevantLiker: null });
    }

    const like = await prisma.like.findFirst({
      where: { postId, userId: { in: connectedIds } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: { user: { select: LIKE_USER_SELECT } },
    });

    return res.status(200).json({
      message: "Relevant liker fetched",
      relevantLiker: like?.user ?? null,
    });
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const userHasLiked = async (req: Request, res: Response) => {
  const postId = req.params.id as string;
  try {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) return res.status(400).json({ message: "Post not found" });
    const like = await prisma.like.findUnique({
      where: { userId_postId: { userId: req.userId as string, postId } },
    });
    return res.status(200).json({
      message: "Checked liked status",
      hasLiked: !!like,
    });
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const likePostController = async (req: Request, res: Response) => {
  const { postId } = req.body;
  const userId = req.userId as string;
  try {
    await likePost({ postId, userId });
    return res.status(200).json({ message: "Liked the post successfully" });
  } catch (error) {
    return res.status(400).json({ message: "Liking the post went wrong" });
  }
};

export const unlikePostController = async (req: Request, res: Response) => {
  const { postId } = req.body;
  const userId = req.userId as string;
  try {
    await unlikePost({ postId, userId });
    return res.status(200).json({ message: "Unliked the post successfully" });
  } catch (error) {
    return res.status(400).json({ message: "Unliking the post went wrong" });
  }
};

export const updatePostController = async (req: Request, res: Response) => {
  try {
    const postData = req.body;
    const id = req.params.id as string;
    const images = req.files as Express.Multer.File[] | undefined;
    await updatePost({ postData, postId: id, images });
    return res.status(200).json({ message: "Updated successfully" });
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const deletePostController = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await deletePost({ postId: id });
    return res.status(204).json({ message: "Post deleted successfully" });
  } catch (error) {
    return res.status(404).json({ message: "Deleting failed", error: errorMessage(error) });
  }
};

export const getSearchedPostsController = async (req: Request, res: Response) => {
  try {
    const name = (req.params.name as string).toLowerCase();
    const posts = await getSearchedPosts(name);
    return res.status(200).json({ message: "Fetched posts by name", posts });
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const deletePostsByName = async (req: Request, res: Response) => {
  try {
    const { title } = req.body;
    await prisma.post.deleteMany({ where: { title, userId: req.userId as string } });
    return res.status(200).json({ message: "Posts deleted" });
  } catch (error) {
    return res.status(400).json({ error: errorMessage(error) });
  }
};
