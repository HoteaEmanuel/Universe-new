import type { HttpClient } from "./client.js";
import type { FollowListPage, FollowUser, MentionUser, UniversityPeoplePage, User } from "../user.js";

export const createUsersApi = (client: HttpClient) => ({
  list: () => client.get<User[]>("/users"),

  getById: async (id: string) => (await client.get<{ user: User }>(`/users/${id}`)).user,

  getByUsername: async (username: string) =>
    (await client.get<{ user: User }>(`/u/${encodeURIComponent(username)}`)).user,

  checkUsernameAvailability: (username: string) =>
    client.get<{ username: string; available: boolean; reason?: string }>(
      "/username-availability",
      { username },
    ),

  updateUsername: async (username: string) =>
    (await client.patch<{ user: { id: string; username: string } }>("/username", { username }))
      .user,

  getFollowers: async (id: string) =>
    (await client.get<{ followers: FollowUser[] }>(`/followers/${id}`)).followers,

  getFollowing: async (id: string) =>
    (await client.get<{ following: FollowUser[] }>(`/following/${id}`)).following,

  // Backend returns `{ followers }`/`{ following }` respectively — remapped
  // to the shared `users` field so both share one `FollowListPage` shape.
  getRelevantFollowers: async (id: string, cursor?: string, search?: string) => {
    const { followers, nextCursor, hasMore } = await client.get<{
      followers: FollowUser[];
      nextCursor: string | null;
      hasMore: boolean;
    }>(`/followers-relevant/${id}`, { cursor, search });
    return { users: followers, nextCursor, hasMore } satisfies FollowListPage;
  },

  getRelevantFollowing: async (id: string, cursor?: string, search?: string) => {
    const { following, nextCursor, hasMore } = await client.get<{
      following: FollowUser[];
      nextCursor: string | null;
      hasMore: boolean;
    }>(`/following-relevant/${id}`, { cursor, search });
    return { users: following, nextCursor, hasMore } satisfies FollowListPage;
  },

  getUniversityPeople: (cursor?: string) =>
    client.get<UniversityPeoplePage>("/university-people", cursor ? { cursor } : undefined),

  isFollowing: async (id: string) =>
    (await client.get<{ isFollowing: boolean }>(`/follows-user/${id}`)).isFollowing,

  getMentionSearchUsers: async (query: string) =>
    (await client.get<{ users: MentionUser[] }>("/users/mention-search", { q: query })).users,

  follow: (id: string) => client.post<{ message: string }>("/follow", { followerId: id }),

  unfollow: (id: string) => client.post<{ message: string }>("/unfollow", { unfollowId: id }),

  toggleSavePost: (postId: string) =>
    client.post<{ message: string; data: { saved: boolean } }>(`/posts/toggle-save/${postId}`),

  updateBio: (bio: string) => client.patch<{ message: string }>("/update-bio", { bio }),

  completeOnboarding: () => client.post<{ message: string }>("/complete-onboarding"),

  markAppTourSeen: () => client.post<{ message: string }>("/mark-app-tour-seen"),

  updateProfilePicture: <TFile>(image: TFile) => {
    const form = client.createForm();
    form.append("image", image);
    return client.putForm<{ message: string }>("/update-profile-image", form);
  },
});
