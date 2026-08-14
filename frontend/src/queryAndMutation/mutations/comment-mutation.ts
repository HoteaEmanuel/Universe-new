import { useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { useCommentsStore } from "../../store/commentStore";
import { useAuthStore } from "../../store/authStore";
import type { PostComment, PostCommentsPage } from "../types";
import {
  prependOptimisticComment,
  removeCommentFromPages,
} from "../../utils/commentPageCache";

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
        userId: user?.id,
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

export const useDeleteCommentMutation = (postId?: string) => {
  const queryClient = useQueryClient();
  const { deleteComment } = useCommentsStore();

  return useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId),
    onMutate: async (commentId: string) => {
      await queryClient.cancelQueries({ queryKey: ["comments", postId] });
      const previousComments = queryClient.getQueryData<CommentsCache>([
        "comments",
        postId,
      ]);

      queryClient.setQueryData<CommentsCache>(["comments", postId], (old) =>
        removeCommentFromPages(old, commentId),
      );
      queryClient.setQueryData<number>(["comments-count", postId], (old) =>
        Math.max(0, (old ?? 1) - 1),
      );

      return { previousComments };
    },
    onError: (_err, _commentId, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(["comments", postId], context.previousComments);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["comments-count", postId] });
    },
  });
};

export const useLikeCommentMutation = (postId?: string) => {
  const queryClient = useQueryClient();
  const { likeComment } = useCommentsStore();
  return useMutation({
    mutationFn: (commentId: string) => likeComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
    },
  });
};

export const useRemoveLikeCommentMutation = (postId?: string) => {
  const queryClient = useQueryClient();
  const { removeLikeComment } = useCommentsStore();
  return useMutation({
    mutationFn: (commentId: string) => removeLikeComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
    },
  });
};
