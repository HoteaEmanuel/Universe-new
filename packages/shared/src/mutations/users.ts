import { mutationOptions, type QueryClient } from "@tanstack/react-query";
import type { createUsersApi } from "../api/users.js";
import { postKeys } from "../queries/keys.js";
import { userKeys } from "../queries/keys.js";

type UsersApi = ReturnType<typeof createUsersApi>;

// Toasts and other UI feedback are composed at the call site (app-local);
// these factories own only mutationFn + cache invalidation.
export const createUserMutations = (api: UsersApi, queryClient: QueryClient) => ({
  follow: (toFollowUserId?: string, userId?: string) =>
    mutationOptions({
      mutationFn: () => (toFollowUserId ? api.follow(toFollowUserId) : Promise.resolve(undefined)),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: userKeys.following(userId ?? "") });
        queryClient.invalidateQueries({ queryKey: userKeys.followers(toFollowUserId ?? "") });
        queryClient.invalidateQueries({ queryKey: userKeys.isFollowing(toFollowUserId ?? "") });
        // Notifications domain not migrated yet — raw key matches
        // notifications-queries.ts's own ["notifications", userId].
        queryClient.invalidateQueries({ queryKey: ["notifications", toFollowUserId] });
      },
    }),

  unfollow: (unfollowedUserId?: string, userId?: string) =>
    mutationOptions({
      mutationFn: () =>
        unfollowedUserId ? api.unfollow(unfollowedUserId) : Promise.resolve(undefined),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: userKeys.following(userId ?? "") });
        queryClient.invalidateQueries({ queryKey: userKeys.followers(unfollowedUserId ?? "") });
        queryClient.invalidateQueries({ queryKey: userKeys.isFollowing(unfollowedUserId ?? "") });
      },
    }),

  // The original invalidated ["saved_posts", userId] — a key no query in
  // this codebase produces (the real saved-posts list key is postKeys.saved,
  // ["savedPosts", id]) — so saving/unsaving a post never refreshed the
  // Saved Posts tab. Fixed to the real key.
  toggleSavePost: (postId: string, userId?: string) =>
    mutationOptions({
      mutationFn: () => api.toggleSavePost(postId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: postKeys.saved(userId ?? "") });
        queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) });
      },
    }),

  updateUsername: () =>
    mutationOptions({
      mutationFn: (username: string) => api.updateUsername(username),
    }),

  updateProfilePicture: <TFile>() =>
    mutationOptions({
      mutationFn: (image: TFile) => api.updateProfilePicture(image),
    }),

  updateBio: () =>
    mutationOptions({
      mutationFn: (bio: string) => api.updateBio(bio),
    }),

  completeOnboarding: () =>
    mutationOptions({
      mutationFn: () => api.completeOnboarding(),
    }),

  markAppTourSeen: () =>
    mutationOptions({
      mutationFn: () => api.markAppTourSeen(),
    }),
});
