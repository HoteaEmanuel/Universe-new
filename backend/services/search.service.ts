import { searchGroups, searchPosts, searchUsers } from "../repository/search.repository.js";

const ALL_TAB_PREVIEW_LIMIT = 5;

export const getSearchedUsers = async (
  query: string,
  limit?: number,
  offset?: number,
  blockedIds: string[] = [],
) => {
  return searchUsers(query, limit, offset, blockedIds);
};

export const getSearchedPosts = async (
  query: string,
  limit?: number,
  offset?: number,
  blockedIds: string[] = [],
) => {
  return searchPosts(query, limit, offset, blockedIds);
};

export const getSearchedGroups = async (
  query: string,
  userId: string,
  limit?: number,
  offset?: number,
) => {
  return searchGroups(query, userId, limit, offset);
};

export const getSearchOverview = async (
  query: string,
  userId: string,
  blockedIds: string[] = [],
) => {
  const [users, posts, groups] = await Promise.all([
    searchUsers(query, ALL_TAB_PREVIEW_LIMIT, undefined, blockedIds),
    searchPosts(query, ALL_TAB_PREVIEW_LIMIT, undefined, blockedIds),
    searchGroups(query, userId, ALL_TAB_PREVIEW_LIMIT),
  ]);
  return { users, posts, groups };
};
