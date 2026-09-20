import type { OpportunityFilters } from "../post.js";

// One key namespace per domain instead of ad-hoc string arrays scattered
// across hook files. Two real collisions this fixes on the frontend today:
// `useCheckPostIsSaved` and `useGetSavedPostsQuery` both used
// ["saved_posts", id] for different payload shapes (a boolean vs a post
// list); `useGetLiveMessages` shared ["conversation_messages", id] with
// `useGetConvoMessages` while its queryFn returned undefined from inside a
// socket callback. Both are separate keys below.
export const postKeys = {
  all: ["posts"] as const,
  feed: (feedSelector: string) => ["posts", feedSelector] as const,
  detail: (id: string) => ["post", id] as const,
  public: (id: string) => ["publicPost", id] as const,
  author: (id: string) => ["postAuthor", id] as const,
  byUser: (id: string) => ["userPosts", id] as const,
  saved: (id: string) => ["savedPosts", id] as const,
  savedStatus: (id: string) => ["postSavedStatus", id] as const,
  related: (tag: string) => ["relatedPosts", tag] as const,
  byName: (name: string) => ["postsByName", name] as const,
  likesCount: (postId: string) => ["postLikes", postId] as const,
  relevantLiker: (postId: string) => ["postRelevantLiker", postId] as const,
  liked: (postId: string) => ["postLiked", postId] as const,
  whoLiked: (postId: string) => ["postWhoLiked", postId] as const,
  shareRecipients: () => ["shareRecipients"] as const,
  opportunities: (filters: OpportunityFilters) => ["opportunities", filters] as const,
};

export const userKeys = {
  all: () => ["allUsers"] as const,
  detail: (id: string) => ["user", id] as const,
  byUsername: (username: string) => ["userByUsername", username] as const,
  followers: (id: string) => ["followers", id] as const,
  following: (id: string) => ["following", id] as const,
  relevantFollowers: (id: string, search?: string) => ["followers-relevant", id, search] as const,
  relevantFollowing: (id: string, search?: string) => ["following-relevant", id, search] as const,
  universityPeople: () => ["university-people"] as const,
  isFollowing: (id: string) => ["isFollowing", id] as const,
  mentionSearch: (query: string) => ["mention-search", query] as const,
};
