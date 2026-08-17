import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePostStore } from "../../store/postStore";
import { toast } from "sonner";
import type { CreatePostPayload, UpdatePostPayload } from "../types";

export type { CreatePostPayload, UpdatePostPayload };

export const useCreatePostMutation = () => {
  const queryClient = useQueryClient();
  const { createPost } = usePostStore();
  return useMutation({
    mutationFn: (post: CreatePostPayload) => createPost(post),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success("Post created");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
};

export const useLikeMutation = (postId: string) => {
  const queryClient = useQueryClient();
  const { likePost } = usePostStore();
  return useMutation({
    mutationFn: () => likePost({ postId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts", postId] });
      queryClient.invalidateQueries({ queryKey: ["likes", postId] });
    },
  });
};

export const useUnlikeMutation = (postId: string) => {
  const queryClient = useQueryClient();
  const { unlikePost } = usePostStore();
  return useMutation({
    mutationFn: () => unlikePost({ postId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts", postId] });
      queryClient.invalidateQueries({ queryKey: ["likes", postId] });
    },
  });
};

export const useUpdatePostMutation = (userId?: string) => {
  const queryClient = useQueryClient();
  const { updatePost } = usePostStore();
  return useMutation({
    mutationFn: async (data: UpdatePostPayload) => await updatePost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["userPosts", userId] });
    },
  });
};

export const useSharePostMutation = (postId: string) => {
  const { sharePost } = usePostStore();
  return useMutation({
    mutationFn: (recipientIds: string[]) => sharePost(postId, recipientIds),
    onSuccess: () => {
      toast.success("Post sent");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
};

export const useDeletePostMutation = (postId: string, userId?: string) => {
  const queryClient = useQueryClient();
  const { deletePost } = usePostStore();
  return useMutation({
    mutationFn: async () => await deletePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["userPosts", userId] });
    },
  });
};
