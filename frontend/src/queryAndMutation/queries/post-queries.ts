import { useQuery } from "@tanstack/react-query";
import { usePostStore } from "../../store/postStore";
import type { Post, PostAuthor } from "../types";

export const useGetPostQuery = (id?: string) => {
  const { getPost } = usePostStore();
  return useQuery({
    queryFn: async () => (await getPost(id)) as Post,
    queryKey: ["post", id],
  });
};

export const useGetLikesQuery = (postId: string) => {
  const { getLikes } = usePostStore();
  return useQuery({
    queryFn: () => getLikes(postId) as Promise<number>,
    queryKey: ["likes", postId],
  });
};

export const useGetSavedPostsQuery = (id: string) => {
  const { getSavedPosts } = usePostStore();
  return useQuery({
    queryFn: async () => (await getSavedPosts(id)) as Post[],
    queryKey: ["saved_posts", id],
  });
};

export const useCheckPostIsSaved = (id: string) => {
  const { checkSaved } = usePostStore();
  return useQuery({
    queryFn: async () => await checkSaved(id),
    queryKey: ["saved_posts", id],
  });
};

export const useGetUserPostsQuery = (id?: string) => {
  const { getUserPosts } = usePostStore();
  return useQuery({
    queryFn: async () => (await getUserPosts(id)) as Post[],
    queryKey: ["userPosts", id],
    enabled: !!id,
  });
};

export const useGetPostsQuery = (feedSelector: string) => {
  const { getPosts } = usePostStore();
  return useQuery({
    queryFn: () => getPosts(feedSelector) as Promise<Post[]>,
    queryKey: ["posts", feedSelector],
  });
};

export const usePostUserQuery = (id: string, postId: string) => {
  const { getPostUser } = usePostStore();
  return useQuery({
    queryFn: () => getPostUser(id) as Promise<PostAuthor>,
    queryKey: ["creator", postId],
    enabled: !!id,
  });
};

export const usePostLikedQuery = (postId: string) => {
  const { userHasLiked } = usePostStore();
  return useQuery({
    queryFn: () => userHasLiked(postId) as Promise<boolean>,
    queryKey: ["userLiked", postId],
  });
};

export const useGetRelatedPostsQuery = (tag: string) => {
  const { getRelatedPosts } = usePostStore();
  return useQuery({
    queryFn: () => getRelatedPosts(tag) as Promise<Post[]>,
    queryKey: ["relatedPosts"],
  });
};

export const useGetUsersWhoLikedPostQuery = (postId: string) => {
  const { getUsersWhoLikedPost } = usePostStore();
  return useQuery({
    queryFn: () => getUsersWhoLikedPost(postId) as Promise<PostAuthor[]>,
    queryKey: ["usersWhoLiked", postId],
  });
};

export const useGetPostsByTagQuery = (tag: string) => {
  const { getPostsByTag } = usePostStore();
  return useQuery({
    queryFn: () => getPostsByTag(tag) as Promise<Post[]>,
    queryKey: ["postsByTag", tag],
  });
};

export const useGetPostsByNameQuery = (name: string) => {
  const { getPostsByName } = usePostStore();
  return useQuery({
    queryFn: () => getPostsByName(name) as Promise<Post[]>,
    queryKey: ["postsByName", name],
  });
};
