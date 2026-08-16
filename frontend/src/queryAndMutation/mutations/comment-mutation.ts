import { useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { useCommentsStore } from "@/store/commentStore";
import { useAuthStore } from "@/store/authStore";
import type { PostComment, PostCommentsPage } from "../types";
import {
  prependOptimisticComment,
  removeCommentFromPages,
} from "@/features/comments/utils/commentPageCache";

type CommentsCache = InfiniteData<PostCommentsPage>;

export const useSendCommentMutation = (postId?: string) => {
  const queryClient = useQueryClient();
  const { sendComment } = useCommentsStore();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: (comment: string) => sendComment(postId, comment),
    onMutate: async (comment: string) => {
      await queryClient.cancelQueries({ queryKey: ["comments", postId] });
      const previousComments = queryClient.getQueryData<CommentsCache>([
        "comments",
        postId,
      ]);

      const optimisticComment: PostComment = {
        id: `optimistic-${Date.now()}`,
        userId: user?.id ?? "",
        postId: postId ?? "",
        text: comment,
        createdAt: new Date().toISOString(),
        likesCount: 0,
        isLiked: false,
      };

      queryClient.setQueryData<CommentsCache>(["comments", postId], (old) =>
        prependOptimisticComment(old, optimisticComment),
      );
      queryClient.setQueryData<number>(
        ["comments-count", postId],
        (old) => (old ?? 0) + 1,
      );

      return { previousComments };
    },
    onError: (_err, _comment, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(["comments", postId], context.previousComments);
      }
      queryClient.setQueryData<number>(["comments-count", postId], (old) =>
        Math.max(0, (old ?? 1) - 1),
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["comments-count", postId] });
    },
  });
};

export const useSendReplyMutation = (postId?: string, parentId?: string) => {
  const queryClient = useQueryClient();
  const { sendComment } = useCommentsStore();
  const { user } = useAuthStore();
  const queryKey = ["comment-replies", postId, parentId];

  return useMutation({
    mutationFn: (comment: string) => sendComment(postId, comment, parentId),
    onMutate: async (comment: string) => {
      await queryClient.cancelQueries({ queryKey });
      const previousReplies = queryClient.getQueryData<CommentsCache>(queryKey);

      const optimisticReply: PostComment = {
        id: `optimistic-${Date.now()}`,
        userId: user?.id ?? "",
        postId: postId ?? "",
        text: comment,
        createdAt: new Date().toISOString(),
        likesCount: 0,
        isLiked: false,
        parentId,
      };

      queryClient.setQueryData<CommentsCache>(queryKey, (old) =>
        prependOptimisticComment(old, optimisticReply),
      );
      queryClient.setQueryData<number>(
        ["comments-count", postId],
        (old) => (old ?? 0) + 1,
      );

      return { previousReplies };
    },
    onError: (_err, _comment, context) => {
      if (context?.previousReplies) {
        queryClient.setQueryData(queryKey, context.previousReplies);
      }
      queryClient.setQueryData<number>(["comments-count", postId], (old) =>
        Math.max(0, (old ?? 1) - 1),
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["comments-count", postId] });
    },
  });
};

export const useDeleteCommentMutation = (postId?: string, parentId?: string | null) => {
  const queryClient = useQueryClient();
  const { deleteComment } = useCommentsStore();
  const queryKey = parentId ? ["comment-replies", postId, parentId] : ["comments", postId];

  return useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId),
    onMutate: async (commentId: string) => {
      await queryClient.cancelQueries({ queryKey });
      const previousComments = queryClient.getQueryData<CommentsCache>(queryKey);

      queryClient.setQueryData<CommentsCache>(queryKey, (old) =>
        removeCommentFromPages(old, commentId),
      );
      queryClient.setQueryData<number>(["comments-count", postId], (old) =>
        Math.max(0, (old ?? 1) - 1),
      );

      return { previousComments };
    },
    onError: (_err, _commentId, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(queryKey, context.previousComments);
      }
      queryClient.setQueryData<number>(["comments-count", postId], (old) => (old ?? 0) + 1);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["comments-count", postId] });
    },
  });
};

export const useLikeCommentMutation = (postId?: string, parentId?: string | null) => {
  const queryClient = useQueryClient();
  const { likeComment } = useCommentsStore();
  const queryKey = parentId ? ["comment-replies", postId, parentId] : ["comments", postId];
  return useMutation({
    mutationFn: (commentId: string) => likeComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
};

export const useRemoveLikeCommentMutation = (postId?: string, parentId?: string | null) => {
  const queryClient = useQueryClient();
  const { removeLikeComment } = useCommentsStore();
  const queryKey = parentId ? ["comment-replies", postId, parentId] : ["comments", postId];
  return useMutation({
    mutationFn: (commentId: string) => removeLikeComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
};
