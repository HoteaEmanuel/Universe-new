import { searchGroups, searchPosts, searchUsers } from "../repository/search.repository.js";

const ALL_TAB_PREVIEW_LIMIT = 5;

export const getSearchedUsers = async (query: string, limit?: number, offset?: number) => {
  return searchUsers(query, limit, offset);
};

export const getSearchedPosts = async (query: string, limit?: number, offset?: number) => {
  return searchPosts(query, limit, offset);
};

export const getSearchedGroups = async (
  query: string,
  userId: string,
  limit?: number,
  offset?: number,
) => {
  return searchGroups(query, userId, limit, offset);
};

export const getSearchOverview = async (query: string, userId: string) => {
  const [users, posts, groups] = await Promise.all([
    searchUsers(query, ALL_TAB_PREVIEW_LIMIT),
    searchPosts(query, ALL_TAB_PREVIEW_LIMIT),
    searchGroups(query, userId, ALL_TAB_PREVIEW_LIMIT),
  ]);
  return { users, posts, groups };
};
