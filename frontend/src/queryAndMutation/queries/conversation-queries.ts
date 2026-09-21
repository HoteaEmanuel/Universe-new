import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { createConversationsApi } from "@universe/shared/api";
import { createConversationQueries } from "@universe/shared/queries";
import type { ResourceType } from "../../features/chat/types";
import { httpClient } from "@/lib/api";

const conversationsApi = createConversationsApi(httpClient);
const conversationQueries = createConversationQueries(conversationsApi);

export const useGetUserByConvoId = (id?: string) => useQuery(conversationQueries.userByConvoId(id));

export const useGetUserConversationsInfinite = (search: string) =>
  useInfiniteQuery(conversationQueries.userConversations(search));

export const useGetArchivedConversationsInfinite = (search: string, enabled = true) =>
  useInfiniteQuery(conversationQueries.archivedConversations(search, enabled));

export const useGetConvoMessagesInfinite = (id?: string) => useInfiniteQuery(conversationQueries.messages(id));

export const useGetConvoResourcesInfinite = <T,>(type: ResourceType, id?: string) =>
  useInfiniteQuery(conversationQueries.resources<T>(type, id));

export const useGetConversationByUsersIdsQuery = (id?: string) =>
  useQuery(conversationQueries.byUsersIds(id));

export const useGetConvoUsers = () => useQuery(conversationQueries.convoUsers());
