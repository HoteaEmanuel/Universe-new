import { createConversationQueryHooks } from "@universe/shared/queries";
import { httpClient } from "@/lib/api";

export const {
  useGetUserByConvoId,
  useGetUserConversationsInfinite,
  useGetArchivedConversationsInfinite,
  useGetConvoMessagesInfinite,
  useGetConvoResourcesInfinite,
  useGetConversationByUsersIdsQuery,
  useGetConvoUsers,
} = createConversationQueryHooks(httpClient);
