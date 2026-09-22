import { useUserStore } from "../../store/userStore";
import { useQueryClient } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
export const useFollowMutation = (toFollowUserId, userId) => {
  const { followUser } = useUserStore();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => followUser(toFollowUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["following", userId] });
      queryClient.invalidateQueries({
        queryKey: ["followers", toFollowUserId],
      });
      queryClient.invalidateQueries({
        queryKey: ["isFollowing", toFollowUserId],
      });
      queryClient.invalidateQueries({
        queryKey: ["followersNo", toFollowUserId],
      });
    },
  });
};
export const useUnfollowMutation = (unfollowedUserId, userId) => {
  const { unfollowUser } = useUserStore();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => unfollowUser(unfollowedUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["following", userId] });
      queryClient.invalidateQueries({
        queryKey: ["followers", unfollowedUserId],
      });
      queryClient.invalidateQueries({
        queryKey: ["isFollowing", unfollowedUserId],
      });
      queryClient.invalidateQueries({
        queryKey: ["followersNo", unfollowedUserId],
      });
    },
  });
};
