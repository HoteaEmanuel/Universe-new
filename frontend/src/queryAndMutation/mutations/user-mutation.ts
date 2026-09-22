import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createUsersApi } from "@universe/shared/api";
import { createUserMutations } from "@universe/shared/mutations";
import { toast } from "sonner";
import { httpClient } from "@/lib/api";

const usersApi = createUsersApi(httpClient);

export const useFollowMutation = (toFollowUserId?: string, userId?: string) => {
  const queryClient = useQueryClient();
  return useMutation(
    createUserMutations(usersApi, queryClient).follow(toFollowUserId, userId),
  );
};

export const useUnfollowMutation = (
  unfollowedUserId?: string,
  userId?: string,
) => {
  const queryClient = useQueryClient();
  return useMutation(
    createUserMutations(usersApi, queryClient).unfollow(
      unfollowedUserId,
      userId,
    ),
  );
};

export const useToggleSavePostMutation = (postId: string, userId?: string) => {
  const queryClient = useQueryClient();
  const shared = createUserMutations(usersApi, queryClient).toggleSavePost(
    postId,
    userId,
  );
  return useMutation({
    ...shared,
    onSuccess: (data, ...rest) => {
      shared.onSuccess?.(data, ...rest);
      if (data.data.saved) toast.success("Post saved successfully");
    },
  });
};

export const useUpdateUsernameMutation = () => {
  const queryClient = useQueryClient();
  return useMutation(
    createUserMutations(usersApi, queryClient).updateUsername(),
  );
};

export const useUpdateProfilePicture = () => {
  const queryClient = useQueryClient();
  const shared = createUserMutations(
    usersApi,
    queryClient,
  ).updateProfilePicture<File>();
  return useMutation({
    ...shared,
    onSuccess: (...args) => {
      shared.onSuccess?.(...args);
      toast.success("Profile image updated");
    },
  });
};

export const useCompleteOnboardingMutation = () => {
  const queryClient = useQueryClient();
  return useMutation(
    createUserMutations(usersApi, queryClient).completeOnboarding(),
  );
};

export const useMarkAppTourSeenMutation = () => {
  const queryClient = useQueryClient();
  return useMutation(
    createUserMutations(usersApi, queryClient).markAppTourSeen(),
  );
};

export const useUpdateBioMutation = () => {
  const queryClient = useQueryClient();
  const shared = createUserMutations(usersApi, queryClient).updateBio();
  return useMutation({
    ...shared,
    onSuccess: (...args) => {
      shared.onSuccess?.(...args);
      toast.success("Bio updated successfully");
    },
  });
};
