import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { createGroupsApi } from "@universe/shared/api";
import { createGroupQueries } from "@universe/shared/queries";
import type { ResourceCategory, ResourceType } from "../../features/chat/types";
import { httpClient } from "@/lib/api";

const groupsApi = createGroupsApi(httpClient);
const groupQueries = createGroupQueries(groupsApi);

export const useGetUserGroupsInfinite = (userId: string | undefined, search: string) =>
  useInfiniteQuery(groupQueries.userGroups(userId, search));

export const useGetDiscoverablePublicGroups = (
  enabled = true,
  courseTag?: string,
  universityOnly?: boolean,
  limit?: number,
) => useQuery(groupQueries.discoverablePublic(enabled, courseTag, universityOnly, limit));

export const useGetCourseCatalog = (enabled = true, groupId?: string) =>
  useQuery(groupQueries.courseCatalog(enabled, groupId));

export const useGetGroupById = (id?: string) => useQuery(groupQueries.detail(id));

export const useGetGroupMessagesInfinite = (id?: string) => useInfiniteQuery(groupQueries.messages(id));

export const useGetGroupResourcesInfinite = <T,>(type: ResourceType, id?: string) =>
  useInfiniteQuery(groupQueries.resources<T>(type, id));

export const useGetGroupMembers = (groupId?: string) => useQuery(groupQueries.members(groupId));

export const useGetGroupMembersInfiniteQuery = (groupId?: string, enabled = true, search?: string) =>
  useInfiniteQuery(groupQueries.membersPage(groupId, enabled, search));

export const useGetActiveGroupMembers = (groupId?: string) =>
  useQuery(groupQueries.activeMembers(groupId));

export const useGetGroupMemberById = (groupId?: string) => useQuery(groupQueries.memberById(groupId));

export const useGetUsersFromSameUniversityNotInGroupQuery = (groupId?: string) =>
  useQuery(groupQueries.usersFromSameUniversityNotInGroup(groupId));

export const useCheckUserIsAdminQuery = (groupId?: string, userId?: string) =>
  useQuery(groupQueries.checkUserIsAdmin(groupId, userId));

export const useGetGroupBansInfinite = (groupId?: string, enabled = true) =>
  useInfiniteQuery(groupQueries.bans(groupId, enabled));

export const useGetCourseResourcesInfiniteQuery = (
  groupId?: string,
  enabled = true,
  category?: ResourceCategory,
  search?: string,
) => useInfiniteQuery(groupQueries.courseResources(groupId, enabled, category, search));

export const useGroupMentionSearchUsersQuery = (
  groupId: string | undefined,
  query: string,
  enabled: boolean,
) => useQuery(groupQueries.mentionSearchUsers(groupId, query, enabled));
