import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPostsApi } from "@universe/shared/api";
import { createPostMutations } from "@universe/shared/mutations";
import { toast } from "sonner";
import type { CreatePostPayload, UpdatePostPayload } from "../types";
import { httpClient } from "@/lib/api";

export type { CreatePostPayload, UpdatePostPayload };

const postsApi = createPostsApi(httpClient);

export const useCreatePostMutation = () => {
  const queryClient = useQueryClient();
  const shared = createPostMutations(postsApi, queryClient).create<File>();
  return useMutation({
    ...shared,
    onSuccess: (data, post, onMutateResult, context) => {
      shared.onSuccess?.(data, post, onMutateResult, context);
      toast.success("Post created");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
};

export const useLikeMutation = (postId: string) => {
  const queryClient = useQueryClient();
  return useMutation(createPostMutations(postsApi, queryClient).like(postId));
};

export const useUnlikeMutation = (postId: string) => {
  const queryClient = useQueryClient();
  return useMutation(createPostMutations(postsApi, queryClient).unlike(postId));
};

export const useUpdatePostMutation = (userId?: string) => {
  const queryClient = useQueryClient();
  return useMutation(createPostMutations(postsApi, queryClient).update<File>(userId));
};

export const useSharePostMutation = (postId: string) => {
  const queryClient = useQueryClient();
  const shared = createPostMutations(postsApi, queryClient).share(postId);
  return useMutation({
    ...shared,
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
  return useMutation(createPostMutations(postsApi, queryClient).remove(postId, userId));
};

export const useSetOpportunityClosedMutation = (postId: string) => {
  const queryClient = useQueryClient();
  const shared = createPostMutations(postsApi, queryClient).setOpportunityClosed(postId);
  return useMutation({
    ...shared,
    onSuccess: (data, closed, onMutateResult, context) => {
      shared.onSuccess?.(data, closed, onMutateResult, context);
      toast.success(closed ? "Applications closed" : "Opportunity reopened");
    },
    onError: (error: Error) => toast.error(error.message),
  });
};
