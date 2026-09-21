import { infiniteQueryOptions, keepPreviousData, queryOptions } from "@tanstack/react-query";
import type { createConversationsApi } from "../api/conversations.js";
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
