import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCommentsApi } from "@universe/shared/api";
import { createCommentMutations } from "@universe/shared/mutations";
import { useAuthStore } from "@/store/authStore";
import { httpClient } from "@/lib/api";

const commentsApi = createCommentsApi(httpClient);

export const useSendCommentMutation = (postId?: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  return useMutation(
    createCommentMutations(commentsApi, queryClient).sendComment(postId, user?.id),
  );
};

export const useSendReplyMutation = (postId?: string, parentId?: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  return useMutation(
    createCommentMutations(commentsApi, queryClient).sendReply(postId, parentId, user?.id),
  );
};

export const useDeleteCommentMutation = (postId?: string, parentId?: string | null) => {
  const queryClient = useQueryClient();
  return useMutation(createCommentMutations(commentsApi, queryClient).remove(postId, parentId));
};

export const useLikeCommentMutation = (postId?: string, parentId?: string | null) => {
  const queryClient = useQueryClient();
  return useMutation(createCommentMutations(commentsApi, queryClient).like(postId, parentId));
};

export const useRemoveLikeCommentMutation = (postId?: string, parentId?: string | null) => {
  const queryClient = useQueryClient();
  return useMutation(createCommentMutations(commentsApi, queryClient).unlike(postId, parentId));
};
