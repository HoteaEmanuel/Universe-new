import { createGroupQueryHooks } from "@universe/shared/queries";
import { httpClient } from "../../lib/http";

export const {
  useGetUserGroupsInfinite,
  useGetGroupById,
  useGetGroupMessagesInfinite,
  useSearchGroupMessages,
  useGetGroupMessageContext,
  useGetGroupResourcesInfinite,
  useGetGroupMembersInfiniteQuery,
  useGetGroupMemberById,
} = createGroupQueryHooks(httpClient);
