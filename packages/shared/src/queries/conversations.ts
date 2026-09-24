import {
  infiniteQueryOptions,
  keepPreviousData,
  queryOptions,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";
import { createConversationsApi } from "../api/conversations.js";
import type { HttpClient } from "../api/client.js";
import { conversationKeys } from "./keys.js";
import { cursorPagination } from "./pageHelpers.js";

type ConversationsApi = ReturnType<typeof createConversationsApi>;
type ResourceType = "images" | "files";

export const createConversationQueries = (api: ConversationsApi) => ({
  userByConvoId: (id?: string) =>
    queryOptions({
      queryKey: conversationKeys.userByConvo(id ?? ""),
      queryFn: () => api.getUserByConvoId(id as string),
      enabled: !!id,
    }),

  userConversations: (search: string) =>
    infiniteQueryOptions({
      queryKey: conversationKeys.userConversations(search),
      queryFn: ({ pageParam }) => api.listForUser({ cursor: pageParam, search }),
      ...cursorPagination(),
      // Keeps the previous search's results on screen while the debounced
      // search term settles into a new query key, instead of flashing to
      // "no results" for the instant between the key changing and the new
      // page resolving.
      placeholderData: keepPreviousData,
    }),

  archivedConversations: (search: string, enabled = true) =>
    infiniteQueryOptions({
      queryKey: conversationKeys.archived(search),
      queryFn: ({ pageParam }) => api.listArchived({ cursor: pageParam, search }),
      ...cursorPagination(),
      enabled,
      placeholderData: keepPreviousData,
    }),

  messages: (id?: string) =>
    infiniteQueryOptions({
      queryKey: conversationKeys.messages(id ?? ""),
      queryFn: ({ pageParam }) => api.listMessages(id as string, pageParam),
      ...cursorPagination(),
      enabled: !!id,
    }),

  // Single page, not infinite - result lists stay small enough (up to the
  // 50-item schema cap) that paginating a search-as-you-type box would be
  // over-engineering; see current-feature.md's message-search notes.
  messageSearch: (id: string | undefined, query: string) =>
    queryOptions({
      queryKey: conversationKeys.messageSearch(id ?? "", query),
      queryFn: () => api.searchMessages(id as string, query),
      enabled: !!id && query.trim().length >= 2,
    }),

  messageContext: (id: string | undefined, messageId: string | undefined) =>
    queryOptions({
      queryKey: conversationKeys.messageContext(id ?? "", messageId ?? ""),
      queryFn: () => api.getMessageContext(id as string, messageId as string),
      enabled: !!id && !!messageId,
    }),

  resources: <T>(type: ResourceType, id?: string) =>
    infiniteQueryOptions({
      queryKey: conversationKeys.resources(type, id ?? ""),
      queryFn: ({ pageParam }) => api.listResources<T>(id as string, type, pageParam),
      ...cursorPagination(),
      enabled: !!id,
    }),

  byUsersIds: (id?: string) =>
    queryOptions({
      queryKey: conversationKeys.byUsersIds(id ?? ""),
      queryFn: () => api.getByUsersIds(id as string),
      enabled: !!id,
    }),

  convoUsers: () =>
    queryOptions({
      queryKey: conversationKeys.convoUsers(),
      queryFn: () => api.listConvoUsers(),
    }),
});

// Ready-to-use hooks for every read-only, side-effect-free conversation
// query — see the identical note on createUserQueryHooks in ./users.ts for
// why this exists instead of each app redeclaring the same useQuery
// wrapper.
export const createConversationQueryHooks = (httpClient: HttpClient) => {
  const api = createConversationsApi(httpClient);
  const queries = createConversationQueries(api);
  return {
    useGetUserByConvoId: (id?: string) => useQuery(queries.userByConvoId(id)),
    useGetUserConversationsInfinite: (search: string) =>
      useInfiniteQuery(queries.userConversations(search)),
    useGetArchivedConversationsInfinite: (search: string, enabled = true) =>
      useInfiniteQuery(queries.archivedConversations(search, enabled)),
    useGetConvoMessagesInfinite: (id?: string) => useInfiniteQuery(queries.messages(id)),
    useSearchConvoMessages: (id: string | undefined, query: string) =>
      useQuery(queries.messageSearch(id, query)),
    useGetConvoMessageContext: (id: string | undefined, messageId: string | undefined) =>
      useQuery(queries.messageContext(id, messageId)),
    useGetConvoResourcesInfinite: <T,>(type: ResourceType, id?: string) =>
      useInfiniteQuery(queries.resources<T>(type, id)),
    useGetConversationByUsersIdsQuery: (id?: string) => useQuery(queries.byUsersIds(id)),
    useGetConvoUsers: () => useQuery(queries.convoUsers()),
  };
};
