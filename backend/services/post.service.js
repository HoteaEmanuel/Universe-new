import {
  findPostById,
  findUserPosts,
  findUserSavedPosts,
  createPost,
  findAllPosts,
  findPostsByText,
  findPostsByTag,
} from "../repository/post.repository.js";
import { findUserById, findUserByName } from "../repository/user.repository.js";
import { redis } from "../lib/redis.js";
import cloudinary from "cloudinary";
import { getReceiverSocketId, io } from "../lib/socket.js";
import {
  createLike,
  deleteLike,
  deleteLikes,
  findLikeByPostAndUser,
} from "../repository/like.repository.js";
import { createNotification } from "../repository/notification.repository.js";
// export const getPost = async () => {
//   const post = await findPostById(id);
//   if (!post) throw new Error("Post not found");
//   const savedPost = await SavedPost.findOne({ user: req.userId, post: id });
//   if (savedPost) post.isSaved = true;
//   else post.isSaved = false;
// };

export const getUserPosts = async (userId) => {
  const user = await findUserById(userId);
  if (!user) throw new Error("User does not exist");
  // const posts = await redis.get("user-posts-" + userId);
  // if (posts) {
  //   return posts;
  // }
  const userPosts = await findUserPosts(userId);

  // await redis.set("user-posts-" + userId, JSON.stringify(userPosts));
  return userPosts;
};

export const getSavedPosts = async (id) => {
  const user = await findUserById(id);
  if (!user) throw new Error("User doesnt exist");
  const data = await findUserSavedPosts(id);
  const savedPosts = data.map((sp) => sp.post);
  return savedPosts;
};

export const getPosts = async (data) => {
  const { userId, feed } = data;
  const user = await findUserById(userId);
  if (!user) throw new Error("User not found");

  const posts = await findAllPosts();
  const savedPosts = await findUserSavedPosts(userId);
  for (let post of posts) {
    post.isSaved = false;
    for (let savedPost of savedPosts) {
      if (savedPost.post._id.equals(post._id)) {
        post.isSaved = true;
        break;
      }
    }
  }
  let filteredPosts = posts;
  if (feed === "Global" || feed === "") {
    filteredPosts = posts;
  } else if (feed === "Following") {
    const following = await Follow.find({ follower: userId });
    const followingIds = following.map((follow) => follow.following.toString());
    filteredPosts = posts.filter((post) =>
      followingIds.includes(post.userId.toString()),
    );
  } else {
    // University feed
    const university = await findUserByName(user.university);
    if (!university) throw new Error("University not found");
    filteredPosts = posts.filter(
      (post) =>
        post.caption.includes(user.university) ||
        post._id.equals(university._id) ||
        post.tags.includes(user.university.toLowerCase()),
    );
  }
  return filteredPosts;
};

export const createNewPost = async (data) => {
  const { title, body, location, tags } = data.body;
  const userId = data.userId;

  const images = data.images;

  let result = [];
  if (images && images.length > 0) {
    // Image uploaded
    const uploadResults = await Promise.all(
      images.map((image) =>
        cloudinary.uploader.upload(image.path, {
          folder: "posts",
          resource_type: "image",
        }),
      ),
    );
    result = uploadResults;
  }
  let tagsArray = [];

  for (let tag of tags.split(" ")) {
    tagsArray.push(tag.toLowerCase());
  }

  const imageSecureUrls = result ? result.map((r) => r.secure_url) : null;
  const imagePublicIds = result ? result.map((r) => r.public_id) : null;
  const postBody = {
    userId: userId,
    title: title,
    body: body,
    tags: tagsArray,
    imageUrls: imageSecureUrls,
    imagePublicIds: imagePublicIds,
  };

  const post = await createPost(postBody);
  // if (location && location.trim().length) post.location = location;
  // refresh cache for the user posts
  const posts = await redis.get("user-posts-" + userId);
  // if (posts) await redis.del("user-posts-" + userId);
  // posts.push(post);
  // redis.set("user-posts-" + userId, JSON.stringify(posts));
  return post;
};

export const likePost = async (data) => {
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
  if (post.userId.equals(userId)) {
    return res.status(200).json({ message: "Liked the post successfully" });
  }

  const notifData = {
    actionUserId: userId,
    userId: post.userId,
    title:"New post like",
    type:"post-like",
    message: `${user?.firstName || user?.name} liked your post!`,
  };
  const notification = await createNotification(notifData);
  io.to(getReceiverSocketId(post.userId.toString())).emit(
    "newNotification",
    notification,
  );
  await notification.save();
};

export const unlikePost = async (data) => {
  const { postId, userId } = data;
  const post = await findPostById(postId);
  const user = await findUserById(userId);
  if (!user || !post) {
    throw new Error("User or post not found");
  }
  const alreadyLiked = await findLikeByPostAndUser(postId, userId);
  if (!alreadyLiked) {
    return res.status(400).json({ message: "Post not liked" });
  }
  await deleteLike(postId, userId);
};

export const updatePost = async (data) => {
  const { postData, postId, images, userId } = data;

  console.log("POST DATA: ", postData);
  console.log("IMAGES: ", images);
  if (!postData) throw new Error("No post data");
  const post = await findPostById(postId);
  if (!post) throw new Error("No post found with that id");
  if (!post.userId.equals(userId)) throw new Error("No permission to edit");

  let result = [];

  if (images && images.length > 0) {
    // Image uploaded
    const uploadResults = await Promise.all(
      images.map((image) =>
        cloudinary.uploader.upload(image.path, {
          folder: "posts",
          resource_type: "image",
        }),
      ),
    );
    result = uploadResults;
  }
  post.body = postData.body;
  const imageSecureUrls = result ? result.map((r) => r.secure_url) : null;
  const imagePublicIds = result ? result.map((r) => r.public_id) : null;

  const existing = Array.isArray(postData?.images)
    ? postData.images
    : [postData?.images].filter(Boolean);

  post.imagesUrls = [...existing, ...(imageSecureUrls ?? [])];
  post.imagesPublicIds = imagePublicIds;
  if (postData?.location.trim() !== "") post.location = postData.location;
  post.tags = postData.tags;
  // const cachedPost = await redis.get("user-posts-" + userId);
  // if (cachedPost) await redis.del("user-posts-" + userId);

  console.log("FINAL POST : ", post);
  await post.save();
};

export const deletePost = async (data) => {
  const { postId, userId } = data;
  const post = await findPostById(postId);
  await deleteLikes(postId);
  // const posts = await redis.get("user-posts-" + userId);
  if (!post) throw new Error("Post not found");
  // if (posts) await redis.del("user-posts-" + userId);
  // posts.delete(post);
  // redis.set("user-posts-" + userId, JSON.stringify(posts));
};

export const getSearchedPosts = async (text) => {
  const posts = await findPostsByText(text);
  return posts;
};

export const getPostsByTag = async (tag) => {
  const posts = await findPostsByTag(tag);
  return posts;
};
