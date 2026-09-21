import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useCommentsStore } from "../../store/commentStore";
export const useSendCommentMutation = (postId) => {
  const queryClient = useQueryClient();
  const { sendComment } = useCommentsStore();
  return useMutation({
    mutationFn: ({ postId, comment }) => {
      console.log(postId, comment);
      return sendComment(postId, comment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["posts", postId] });
      queryClient.invalidateQueries({ queryKey: ["comments-count", postId] });
    },
  });
};
export const useDeleteCommentMutation = (postId) => {
  const queryClient = useQueryClient();
  const { deleteComment } = useCommentsStore();
  return useMutation({
    mutationFn: (id) => deleteComment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["posts", postId] });
      queryClient.invalidateQueries({ queryKey: ["comments-count", postId] });
    },
  });
};

export const useLikeCommentMutation = () => {
  const queryClient = useQueryClient();
  const { likeComment } = useCommentsStore();
  return useMutation({
    mutationFn: (id) => likeComment(id),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comments", variables] });
      queryClient.invalidateQueries({ queryKey: ["post", variables] });
    },
  });
};
export const useRemoveLikeCommentMutation = () => {
  const queryClient = useQueryClient();
  const { removeLikeComment } = useCommentsStore();
  return useMutation({
    mutationFn: (id) => removeLikeComment(id),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comments", variables] });
      queryClient.invalidateQueries({ queryKey: ["post", variables] });
    },
  });
};
