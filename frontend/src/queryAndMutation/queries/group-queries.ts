import { useQuery } from "@tanstack/react-query";
import { useGroupStore } from "../../store/groupStore";
import type {
  ChatMessage,
  ChatUser,
  GroupConversation,
  GroupMember,
} from "../../features/chat/types";

export const useGetUserGroups = (userId?: string) => {
  const { getUserGroups } = useGroupStore();
  return useQuery<GroupConversation[]>({
    queryFn: () => getUserGroups(userId as string),
    queryKey: ["user-groups", userId],
    enabled: !!userId,
  });
};

export const useGetDiscoverablePublicGroups = (enabled = true) => {
  const { getDiscoverablePublicGroups } = useGroupStore();
  return useQuery<GroupConversation[]>({
    queryFn: () => getDiscoverablePublicGroups(),
    queryKey: ["discoverable-public-groups"],
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

export const useGetGroupMessages = (id?: string) => {
  const { getGroupMessages } = useGroupStore();
  return useQuery<ChatMessage[]>({
    queryFn: () => getGroupMessages(id as string),
    queryKey: ["group-messages", id],
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
