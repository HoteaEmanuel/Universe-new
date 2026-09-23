import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createUsersApi } from "@universe/shared/api";
import { createUserMutations } from "@universe/shared/mutations";
import { httpClient } from "../../lib/http";

const usersApi = createUsersApi(httpClient);

export const useFollowMutation = (toFollowUserId?: string, userId?: string) => {
  const queryClient = useQueryClient();
  return useMutation(createUserMutations(usersApi, queryClient).follow(toFollowUserId, userId));
};

export const useUnfollowMutation = (unfollowedUserId?: string, userId?: string) => {
  const queryClient = useQueryClient();
  return useMutation(
    createUserMutations(usersApi, queryClient).unfollow(unfollowedUserId, userId),
  );
};

export const useToggleSavePostMutation = (postId: string, userId?: string) => {
  const queryClient = useQueryClient();
  return useMutation(createUserMutations(usersApi, queryClient).toggleSavePost(postId, userId));
};

export const useUpdateUsernameMutation = () => {
  const queryClient = useQueryClient();
  return useMutation(createUserMutations(usersApi, queryClient).updateUsername());
};

export type ProfilePictureFile = { uri: string; name: string; type: string };

export const useUpdateProfilePictureMutation = () => {
  const queryClient = useQueryClient();
  return useMutation(
    createUserMutations(usersApi, queryClient).updateProfilePicture<ProfilePictureFile>(),
  );
};

export const useUpdateBioMutation = () => {
  const queryClient = useQueryClient();
  return useMutation(createUserMutations(usersApi, queryClient).updateBio());
};
