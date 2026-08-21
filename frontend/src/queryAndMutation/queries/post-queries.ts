import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { usePostStore } from "../../store/postStore";
import type {
  Post,
  PostAuthor,
  PostsPage,
  PublicPost,
  RelevantLiker,
  ShareRecipientsResponse,
  UsersWhoLikedPage,
} from "../types";

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

export const useGetRelevantLikerQuery = (postId: string) => {
  const { getRelevantLiker } = usePostStore();
  return useQuery({
    queryFn: () => getRelevantLiker(postId) as Promise<RelevantLiker>,
    queryKey: ["relevantLiker", postId],
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

export const useGetPostsInfiniteQuery = (feedSelector: string) => {
  const { getPosts } = usePostStore();
  return useInfiniteQuery<PostsPage>({
    queryKey: ["posts", feedSelector],
    queryFn: ({ pageParam }) =>
      getPosts(feedSelector, pageParam as string | undefined),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
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

export const useGetUsersWhoLikedInfiniteQuery = (postId: string) => {
  const { getUsersWhoLikedPost } = usePostStore();
  return useInfiniteQuery<UsersWhoLikedPage>({
    queryKey: ["usersWhoLiked", postId],
    queryFn: ({ pageParam }) =>
      getUsersWhoLikedPost(postId, pageParam as string | undefined) as Promise<UsersWhoLikedPage>,
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
  });
};

export const useGetPostsByNameQuery = (name: string) => {
  const { getPostsByName } = usePostStore();
  return useQuery({
    queryFn: () => getPostsByName(name) as Promise<Post[]>,
    queryKey: ["postsByName", name],
  });
};

export const useGetPublicPostQuery = (id?: string) => {
  const { getPublicPost } = usePostStore();
  return useQuery({
    queryFn: async () => (await getPublicPost(id)) as PublicPost,
    queryKey: ["publicPost", id],
    enabled: !!id,
    retry: false,
  });
};

export const useGetShareRecipientsQuery = (enabled: boolean) => {
  const { getShareRecipients } = usePostStore();
  return useQuery({
    queryFn: () => getShareRecipients() as Promise<ShareRecipientsResponse>,
    queryKey: ["shareRecipients"],
    enabled,
  });
};
