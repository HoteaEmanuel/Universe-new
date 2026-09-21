import type { EventParticipantStatus } from "../domain.js";
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

export const commentKeys = {
  list: (postId: string) => ["comments", postId] as const,
  replies: (postId: string, parentId: string) => ["comment-replies", postId, parentId] as const,
  count: (postId: string) => ["comments-count", postId] as const,
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

export const eventKeys = {
  detail: (id: string) => ["event", id] as const,
  discover: () => ["events-discover"] as const,
  upcomingUniversity: (limit?: number) => ["events-upcoming-university", limit] as const,
  mineAll: () => ["events-mine"] as const,
  mine: (scope: string) => ["events-mine", scope] as const,
  participants: (id: string, status?: EventParticipantStatus, search?: string) =>
    ["event-participants", id, status, search] as const,
  bans: (id: string) => ["event-bans", id] as const,
};

export const groupKeys = {
  detail: (id: string) => ["group", id] as const,
  userGroupsAll: () => ["user-groups"] as const,
  userGroups: (userId: string, search: string) => ["user-groups", userId, search] as const,
  discoverablePublicAll: () => ["discoverable-public-groups"] as const,
  discoverablePublic: (courseTag?: string, universityOnly?: boolean, limit?: number) =>
    ["discoverable-public-groups", courseTag, universityOnly, limit] as const,
  courseCatalog: (groupId?: string) => ["course-catalog", groupId] as const,
  messages: (id: string) => ["group-messages", id] as const,
  resources: (type: string, id: string) => ["group-resources", type, id] as const,
  members: (groupId: string) => ["group-members", groupId] as const,
  membersPage: (groupId: string, search?: string) => ["group-members-page", groupId, search] as const,
  activeMembers: (groupId: string) => ["active-group-members", groupId] as const,
  memberById: (groupId: string) => ["group-member", groupId] as const,
  usersFromSameUniversityNotInGroup: (groupId: string) =>
    ["usersFromSameUniversityNotInGroup", groupId] as const,
  checkUserIsAdmin: (groupId: string, userId: string) =>
    ["checkUserIsAdmin", groupId, userId] as const,
  bans: (groupId: string) => ["group-bans", groupId] as const,
  courseResourcesAll: (groupId: string) => ["course-resources", groupId] as const,
  courseResources: (groupId: string, category?: string, search?: string) =>
    ["course-resources", groupId, category, search] as const,
  mentionSearch: (groupId: string, query: string) => ["group-mention-search", groupId, query] as const,
};

export const conversationKeys = {
  userByConvo: (id: string) => ["conversations_users", id] as const,
  userConversationsAll: () => ["user-conversations"] as const,
  userConversations: (search: string) => ["user-conversations", search] as const,
  archivedAll: () => ["archived-conversations"] as const,
  archived: (search: string) => ["archived-conversations", search] as const,
  messages: (id: string) => ["conversation_messages", id] as const,
  resources: (type: string, id: string) => ["conversation-resources", type, id] as const,
  byUsersIds: (id: string) => ["conversations", id] as const,
  convoUsers: () => ["convo-users"] as const,
};
