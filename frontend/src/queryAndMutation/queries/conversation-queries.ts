import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useConversationStore } from "../../store/conversationStore";
import type {
  ChatMessagePage,
  ChatResourcePage,
  ChatUser,
  DirectConversation,
  DirectConversationsPage,
  ResourceType,
} from "../../features/chat/types";

export const useGetUserByConvoId = (id?: string) => {
  const { getUserByConvoId } = useConversationStore();
  return useQuery<ChatUser>({
    queryFn: () => getUserByConvoId(id as string),
    queryKey: ["conversations_users", id],
    enabled: !!id,
  });
};

export const useGetUserConversationsInfinite = (search: string) => {
  const { getUserConversations } = useConversationStore();
  return useInfiniteQuery<DirectConversationsPage>({
    queryKey: ["user-conversations", search],
    queryFn: ({ pageParam }) =>
      getUserConversations({ cursor: pageParam as string | undefined, search }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
    // Keeps the previous search's results on screen while the debounced
    // search term settles into a new query key, instead of flashing to
    // "no results" for the instant between the key changing and the new
    // page resolving.
    placeholderData: keepPreviousData,
  });
};

export const useGetArchivedConversationsInfinite = (search: string, enabled = true) => {
  const { getArchivedConversations } = useConversationStore();
  return useInfiniteQuery<DirectConversationsPage>({
    queryKey: ["archived-conversations", search],
    queryFn: ({ pageParam }) =>
      getArchivedConversations({ cursor: pageParam as string | undefined, search }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
    enabled,
    placeholderData: keepPreviousData,
  });
};

export const useGetConvoMessagesInfinite = (id?: string) => {
  const { getMessages } = useConversationStore();
  return useInfiniteQuery<ChatMessagePage>({
    queryKey: ["conversation_messages", id],
    queryFn: ({ pageParam }) => getMessages(id as string, pageParam as string | undefined),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
    enabled: !!id,
  });
};

export const useGetConvoResourcesInfinite = <T,>(type: ResourceType, id?: string) => {
  const { getConvoResources } = useConversationStore();
  return useInfiniteQuery<ChatResourcePage<T>>({
    queryKey: ["conversation-resources", type, id],
    queryFn: ({ pageParam }) =>
      getConvoResources(id as string, type, pageParam as string | undefined) as Promise<
        ChatResourcePage<T>
      >,
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
    enabled: !!id,
  });
};

export const useGetConversationByUsersIdsQuery = (id?: string) => {
  const { getConversationByUsersIds } = useConversationStore();
  return useQuery<DirectConversation | null>({
    queryFn: () => getConversationByUsersIds(id as string),
    queryKey: ["conversations", id],
    enabled: !!id,
  });
};

export const useGetConvoUsers = () => {
  const { getConvoUsers } = useConversationStore();
  return useQuery<ChatUser[]>({
    queryFn: () => getConvoUsers(),
    queryKey: ["convo-users"],
  });
};
