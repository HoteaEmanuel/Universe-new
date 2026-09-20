import { mutationOptions, type QueryClient } from "@tanstack/react-query";
import type { createPostsApi } from "../api/posts.js";
import type { CreatePostPayload, UpdatePostPayload } from "../post.js";
import { postKeys } from "../queries/keys.js";

type PostsApi = ReturnType<typeof createPostsApi>;

// Toasts and other UI feedback are composed at the call site (app-local);
// these factories own only mutationFn + cache invalidation, which is
// identical across platforms.
export const createPostMutations = (api: PostsApi, queryClient: QueryClient) => ({
  create: <TFile>() =>
    mutationOptions({
      mutationFn: (post: CreatePostPayload<TFile>) => api.create(post),
      onSuccess: (_data: void, post: CreatePostPayload<TFile>) => {
        queryClient.invalidateQueries({ queryKey: postKeys.all });
        if (post.type === "opportunity") {
          queryClient.invalidateQueries({ queryKey: ["opportunities"] });
        }
      },
    }),

  update: <TFile>(userId?: string) =>
    mutationOptions({
      mutationFn: (data: UpdatePostPayload<TFile>) => api.update(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: postKeys.all });
        queryClient.invalidateQueries({ queryKey: postKeys.byUser(userId ?? "") });
        queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      },
    }),

  remove: (postId: string, userId?: string) =>
    mutationOptions({
      mutationFn: () => api.remove(postId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: postKeys.all });
        queryClient.invalidateQueries({ queryKey: postKeys.byUser(userId ?? "") });
      },
    }),

  // The original invalidated `["posts", postId]`, a key no query in this
  // codebase actually uses (the detail query key is singular `["post", id]`)
  // — under TanStack's prefix matching that invalidation never matched
  // anything. Fixed to the real detail key.
  like: (postId: string) =>
    mutationOptions({
      mutationFn: () => api.like(postId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) });
        queryClient.invalidateQueries({ queryKey: postKeys.likesCount(postId) });
      },
    }),

  unlike: (postId: string) =>
    mutationOptions({
      mutationFn: () => api.unlike(postId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) });
        queryClient.invalidateQueries({ queryKey: postKeys.likesCount(postId) });
      },
    }),

  share: (postId: string) =>
    mutationOptions({
      mutationFn: ({ recipientIds, groupIds }: { recipientIds: string[]; groupIds: string[] }) =>
        api.share(postId, recipientIds, groupIds),
    }),

  setOpportunityClosed: (postId: string) =>
    mutationOptions({
      mutationFn: (closed: boolean) => api.setOpportunityClosed(postId, closed),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["opportunities"] });
        queryClient.invalidateQueries({ queryKey: postKeys.all });
        queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) });
      },
    }),
});
