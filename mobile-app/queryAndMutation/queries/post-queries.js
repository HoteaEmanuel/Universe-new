import { useQuery } from "@tanstack/react-query";
import { usePostStore } from "../../store/postStore";
import { useAuthStore } from "../../store/authStore";
export const useGetPostQuery = (id) => {
  const { getPost } = usePostStore();
  return useQuery({
    queryFn: async () => await getPost(id),
    queryKey: ["post", id],
  });
};
export const useGetLikesQuery = (postId) => {
  const { getLikes } = usePostStore();
  console.log("GET LIKES : " + postId);
  return useQuery({
    queryFn: async () => await getLikes(postId),
    queryKey: ["likes", postId],
  });
};
export const useGetSavedPostsQuery = (id) => {
  const { getSavedPosts } = usePostStore();
  return useQuery({
    queryFn: async () => await getSavedPosts(id),
    queryKey: ["saved_posts", id],
  });
};
export const useCheckPostIsSaved = (id) => {
  const { checkSaved } = usePostStore();
  return useQuery({
    queryFn: async () => await checkSaved(id),
    queryKey: ["saved_posts", id],
  });
};
export const useGetUserPostsQuery = (id) => {
  const { getUserPosts } = usePostStore();
  return useQuery({
    queryFn: async () => await getUserPosts(id),
    queryKey: ["userPosts", id],
  });
};
export const useGetPostsQuery = (feedSelector) => {
  const { getPosts } = usePostStore();
  return useQuery({
    queryFn: () => getPosts(feedSelector),
    queryKey: ["posts", feedSelector],
  });
};
export const usePostUserQuery = (id, postId) => {
  const { getPostUser } = usePostStore();
  return useQuery({
    queryFn: () => getPostUser(id),
    queryKey: ["creator", postId],
    enabled: !!id,
  });
};
export const usePostLikedQuery = (postId) => {
  const { userHasLiked } = usePostStore();
  return useQuery({
    queryFn: () => userHasLiked(postId),
    queryKey: ["userLiked", postId],
  });
};
export const useGetRelatedPostsQuery = (tag) => {
  const { getRelatedPosts } = usePostStore();
  return useQuery({
    queryFn: () => getRelatedPosts(tag),
    queryKey: ["relatedPosts"],
  });
};

export const useGetUsersWhoLikedPostQuery = (postId) => {
  const { getUsersWhoLikedPost } = usePostStore();
  return useQuery({
    queryFn: () => getUsersWhoLikedPost(postId),
    queryKey: ["usersWhoLiked", postId],
  });
};

export const useGetPostsByTagQuery = (tag) => {
  const { getPostsByTag } = usePostStore();
  return useQuery({
    queryFn: () => getPostsByTag(tag),
    queryKey: ["postsByTag", tag],
  });
};

export const useGetPostsByNameQuery = (name) => {
  const { getPostsByName } = usePostStore();
  return useQuery({
    queryFn: () => getPostsByName(name),
    queryKey: ["postsByName", name],
  });
};
