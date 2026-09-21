import { infiniteQueryOptions, keepPreviousData, queryOptions } from "@tanstack/react-query";
import type { createGroupsApi } from "../api/groups.js";
import type { ResourceType } from "../chat.js";
import type { ResourceCategory } from "../domain.js";
import { groupKeys } from "./keys.js";
import { cursorPagination } from "./pageHelpers.js";

type GroupsApi = ReturnType<typeof createGroupsApi>;

export const createGroupQueries = (api: GroupsApi) => ({
  userGroups: (userId: string | undefined, search: string) =>
    infiniteQueryOptions({
      queryKey: groupKeys.userGroups(userId ?? "", search),
      queryFn: ({ pageParam }) => api.listForUser(userId as string, { cursor: pageParam, search }),
      ...cursorPagination(),
      enabled: !!userId,
      placeholderData: keepPreviousData,
    }),

  discoverablePublic: (enabled = true, courseTag?: string, universityOnly?: boolean, limit?: number) =>
    queryOptions({
      queryKey: groupKeys.discoverablePublic(courseTag, universityOnly, limit),
      queryFn: () => api.listDiscoverablePublic(courseTag, universityOnly, limit),
      enabled,
    }),

  courseCatalog: (enabled = true, groupId?: string) =>
    queryOptions({
      queryKey: groupKeys.courseCatalog(groupId),
      queryFn: () => api.getCourseCatalog(groupId),
      enabled,
    }),

  detail: (id?: string) =>
    queryOptions({
      queryKey: groupKeys.detail(id ?? ""),
      queryFn: () => api.get(id as string),
      enabled: !!id,
    }),

  messages: (id?: string) =>
    infiniteQueryOptions({
      queryKey: groupKeys.messages(id ?? ""),
      queryFn: ({ pageParam }) => api.listMessages(id as string, pageParam),
      ...cursorPagination(),
      enabled: !!id,
    }),

  resources: <T>(type: ResourceType, id?: string) =>
    infiniteQueryOptions({
      queryKey: groupKeys.resources(type, id ?? ""),
      queryFn: ({ pageParam }) => api.listResources<T>(id as string, type, pageParam),
      ...cursorPagination(),
      enabled: !!id,
    }),

  members: (groupId?: string) =>
    queryOptions({
      queryKey: groupKeys.members(groupId ?? ""),
      queryFn: () => api.listMembers(groupId as string),
      enabled: !!groupId,
    }),

  membersPage: (groupId?: string, enabled = true, search?: string) =>
    infiniteQueryOptions({
      queryKey: groupKeys.membersPage(groupId ?? "", search),
      queryFn: ({ pageParam }) => api.listMembersPage(groupId as string, pageParam, search),
      ...cursorPagination(),
      enabled: !!groupId && enabled,
    }),

  activeMembers: (groupId?: string) =>
    queryOptions({
      queryKey: groupKeys.activeMembers(groupId ?? ""),
      queryFn: () => api.listActiveMembers(groupId as string),
      enabled: !!groupId,
    }),

  memberById: (groupId?: string) =>
    queryOptions({
      queryKey: groupKeys.memberById(groupId ?? ""),
      queryFn: () => api.getMemberById(groupId as string),
      enabled: !!groupId,
    }),

  usersFromSameUniversityNotInGroup: (groupId?: string) =>
    queryOptions({
      queryKey: groupKeys.usersFromSameUniversityNotInGroup(groupId ?? ""),
      queryFn: () => api.listUsersFromSameUniversityNotInGroup(groupId as string),
      enabled: !!groupId,
    }),

  checkUserIsAdmin: (groupId?: string, userId?: string) =>
    queryOptions({
      queryKey: groupKeys.checkUserIsAdmin(groupId ?? "", userId ?? ""),
      queryFn: () => api.checkUserIsAdmin(groupId as string, userId as string),
      enabled: !!groupId && !!userId,
    }),

  bans: (groupId?: string, enabled = true) =>
    infiniteQueryOptions({
      queryKey: groupKeys.bans(groupId ?? ""),
      queryFn: ({ pageParam }) => api.listBans(groupId as string, pageParam),
      ...cursorPagination(),
      enabled: !!groupId && enabled,
    }),

  courseResources: (groupId?: string, enabled = true, category?: ResourceCategory, search?: string) =>
    infiniteQueryOptions({
      queryKey: groupKeys.courseResources(groupId ?? "", category, search),
      queryFn: ({ pageParam }) =>
        api.listCourseResources(groupId as string, { cursor: pageParam, category, search }),
      ...cursorPagination(),
      enabled: !!groupId && enabled,
    }),

  mentionSearchUsers: (groupId: string | undefined, query: string, enabled: boolean) =>
    queryOptions({
      queryKey: groupKeys.mentionSearch(groupId ?? "", query),
      queryFn: () => api.mentionSearchUsers(groupId as string, query),
      enabled: !!groupId && enabled,
      staleTime: 30_000,
    }),
});
