import { useState } from "react";
import { View, Text, Image, FlatList, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getFullName, type GroupMember } from "@universe/shared";
import ThemedView from "@components/ThemedView";
import SettingsScreenHeader from "@components/settings/SettingsScreenHeader";
import SearchInput from "@components/SearchInput";
import { useGetGroupMembersInfiniteQuery, useGetGroupMemberById } from "@queryAndMutation/queries/group-queries";
import { usePromoteToAdminMutation, useBanGroupMemberMutation } from "@queryAndMutation/mutations/group-mutation";
import { useConfirmDialogStore } from "@store/confirmDialogStore";
import { Colors } from "@constants/colors";
import { IconSizes } from "@constants/iconSizes";
import { PressableScale } from "@lib/styled";
import { getAvatarColor, getInitials } from "@utils/chatAvatarColor";
import { useDebounce } from "@hooks/useDebounce";
import { useAppColorScheme } from "@hooks/useAppColorScheme";

const AVATAR_SIZE = 40;

// Ports web's ViewMembersModal (member list + role badges + admin-only
// "Make admin"/"Ban") as a pushed screen. Only reachable from the group
// details screen's "Members" row, so `id` is always a groupId here — see
// current-feature.md's picked follow-up scope ("Group member list + admin
// actions"). Kick (remove-without-ban) and the banned-users list aren't
// included: web itself has no UI for either (see feature research notes).
const GroupMembers = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const { data: viewer } = useGetGroupMemberById(id);
  const isAdmin = viewer?.role === "admin";

  const { data, isPending, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useGetGroupMembersInfiniteQuery(id, true, debouncedSearch);
  const members = data?.pages.flatMap((page) => page.items) ?? [];

  const { mutate: promoteToAdmin, isPending: isPromoting } = usePromoteToAdminMutation(id);
  const { mutate: banMember, isPending: isBanning } = useBanGroupMemberMutation(id);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  const handlePromote = (member: GroupMember) => {
    setPendingUserId(member.memberId);
    promoteToAdmin(member.memberId, { onSettled: () => setPendingUserId(null) });
  };

  const handleBan = (member: GroupMember) => {
    const name = getFullName(member.member) || "this member";
    useConfirmDialogStore.getState().open({
      title: `Ban ${name}?`,
      message: "They'll be removed from the group and won't be able to rejoin.",
      confirmLabel: "Ban",
      destructive: true,
      icon: "ban-outline",
      onConfirm: () => {
        setPendingUserId(member.memberId);
        banMember({ userId: member.memberId }, { onSettled: () => setPendingUserId(null) });
      },
    });
  };

  return (
    <ThemedView safe fullHeight>
      <SettingsScreenHeader title="Members" />
      <View className="px-4 pb-3 pt-3">
        <SearchInput value={search} onChangeText={setSearch} placeholder="Search members..." />
      </View>

      {isPending ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={members}
          keyExtractor={(member) => member.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 4 }}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          ListEmptyComponent={
            <Text className="pt-8 text-center text-sm" style={{ color: theme.tabIconColour }}>
              No members found.
            </Text>
          }
          ListFooterComponent={
            isFetchingNextPage ? <ActivityIndicator className="py-4" color={Colors.primary} /> : null
          }
          renderItem={({ item: member }) => {
            const name = getFullName(member.member) || "Unknown";
            const isRowPending = pendingUserId === member.memberId && (isPromoting || isBanning);
            const canManage = isAdmin && member.role !== "admin";

            return (
              <View className="flex-row items-center gap-3 py-2.5">
                {member.member.profilePicture ? (
                  <Image
                    source={{ uri: member.member.profilePicture }}
                    style={{ width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2 }}
                  />
                ) : (
                  <View
                    className="items-center justify-center rounded-full"
                    style={{
                      width: AVATAR_SIZE,
                      height: AVATAR_SIZE,
                      backgroundColor: getAvatarColor(member.memberId),
                    }}
                  >
                    <Text className="text-xs font-semibold" style={{ color: "#ffffff" }}>
                      {getInitials(name)}
                    </Text>
                  </View>
                )}
                <View className="min-w-0 flex-1">
                  <Text className="text-sm font-semibold" style={{ color: theme.title }} numberOfLines={1}>
                    {name}
                  </Text>
                  {member.role === "admin" ? (
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="shield-checkmark-outline" size={12} color={theme.tabIconColour} />
                      <Text className="text-xs" style={{ color: theme.tabIconColour }}>
                        Admin
                      </Text>
                    </View>
                  ) : null}
                </View>
                {canManage ? (
                  <View className="flex-row items-center gap-2">
                    <PressableScale
                      enabled={!isRowPending}
                      onPress={() => handlePromote(member)}
                      className="rounded-full px-3 py-1.5"
                      style={{ backgroundColor: theme.uiBackground, borderWidth: 1, borderColor: theme.borderColor }}
                    >
                      <Text className="text-xs font-semibold" style={{ color: theme.title }}>
                        Make admin
                      </Text>
                    </PressableScale>
                    <PressableScale
                      enabled={!isRowPending}
                      onPress={() => handleBan(member)}
                      hitSlop={8}
                    >
                      <Ionicons name="ban-outline" size={IconSizes.lg} color={Colors.warning} />
                    </PressableScale>
                  </View>
                ) : null}
              </View>
            );
          }}
        />
      )}
    </ThemedView>
  );
};

export default GroupMembers;
