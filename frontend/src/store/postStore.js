import axios from "axios";
import { create } from "zustand";
const API_URL =
  import.meta.env.VITE_REACT_APP_API_URL || "http://localhost:5000/api";
axios.defaults.withCredentials = true;

export const usePostStore = create((set) => ({
  isLoading: false,
  error: null,
  getPostUser: async (id) => {
    set({ isLoading: true });
    if (!id) return;
    try {
      const response = await axios.get(`${API_URL}/post-user/${id}`);
      const user = response.data.user;
      return user;
    } catch (error) {
      set({ error: error });
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  getUserPosts: async (id) => {
    set({ isLoading: true });
    try {
      const response = await axios.get(`${API_URL}/user-posts/${id}`);
      return response.data.posts;
    } catch (error) {
      set({ error: error });
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  getSavedPosts: async (id) => {
    set({ isLoading: true });

    try {
      const response = await axios.get(`${API_URL}/saved-posts/${id}`);
      console.log(response);
      return response.data.savedPosts;
    } catch (error) {
      set({ error: error });
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  getPost: async (id) => {
    set({ isLoading: true });
    try {
      const response = await axios.get(`${API_URL}/post/${id}`);
      const post = response.data.post;

      console.log("FETCHED POST: ", post);
      // const imageResponse = await fetch(post.imageUrl);
      // const imageBlob = await imageResponse.blob();
      // const image = new File([imageBlob], post.imagePublicId, {
      //   type: imageBlob.type,
      // });
      // post.file = image;
      return post;
    } catch (error) {
      set({ error: error });
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  createPost: async (post) => {
    set({ isLoading: true });
    try {
      console.log("CREATING THE POST: ", post);
      const formData = new FormData();
      console.log("POST TITLE: ", post.title);
      formData.append("title", post.title);
      if (post?.body) {
        formData.append("body", post.body);
      }
      if (post?.location) {
        formData.append("location", post.location);
      }
      formData.append("tags", post.tags);
      post.images.forEach((image) => {
        formData.append("images", image);
      });
      console.log("FORM DATA: ");
      console.log(formData);
      await axios.post(`${API_URL}/posts`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    } catch (error) {
      set({ error: error });
    } finally {
      set({ isLoading: false });
    }
  },
  updatePost: async (data) => {
    console.log("POST UPDATE CALLED");
    set({ isLoading: true });
    try {
      const formData = new FormData();
      console.log("DATA: ", data);
      formData.append("body", data.body);
      if (data?.location);
      formData.append("location", data.location);
      formData.append("tags", data.tags);
      data.images.forEach((image) => {
        formData.append("images", image);
      });
      console.log("HIER?>");
      await axios.patch(`${API_URL}/posts/${data.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    } catch (error) {
      set({ error: error });
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  deletePost: async (id) => {
    set({ isLoading: true });
    try {
      await axios.delete(`${API_URL}/posts/${id}`);
    } catch (error) {
      set({ error: error });
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  getRelatedPosts: async (tag) => {
    set({ isLoading: true });
    try {
      const response = await axios.get(`${API_URL}/related-posts/${tag}`);

      return response.data.posts;
    } catch (error) {
      set({ error: error });
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  getPosts: async (feed, cursor) => {
    set({ isLoading: true });
    try {
      const response = await axios.get(`${API_URL}/posts/${feed}`, {
        params: cursor ? { cursor } : undefined,
      });
      return {
        posts: response.data.posts,
        nextCursor: response.data.nextCursor,
        hasMore: response.data.hasMore,
      };
    } catch (error) {
      set({ error: error });
    } finally {
      set({ isLoading: false });
    }
  },
  getLikes: async (postId) => {
    set({ isLoading: true });
    try {
      const response = await axios.get(`${API_URL}/likes/${postId}`);
      return response.data.likes;
    } catch (error) {
      set({ error: error });
    } finally {
      set({ isLoading: false });
    }
  },
  userHasLiked: async (postId) => {
    set({ isLoading: true });
    try {
      const response = await axios.get(`${API_URL}/user-liked/${postId}`);
      return response.data.hasLiked;
    } catch (error) {
      set({ error: error });
    } finally {
      set({ isLoading: false });
    }
  },
  getUsersWhoLikedPost: async (postId) => {
    set({ isLoading: true });
    try {
      const response = await axios.get(`${API_URL}/users-who-liked/${postId}`);
      return response.data.users;
    } catch (error) {
      set({ error: error });
    } finally {
      set({ isLoading: false });
    }
  },
  likePost: async ({ postId }) => {
    set({ isLoading: true });
    try {
      const response = await axios.post(`${API_URL}/like-post`, {
        postId,
      });
      if (!response.ok) throw new Error("Liking went wrong");
      return response.json();
    } catch (error) {
      set({ error: error });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  unlikePost: async ({ postId }) => {
    set({ isLoading: true });
    try {
      const response = await axios.post(`${API_URL}/unlike-post`, {
        postId,
      });
      return response.json();
    } catch (error) {
      set({ error: error });
    } finally {
      set({ isLoading: false });
    }
  },
  checkSaved: async (id) => {
    set({ isLoading: true });
    try {
      const response = await axios.get(`${API_URL}/check-saved/${id}`);
      return response.data;
    } catch (error) {
      set({ error: error });
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },

  getPostsByName: async (name) => {
    try {
      const response = await axios.get(`${API_URL}/posts-by-name/${name}`);
      return response.data.posts;
    } catch (error) {
      set({ error: error });
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  getPostsByTag: async (tag) => {
    try {
      const response = await axios.get(`${API_URL}/posts-by-tag/${tag}`);
      return response.data.posts;
    } catch (error) {
      set({ error: error });
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
