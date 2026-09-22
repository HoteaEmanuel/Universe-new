import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { createPostsApi } from "@universe/shared/api";
import { createPostMutations } from "@universe/shared/mutations";
import { postKeys } from "@universe/shared/queries";
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

type LikeSnapshot = { liked?: boolean; likes?: number };

// The shared like/unlike mutations (packages/shared/src/mutations/posts.ts)
// invalidate the likes-count query on success but not the "did I like this"
// query, so a plain refetch would leave the heart never flipping back. This
// optimistic write is both the fix for that gap and what makes the tap feel
// instant — rolled back in onError via the snapshot it returns.
const applyOptimisticLike = (
  queryClient: QueryClient,
  postId: string,
  nextLiked: boolean,
): LikeSnapshot => {
  const snapshot: LikeSnapshot = {
    liked: queryClient.getQueryData(postKeys.liked(postId)),
    likes: queryClient.getQueryData(postKeys.likesCount(postId)),
  };
  queryClient.setQueryData(postKeys.liked(postId), nextLiked);
  queryClient.setQueryData(postKeys.likesCount(postId), (old: number | undefined) => {
    const base = old ?? snapshot.likes ?? 0;
    return Math.max(base + (nextLiked ? 1 : -1), 0);
  });
  return snapshot;
};

const restoreLikeSnapshot = (queryClient: QueryClient, postId: string, snapshot: LikeSnapshot) => {
  queryClient.setQueryData(postKeys.liked(postId), snapshot.liked);
  queryClient.setQueryData(postKeys.likesCount(postId), snapshot.likes);
};

export const useLikeMutation = (postId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...createPostMutations(postsApi, queryClient).like(postId),
    onMutate: () => applyOptimisticLike(queryClient, postId, true),
    onError: (_error, _variables, snapshot) => {
      if (snapshot) restoreLikeSnapshot(queryClient, postId, snapshot);
    },
  });
};

export const useUnlikeMutation = (postId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...createPostMutations(postsApi, queryClient).unlike(postId),
    onMutate: () => applyOptimisticLike(queryClient, postId, false),
    onError: (_error, _variables, snapshot) => {
      if (snapshot) restoreLikeSnapshot(queryClient, postId, snapshot);
    },
  });
};
