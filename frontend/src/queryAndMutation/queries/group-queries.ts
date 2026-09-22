import { createGroupQueryHooks } from "@universe/shared/queries";
import { httpClient } from "@/lib/api";

export const {
  useGetUserGroupsInfinite,
  useGetDiscoverablePublicGroups,
  useGetCourseCatalog,
  useGetGroupById,
  useGetGroupMessagesInfinite,
  useGetGroupResourcesInfinite,
  useGetGroupMembers,
  useGetGroupMembersInfiniteQuery,
  useGetActiveGroupMembers,
  useGetGroupMemberById,
  useGetUsersFromSameUniversityNotInGroupQuery,
  useCheckUserIsAdminQuery,
  useGetGroupBansInfinite,
  useGetCourseResourcesInfiniteQuery,
  useGroupMentionSearchUsersQuery,
} = createGroupQueryHooks(httpClient);
