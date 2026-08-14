import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useSearchStore, type SearchOverview } from "../../store/searchStore";
import type { ChatUser, GroupConversation } from "../../features/chat/types";
import type { Post, SearchPage } from "../types";

const nextOffset = <T>(pages: SearchPage<T>[]) =>
  pages.reduce((sum, page) => sum + page.items.length, 0);

export const useSearchOverviewQuery = (query: string, enabled: boolean) => {
  const { searchOverview } = useSearchStore();
  return useQuery<SearchOverview>({
    queryKey: ["search-overview", query],
    queryFn: () => searchOverview(query),
    enabled,
  });
};

export const useSearchUsersInfinite = (query: string, enabled: boolean) => {
  const { searchUsers } = useSearchStore();
  return useInfiniteQuery<SearchPage<ChatUser>>({
    queryKey: ["search-users", query],
    queryFn: ({ pageParam }) => searchUsers(query, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasMore ? nextOffset(allPages) : undefined,
    enabled,
  });
};

export const useSearchPostsInfinite = (query: string, enabled: boolean) => {
  const { searchPosts } = useSearchStore();
  return useInfiniteQuery<SearchPage<Post>>({
    queryKey: ["search-posts", query],
    queryFn: ({ pageParam }) => searchPosts(query, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasMore ? nextOffset(allPages) : undefined,
    enabled,
  });
};

export const useSearchGroupsInfinite = (query: string, enabled: boolean) => {
  const { searchGroups } = useSearchStore();
  return useInfiniteQuery<SearchPage<GroupConversation>>({
    queryKey: ["search-groups", query],
    queryFn: ({ pageParam }) => searchGroups(query, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasMore ? nextOffset(allPages) : undefined,
    enabled,
  });
};
