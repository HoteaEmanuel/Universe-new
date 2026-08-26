import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useGroupStore } from "../../store/groupStore";
import type {
  ChatMessagePage,
  ChatResourcePage,
  ChatUser,
  GroupBanPage,
  GroupConversation,
  GroupConversationsPage,
  GroupMember,
  ResourceType,
} from "../../features/chat/types";
import type { MentionUser } from "../types";

export const useGetUserGroupsInfinite = (userId: string | undefined, search: string) => {
  const { getUserGroups } = useGroupStore();
  return useInfiniteQuery<GroupConversationsPage>({
    queryKey: ["user-groups", userId, search],
    queryFn: ({ pageParam }) =>
      getUserGroups(userId as string, {
        cursor: pageParam as string | undefined,
        search,
      }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
    enabled: !!userId,
    placeholderData: keepPreviousData,
  });
};

export const useGetDiscoverablePublicGroups = (
  enabled = true,
  courseTag?: string,
  universityOnly?: boolean,
  limit?: number,
) => {
  const { getDiscoverablePublicGroups } = useGroupStore();
  return useQuery<GroupConversation[]>({
    queryFn: () => getDiscoverablePublicGroups(courseTag, universityOnly, limit),
    queryKey: ["discoverable-public-groups", courseTag, universityOnly, limit],
    enabled,
  });
};

export const useGetCourseCatalog = (enabled = true, groupId?: string) => {
  const { getCourseCatalog } = useGroupStore();
  return useQuery<string[]>({
    queryFn: () => getCourseCatalog(groupId),
    queryKey: ["course-catalog", groupId],
    enabled,
  });
};

export const useGetGroupById = (id?: string) => {
  const { getGroupById } = useGroupStore();
  return useQuery<GroupConversation>({
    queryFn: () => getGroupById(id as string),
    queryKey: ["group", id],
    enabled: !!id,
  });
};

export const useGetGroupMessagesInfinite = (id?: string) => {
  const { getGroupMessages } = useGroupStore();
  return useInfiniteQuery<ChatMessagePage>({
    queryKey: ["group-messages", id],
    queryFn: ({ pageParam }) =>
      getGroupMessages(id as string, pageParam as string | undefined),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
    enabled: !!id,
  });
};

export const useGetGroupResourcesInfinite = <T,>(type: ResourceType, id?: string) => {
  const { getGroupResources } = useGroupStore();
  return useInfiniteQuery<ChatResourcePage<T>>({
    queryKey: ["group-resources", type, id],
    queryFn: ({ pageParam }) =>
      getGroupResources(id as string, type, pageParam as string | undefined) as Promise<
        ChatResourcePage<T>
      >,
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
    enabled: !!id,
  });
};

export const useGetGroupMembers = (groupId?: string) => {
  const { getGroupMembers } = useGroupStore();
  return useQuery<GroupMember[]>({
    queryFn: () => getGroupMembers(groupId as string),
    queryKey: ["group-members", groupId],
    enabled: !!groupId,
  });
};

export const useGetActiveGroupMembers = (groupId?: string) => {
  const { getActiveMembers } = useGroupStore();
  return useQuery<ChatUser[]>({
    queryFn: () => getActiveMembers(groupId as string),
    queryKey: ["active-group-members", groupId],
    enabled: !!groupId,
  });
};

export const useGetGroupMemberById = (groupId?: string) => {
  const { getGroupMemberById } = useGroupStore();
  return useQuery<GroupMember>({
    queryFn: () => getGroupMemberById(groupId as string),
    queryKey: ["group-member", groupId],
    enabled: !!groupId,
  });
};

export const useGetUsersFromSameUniversityNotInGroupQuery = (
  groupId?: string,
) => {
  const { getUsersFromSameUniversityNotInGroup } = useGroupStore();
  return useQuery<ChatUser[]>({
    queryFn: () => getUsersFromSameUniversityNotInGroup(groupId as string),
    queryKey: ["usersFromSameUniversityNotInGroup", groupId],
    enabled: !!groupId,
  });
};

export const useCheckUserIsAdminQuery = (groupId?: string, userId?: string) => {
  const { checkUserIsAdmin } = useGroupStore();
  return useQuery<boolean>({
    queryFn: () => checkUserIsAdmin(groupId as string, userId as string),
    queryKey: ["checkUserIsAdmin", groupId, userId],
    enabled: !!groupId && !!userId,
  });
};

export const useGetGroupBansInfinite = (groupId?: string, enabled = true) => {
  const { getGroupBans } = useGroupStore();
  return useInfiniteQuery<GroupBanPage>({
    queryKey: ["group-bans", groupId],
    queryFn: ({ pageParam }) =>
      getGroupBans(groupId as string, pageParam as string | undefined),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
    enabled: !!groupId && enabled,
  });
};

export const useGroupMentionSearchUsersQuery = (
  groupId: string | undefined,
  query: string,
  enabled: boolean,
) => {
  const { getGroupMentionSearchUsers } = useGroupStore();
  return useQuery<MentionUser[]>({
    queryKey: ["group-mention-search", groupId, query],
    queryFn: () => getGroupMentionSearchUsers(groupId as string, query),
    enabled: !!groupId && enabled,
    staleTime: 30_000,
  });
};
