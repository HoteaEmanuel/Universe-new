import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPostsApi } from "@universe/shared/api";
import { createPostMutations } from "@universe/shared/mutations";
import { httpClient } from "../../lib/http";

const postsApi = createPostsApi(httpClient);

// React Native's FormData needs { uri, name, type } for a file part, unlike
// web's real File/Blob — see the CreatePostPayload<TFile> note in
// packages/shared/src/api/posts.ts.
export type CreatePostFile = { uri: string; name: string; type: string };

export const useCreatePostMutation = () => {
  const queryClient = useQueryClient();
  return useMutation(createPostMutations(postsApi, queryClient).create<CreatePostFile>());
};

export const useUpdatePostMutation = (userId?: string) => {
  const queryClient = useQueryClient();
  return useMutation(createPostMutations(postsApi, queryClient).update<CreatePostFile>(userId));
};

export const useDeletePostMutation = (postId: string, userId?: string) => {
  const queryClient = useQueryClient();
  return useMutation(createPostMutations(postsApi, queryClient).remove(postId, userId));
};

export const useBulkDeletePostsMutation = (userId?: string) => {
  const queryClient = useQueryClient();
  return useMutation(createPostMutations(postsApi, queryClient).removeMany(userId));
};

// The shared like/unlike mutations (packages/shared/src/mutations/posts.ts)
// already patch isLikedByViewer/likesCount on the cached post itself and
// roll back on error - no app-local optimistic logic needed here anymore.
export const useLikeMutation = (postId: string) => {
  const queryClient = useQueryClient();
  return useMutation(createPostMutations(postsApi, queryClient).like(postId));
};

export const useUnlikeMutation = (postId: string) => {
  const queryClient = useQueryClient();
  return useMutation(createPostMutations(postsApi, queryClient).unlike(postId));
};

export const useSetOpportunityClosedMutation = (postId: string) => {
  const queryClient = useQueryClient();
  return useMutation(createPostMutations(postsApi, queryClient).setOpportunityClosed(postId));
};
