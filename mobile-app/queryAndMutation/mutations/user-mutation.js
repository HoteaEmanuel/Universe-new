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

export const useSavePostMutation = (postId, userId) => {
  const { savePost } = useUserStore();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => savePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved_posts", userId] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      // toast.success("Post saved successfully");
    },
  });
};

export const useUnsavePostMutation = (postId, userId) => {
  const { unsavePost } = useUserStore();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => unsavePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved_posts", userId] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      // toast.success("Post saved successfully");
    },
  });
};

export const useUpdateProfilePicture = () => {
  const { updateProfilePicture } = useUserStore();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file) => updateProfilePicture(file),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth_user"] });
      toast.success("Profile image updated");
    },
  });
};

export const useUpdateBioMutation = () => {
  const { updateBio } = useUserStore();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bio) => updateBio(bio),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth_user"] });
      toast.success("Bio updated successfully");
    },
  });
};
