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

type UploadedImage = Express.Multer.File;

const withIsSaved = <T extends { id: string }>(
  post: T,
  savedPostIds: Set<string>,
) => ({ ...post, isSaved: savedPostIds.has(post.id) });

export const getUserPosts = async (userId: string) => {
  const user = await findUserById(userId);
  if (!user) throw new Error("User does not exist");
  return findUserPosts(userId);
};

export const getSavedPosts = async (id: string) => {
  const user = await findUserById(id);
  if (!user) throw new Error("User doesnt exist");
  const data = await findUserSavedPosts(id);
  return data.map((sp) => sp.post);
};

interface GetPostsInput {
  userId: string;
  feed: string;
  cursor?: string;
  limit?: number;
}

export const getPosts = async (data: GetPostsInput) => {
  const { userId, feed, cursor, limit = 10 } = data;
  const user = await findUserById(userId);
  if (!user) throw new Error("User not found");

  const savedPosts = await findUserSavedPosts(userId);
  const savedPostIds = new Set(savedPosts.map((sp) => sp.postId));

  let page;
  if (feed === "Global" || feed === "") {
    page = await findAllPosts(cursor, limit);
  } else if (feed === "Following") {
    const following = await prisma.follow.findMany({ where: { followerId: userId } });
    const followingIds = following.map((f) => f.followingId);
    page = await findFollowingPosts(followingIds, cursor, limit);
  } else {
    // University feed
    page = await findUniversityPosts(user.university, cursor, limit);
  }

  return {
    ...page,
    posts: page.posts.map((post) => withIsSaved(post, savedPostIds)),
  };
};

interface CreatePostInput {
  body: { title: string; body?: string; location?: string; tags: string };
  userId: string;
  images?: UploadedImage[];
}

export const createNewPost = async (data: CreatePostInput) => {
  const { title, body, location, tags } = data.body;
  const userId = data.userId;
  const images = data.images;

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
  const tagsArray = tags.split(" ").filter(Boolean).map((tag) => tag.toLowerCase());

  return createPost({
    userId,
    title,
    body,
    location,
    tags: tagsArray,
    imageUrls: uploaded.map((u) => u.url),
    imagePublicIds: uploaded.map((u) => u.key),
  });
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
    body?: string;
    images?: string | string[];
    location?: string;
    tags?: string;
  };
  postId: string;
  images?: UploadedImage[];
}

export const updatePost = async (data: UpdatePostInput) => {
  const { postData, postId, images } = data;

  if (!postData) throw new Error("No post data");

  const currentPost = await findPostById(postId);
  if (!currentPost) throw new Error("Post not found");

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

  const tagsArray = (postData.tags ?? "")
    .split(" ")
    .filter(Boolean)
    .map((tag) => tag.toLowerCase());

  await prisma.post.update({
    where: { id: postId },
    data: {
      body: postData.body,
      imagesUrls: [...existing, ...uploaded.map((u) => u.url)],
      imagesPublicIds: [...existingKeys, ...uploaded.map((u) => u.key)],
      location: postData?.location?.trim() ? postData.location : undefined,
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
  return findPostsByText(text);
};

export const getPostsByTag = async (tag: string) => {
  return findPostsByTag(tag);
};
