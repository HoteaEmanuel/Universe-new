import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { createSearchApi } from "@universe/shared/api";
import { createSearchQueries } from "@universe/shared/queries";
import { httpClient } from "@/lib/api";

const searchApi = createSearchApi(httpClient);
const searchQueries = createSearchQueries(searchApi);

export const useSearchOverviewQuery = (query: string, enabled: boolean) =>
  useQuery(searchQueries.overview(query, enabled));

export const useSearchUsersInfinite = (query: string, enabled: boolean) =>
  useInfiniteQuery(searchQueries.users(query, enabled));

export const useSearchPostsInfinite = (query: string, enabled: boolean) =>
  useInfiniteQuery(searchQueries.posts(query, enabled));

export const useSearchGroupsInfinite = (query: string, enabled: boolean) =>
  useInfiniteQuery(searchQueries.groups(query, enabled));
