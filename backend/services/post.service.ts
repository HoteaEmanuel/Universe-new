import {
  findPostById,
  findUserPosts,
  findUserSavedPosts,
  createPost,
  findAllPosts,
  findFollowingPosts,
  findUniversityPosts,
  findPostsByText,
  findPostsByTag,
  findOpportunities,
  setOpportunityClosed,
  type OpportunityFilters,
} from "../repository/post.repository.js";
import { findUserById } from "../repository/user.repository.js";
import { prisma } from "../database/prisma.js";
import { uploadImage, deleteImages } from "../lib/storage.js";
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
import { toEventDTO } from "./event.service.js";
import { toPollDTO } from "./poll.service.js";
import { extractHashtagsFromText } from "../utils/hashtags.js";
import { resolveMentionedUsers } from "./mention.service.js";

type UploadedImage = Express.Multer.File;

const withIsSaved = <T extends { id: string }>(
  post: T,
  savedPostIds: Set<string>,
) => ({ ...post, isSaved: savedPostIds.has(post.id) });

const withEventDTO = <T extends { event?: Parameters<typeof toEventDTO>[0] | null }>(
  post: T,
) => (post.event ? { ...post, event: toEventDTO(post.event) } : post);

const withPollDTO = <T extends { poll?: Parameters<typeof toPollDTO>[0] | null }>(
  post: T,
) => (post.poll ? { ...post, poll: toPollDTO(post.poll) } : post);

const withTagNames = <T extends { tags?: { name: string }[] }>(post: T) =>
  post.tags ? { ...post, tags: post.tags.map((tag) => tag.name) } : post;

export const toPostDTO = <T extends {
  event?: Parameters<typeof toEventDTO>[0] | null;
  poll?: Parameters<typeof toPollDTO>[0] | null;
  tags?: { name: string }[];
  type?: string;
  deadlineAt?: Date | null;
  expiresAt?: Date | null;
  opportunityClosedAt?: Date | null;
}>(post: T) =>
  withOpportunityStatus(withTagNames(withPollDTO(withEventDTO(post))));

const withOpportunityStatus = <T extends {
  type?: string;
  deadlineAt?: Date | null;
  expiresAt?: Date | null;
  opportunityClosedAt?: Date | null;
}>(post: T) => {
  if (post.type !== "opportunity") return post;
  const cutoff = post.expiresAt ?? post.deadlineAt;
  return {
    ...post,
    isOpportunityExpired: !!post.opportunityClosedAt || (!!cutoff && cutoff.getTime() < Date.now()),
  };
};

export const getUserPosts = async (userId: string) => {
  const user = await findUserById(userId);
  if (!user) throw new Error("User does not exist");
  const posts = await findUserPosts(userId);
  return posts.map(toPostDTO);
};

export const getSavedPosts = async (id: string) => {
  const user = await findUserById(id);
  if (!user) throw new Error("User doesnt exist");
  const data = await findUserSavedPosts(id);
  return data.map((sp) => toPostDTO(sp.post));
};

interface GetPostsInput {
  userId: string;
  feed: string;
  cursor?: string;
  limit?: number;
  blockedIds?: string[];
}

export const getPosts = async (data: GetPostsInput) => {
  const { userId, feed, cursor, limit = 10, blockedIds = [] } = data;
  const user = await findUserById(userId);
  if (!user) throw new Error("User not found");

  const savedPosts = await findUserSavedPosts(userId);
  const savedPostIds = new Set(savedPosts.map((sp) => sp.postId));

  let page;
  if (feed === "Global" || feed === "") {
    page = await findAllPosts(cursor, limit, blockedIds);
  } else if (feed === "Following") {
    const following = await prisma.follow.findMany({ where: { followerId: userId } });
    const followingIds = following.map((f) => f.followingId);
    page = await findFollowingPosts(followingIds, cursor, limit, blockedIds);
  } else {
    // University feed
    page = await findUniversityPosts(user.university, cursor, limit, blockedIds);
  }

  return {
    ...page,
    posts: page.posts.map((post) =>
      toPostDTO(withIsSaved(post, savedPostIds)),
    ),
  };
};

interface CreatePostInput {
  body: {
    title: string;
    body?: string;
    location?: string;
    tags: string;
    pollQuestion?: string;
    pollOptions?: string[];
    pollClosesAt?: Date;
    type?: "standard" | "opportunity";
    opportunityType?: OpportunityFilters["opportunityType"];
    workplaceType?: OpportunityFilters["workplaceType"];
    companyName?: string;
    applyUrl?: string;
    deadlineAt?: Date;
    expiresAt?: Date;
  };
  userId: string;
  images?: UploadedImage[];
}

export const createNewPost = async (data: CreatePostInput) => {
  const { title, body, location, tags, pollQuestion, pollOptions, pollClosesAt,
    type = "standard", opportunityType, workplaceType, companyName, applyUrl,
    deadlineAt, expiresAt } =
    data.body;
  const userId = data.userId;
  const images = data.images;
  const publisher = await findUserById(userId);
  if (!publisher) throw new Error("User not found");
  if (type === "opportunity" && publisher.role !== "admin" && !(
    publisher.accountType === "business" && publisher.identityVerified === "true"
  )) {
    throw new Error("Only verified businesses can publish opportunities");
  }

  let uploaded: { url: string; key: string }[] = [];
  if (images && images.length > 0) {
    uploaded = await Promise.all(
      images.map((image) =>
        uploadImage({
          buffer: image.buffer,
          mimeType: image.mimetype,
          folder: "posts",
        }),
      ),
    );
  }
  const tagsArray = [...new Set([
    ...tags.split(" ").filter(Boolean).map((tag) => tag.toLowerCase()),
    ...extractHashtagsFromText(body),
  ])];
  const mentionedUsers = await resolveMentionedUsers(body, userId);

  const post = await createPost({
    userId,
    title,
    body,
    location,
    tags: tagsArray,
    imageUrls: uploaded.map((u) => u.url),
    imagePublicIds: uploaded.map((u) => u.key),
    mentionedUserIds: mentionedUsers.map((user) => user.id),
    poll:
      pollQuestion && pollOptions
        ? { question: pollQuestion, options: pollOptions, closesAt: pollClosesAt }
        : undefined,
    type,
    opportunityType,
    workplaceType,
    companyName,
    applyUrl,
    deadlineAt,
    expiresAt,
  });
  const author = await findUserById(userId);
  await Promise.all(mentionedUsers.map(async (mentionedUser) => {
    const notification = await createNotification({
      actionUserId: userId,
      userId: mentionedUser.id,
      title: "New post mention",
      type: "post-mention",
      message: `${author?.firstName || author?.name} mentioned you in a post`,
      postId: post.id,
    });
    await emitNewNotification(mentionedUser.id, notification);
  }));
  return post;
};

export const likePost = async (data: { postId: string; userId: string }) => {
  const { postId, userId } = data;
  const post = await findPostById(postId);
  const user = await findUserById(userId);
  if (!user || !post) {
    throw new Error("User or post not found");
  }
  const alreadyLiked = await findLikeByPostAndUser(postId, userId);
  if (alreadyLiked) {
    throw new Error("Post already liked");
  }
  await createLike(postId, userId);

  // User likes its own post - do not send notification
  if (post.userId === userId) {
    return;
  }

  const notification = await createNotification({
    actionUserId: userId,
    userId: post.userId,
    title: "New post like",
    type: "post-like",
    message: `${user?.firstName || user?.name} liked your post!`,
  });
  await emitNewNotification(post.userId, notification);
};

export const unlikePost = async (data: { postId: string; userId: string }) => {
  const { postId, userId } = data;
  const post = await findPostById(postId);
  const user = await findUserById(userId);
  if (!user || !post) {
    throw new Error("User or post not found");
  }
  const alreadyLiked = await findLikeByPostAndUser(postId, userId);
  if (!alreadyLiked) {
    throw new Error("Post not liked");
  }
  await deleteLike(postId, userId);
};

interface UpdatePostInput {
  postData: {
    title?: string;
    body?: string;
    images?: string | string[];
    location?: string;
    tags?: string;
    type?: "standard" | "opportunity";
    opportunityType?: OpportunityFilters["opportunityType"];
    workplaceType?: OpportunityFilters["workplaceType"];
    companyName?: string;
    applyUrl?: string;
    deadlineAt?: Date;
    expiresAt?: Date;
  };
  postId: string;
  userId: string;
  images?: UploadedImage[];
}

export const updatePost = async (data: UpdatePostInput) => {
  const { postData, postId, images, userId } = data;

  if (!postData) throw new Error("No post data");

  const currentPost = await findPostById(postId);
  if (!currentPost) throw new Error("Post not found");
  const nextType = postData.type ?? currentPost.type;
  if (nextType === "opportunity") {
    const publisher = await findUserById(userId);
    if (!publisher || (publisher.role !== "admin" && !(
      publisher.accountType === "business" && publisher.identityVerified === "true"
    ))) throw new Error("Only verified businesses can publish opportunities");
  }

  let uploaded: { url: string; key: string }[] = [];
  if (images && images.length > 0) {
    uploaded = await Promise.all(
      images.map((image) =>
        uploadImage({
          buffer: image.buffer,
          mimeType: image.mimetype,
          folder: "posts",
        }),
      ),
    );
  }

  const existing = Array.isArray(postData?.images)
    ? postData.images
    : [postData?.images].filter((v): v is string => !!v);

  // Retained images keep whichever storage key they already had; only the
  // dropped-and-re-added case can't be recovered here, which matches the URLs
  // the client actually sent back.
  const urlToKey = new Map(
    currentPost.imagesUrls.map((url, i) => [url, currentPost.imagesPublicIds[i]]),
  );
  const existingKeys = existing
    .map((url) => urlToKey.get(url))
    .filter((key): key is string => !!key);
  const removedKeys = currentPost.imagesPublicIds.filter(
    (key) => !existingKeys.includes(key),
  );

  const tagsArray = [...new Set([
    ...(postData.tags ?? "").split(" ").filter(Boolean).map((tag) => tag.toLowerCase()),
    ...extractHashtagsFromText(postData.body),
  ])];

  await prisma.post.update({
    where: { id: postId },
    data: {
      title: postData.title,
      body: postData.body,
      imagesUrls: [...existing, ...uploaded.map((u) => u.url)],
      imagesPublicIds: [...existingKeys, ...uploaded.map((u) => u.key)],
      location: postData?.location?.trim() ? postData.location : undefined,
      type: postData.type,
      opportunityType: nextType === "opportunity" ? postData.opportunityType : null,
      workplaceType: nextType === "opportunity" ? postData.workplaceType : null,
      companyName: nextType === "opportunity" ? postData.companyName : null,
      applyUrl: nextType === "opportunity" ? postData.applyUrl : null,
      deadlineAt: nextType === "opportunity" ? postData.deadlineAt : null,
      expiresAt: nextType === "opportunity" ? (postData.expiresAt ?? postData.deadlineAt) : null,
      tags: {
        set: [],
        connectOrCreate: tagsArray.map((name) => ({
          where: { name },
          create: { name },
        })),
      },
    },
  });

  if (removedKeys.length > 0) {
    deleteImages(removedKeys).catch((error: unknown) => {
      console.error(`Failed to delete removed post images for ${postId}:`, error);
    });
  }
};

export const getOpportunities = async (filters: OpportunityFilters) => {
  const page = await findOpportunities(filters);
  const saved = await prisma.savedPost.findMany({
    where: { userId: filters.viewerId, postId: { in: page.posts.map((post) => post.id) } },
    select: { postId: true },
  });
  const savedIds = new Set(saved.map((item) => item.postId));
  return { ...page, posts: page.posts.map((post) => toPostDTO(withIsSaved(post, savedIds))) };
};

export const closeOpportunity = async (postId: string, closed: boolean) => {
  const post = await findPostById(postId);
  if (!post || post.type !== "opportunity") throw new Error("Opportunity not found");
  if (!closed) {
    const cutoff = post.expiresAt ?? post.deadlineAt;
    if (cutoff && cutoff.getTime() < Date.now()) {
      throw new Error("Update the deadline before reopening this opportunity");
    }
  }
  return toPostDTO(await setOpportunityClosed(postId, closed));
};

export const deletePost = async (data: { postId: string }) => {
  const { postId } = data;
  const post = await findPostById(postId);
  if (!post) throw new Error("Post not found");
  await deleteLikes(postId);
  await prisma.post.delete({ where: { id: postId } });

  if (post.imagesPublicIds.length > 0) {
    deleteImages(post.imagesPublicIds).catch((error: unknown) => {
      console.error(`Failed to delete storage images for post ${postId}:`, error);
    });
  }
};

export const getSearchedPosts = async (text: string) => {
  const posts = await findPostsByText(text);
  return posts.map(toPostDTO);
};

export const getPostsByTag = async (tag: string) => {
  const posts = await findPostsByTag(tag);
  return posts.map(toPostDTO);
};
