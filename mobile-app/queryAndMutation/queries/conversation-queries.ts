import { createConversationQueryHooks } from "@universe/shared/queries";
import { httpClient } from "../../lib/http";

export const {
  useGetUserConversationsInfinite,
  useGetUserByConvoId,
  useGetConvoMessagesInfinite,
} = createConversationQueryHooks(httpClient);
