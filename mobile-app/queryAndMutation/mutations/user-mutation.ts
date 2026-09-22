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
