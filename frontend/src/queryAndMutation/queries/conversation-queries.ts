import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useConversationStore } from "../../store/conversationStore";
import type {
  ChatMessagePage,
  ChatResourcePage,
  ChatUser,
  DirectConversation,
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

export const useGetUserConversations = () => {
  const { getUserConversations } = useConversationStore();
  return useQuery<DirectConversation[]>({
    queryFn: () => getUserConversations(),
    queryKey: ["user-conversations"],
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
