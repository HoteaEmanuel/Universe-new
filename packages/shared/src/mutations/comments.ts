import { mutationOptions, type InfiniteData, type QueryClient } from "@tanstack/react-query";
import type { createCommentsApi } from "../api/comments.js";
import type { PostComment, PostCommentsPage } from "../post.js";
import { commentKeys } from "../queries/keys.js";

type CommentsApi = ReturnType<typeof createCommentsApi>;
type CommentsCache = InfiniteData<PostCommentsPage>;

const prependOptimisticComment = (
  data: CommentsCache | undefined,
  comment: PostComment,
): CommentsCache | undefined => {
  if (!data || data.pages.length === 0) return data;
  const pages = [...data.pages];
  const firstPage = pages[0];
  // Shown at the top instantly for immediate feedback; the mutation's
  // onSettled refetch resorts it into its true likes-then-recency position.
  pages[0] = { ...firstPage, comments: [comment, ...firstPage.comments] };
  return { ...data, pages };
};

const removeCommentFromPages = (
  data: CommentsCache | undefined,
  commentId: string,
): CommentsCache | undefined => {
  if (!data) return data;
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      comments: page.comments.filter((comment) => comment.id !== commentId),
    })),
  };
};

// Toasts and other UI feedback are composed at the call site (app-local);
// these factories own only mutationFn + optimistic cache updates +
// invalidation. `authorId` is closed over rather than read from an auth
// store here, since packages/shared has no access to app-local state.
export const createCommentMutations = (api: CommentsApi, queryClient: QueryClient) => ({
  sendComment: (postId?: string, authorId?: string) =>
    mutationOptions({
      mutationFn: (comment: string) => api.send(postId as string, comment),
      onMutate: async (comment: string) => {
        const queryKey = commentKeys.list(postId ?? "");
        await queryClient.cancelQueries({ queryKey });
        const previousComments = queryClient.getQueryData<CommentsCache>(queryKey);
        const optimisticComment: PostComment = {
          id: `optimistic-${Date.now()}`,
          userId: authorId ?? "",
          postId: postId ?? "",
          text: comment,
          createdAt: new Date().toISOString(),
          likesCount: 0,
          isLiked: false,
          mentionedUsers: [],
        };
        queryClient.setQueryData<CommentsCache>(queryKey, (old) =>
          prependOptimisticComment(old, optimisticComment),
        );
        queryClient.setQueryData<number>(commentKeys.count(postId ?? ""), (old) => (old ?? 0) + 1);
        return { previousComments };
      },
      onError: (_err, _comment, context) => {
        if (context?.previousComments) {
          queryClient.setQueryData(commentKeys.list(postId ?? ""), context.previousComments);
        }
        queryClient.setQueryData<number>(commentKeys.count(postId ?? ""), (old) =>
          Math.max(0, (old ?? 1) - 1),
        );
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: commentKeys.list(postId ?? "") });
        queryClient.invalidateQueries({ queryKey: commentKeys.count(postId ?? "") });
      },
    }),

  sendReply: (postId?: string, parentId?: string, authorId?: string) =>
    mutationOptions({
      mutationFn: (comment: string) => api.send(postId as string, comment, parentId),
      onMutate: async (comment: string) => {
        const queryKey = commentKeys.replies(postId ?? "", parentId ?? "");
        await queryClient.cancelQueries({ queryKey });
        const previousReplies = queryClient.getQueryData<CommentsCache>(queryKey);
        const optimisticReply: PostComment = {
          id: `optimistic-${Date.now()}`,
          userId: authorId ?? "",
          postId: postId ?? "",
          text: comment,
          createdAt: new Date().toISOString(),
          likesCount: 0,
          isLiked: false,
          mentionedUsers: [],
          parentId,
        };
        queryClient.setQueryData<CommentsCache>(queryKey, (old) =>
          prependOptimisticComment(old, optimisticReply),
        );
        queryClient.setQueryData<number>(commentKeys.count(postId ?? ""), (old) => (old ?? 0) + 1);
        return { previousReplies };
      },
      onError: (_err, _comment, context) => {
        const queryKey = commentKeys.replies(postId ?? "", parentId ?? "");
        if (context?.previousReplies) {
          queryClient.setQueryData(queryKey, context.previousReplies);
        }
        queryClient.setQueryData<number>(commentKeys.count(postId ?? ""), (old) =>
          Math.max(0, (old ?? 1) - 1),
        );
      },
      onSettled: () => {
        queryClient.invalidateQueries({
          queryKey: commentKeys.replies(postId ?? "", parentId ?? ""),
        });
        queryClient.invalidateQueries({ queryKey: commentKeys.count(postId ?? "") });
      },
    }),

  remove: (postId?: string, parentId?: string | null) => {
    const queryKey = parentId
      ? commentKeys.replies(postId ?? "", parentId)
      : commentKeys.list(postId ?? "");
    return mutationOptions({
      mutationFn: (commentId: string) => api.remove(commentId),
      onMutate: async (commentId: string) => {
        await queryClient.cancelQueries({ queryKey });
        const previousComments = queryClient.getQueryData<CommentsCache>(queryKey);
        queryClient.setQueryData<CommentsCache>(queryKey, (old) =>
          removeCommentFromPages(old, commentId),
        );
        queryClient.setQueryData<number>(commentKeys.count(postId ?? ""), (old) =>
          Math.max(0, (old ?? 1) - 1),
        );
        return { previousComments };
      },
      onError: (_err, _commentId, context) => {
        if (context?.previousComments) {
          queryClient.setQueryData(queryKey, context.previousComments);
        }
        queryClient.setQueryData<number>(commentKeys.count(postId ?? ""), (old) => (old ?? 0) + 1);
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey });
        queryClient.invalidateQueries({ queryKey: commentKeys.count(postId ?? "") });
      },
    });
  },

  like: (postId?: string, parentId?: string | null) =>
    mutationOptions({
      mutationFn: (commentId: string) => api.like(commentId),
      onSuccess: () => {
        const queryKey = parentId
          ? commentKeys.replies(postId ?? "", parentId)
          : commentKeys.list(postId ?? "");
        queryClient.invalidateQueries({ queryKey });
      },
    }),

  unlike: (postId?: string, parentId?: string | null) =>
    mutationOptions({
      mutationFn: (commentId: string) => api.unlike(commentId),
      onSuccess: () => {
        const queryKey = parentId
          ? commentKeys.replies(postId ?? "", parentId)
          : commentKeys.list(postId ?? "");
        queryClient.invalidateQueries({ queryKey });
      },
    }),
});
