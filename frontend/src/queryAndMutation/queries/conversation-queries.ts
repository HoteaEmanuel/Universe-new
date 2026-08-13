import { useQuery } from "@tanstack/react-query";
import { useConversationStore } from "../../store/conversationStore";
import type {
  ChatMessage,
  ChatUser,
  DirectConversation,
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

export const useGetConvoMessages = (id?: string) => {
  const { getMessages } = useConversationStore();
  return useQuery<ChatMessage[]>({
    queryFn: () => getMessages(id as string),
    queryKey: ["conversation_messages", id],
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
