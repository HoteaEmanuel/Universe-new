import { useUserStore } from "../../store/userStore";
import { useQueryClient } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
export const useFollowMutation = (toFollowUserId?: string, userId?: string) => {
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

      queryClient.invalidateQueries({
        queryKey:["notifications",toFollowUserId]
      })
    },
  });
};
export const useUnfollowMutation = (unfollowedUserId?: string, userId?: string) => {
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

export const useSavePostMutation = (postId: string, userId?: string) => {
  const { savePost } = useUserStore();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => savePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved_posts", userId] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      toast.success("Post saved successfully");
    },
  });
};

export const useUnsavePostMutation = (postId: string, userId?: string) => {
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
    mutationFn: (file: File) => updateProfilePicture(file),

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
    mutationFn: (bio: string) => updateBio(bio),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth_user"] });
      toast.success("Bio updated successfully");
    },
  });
};
