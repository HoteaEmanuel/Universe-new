import { useState } from "react";
import { View, Text, Image, FlatList, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getFullName, type EventParticipantWithUser, type EventParticipantStatus } from "@universe/shared";
import ThemedView from "@components/ThemedView";
import SettingsScreenHeader from "@components/settings/SettingsScreenHeader";
import SearchInput from "@components/SearchInput";
import SelectChip from "@components/SelectChip";
import { useGetEventParticipantsInfiniteQuery } from "@queryAndMutation/queries/event-queries";
import { useBanEventParticipantMutation } from "@queryAndMutation/mutations/event-mutation";
import { useAuthStore } from "@store/authStore";
import { useConfirmDialogStore } from "@store/confirmDialogStore";
import { Colors } from "@constants/colors";
import { IconSizes } from "@constants/iconSizes";
import { PressableScale } from "@lib/styled";
import { getAvatarColor, getInitials } from "@utils/chatAvatarColor";
import { useDebounce } from "@hooks/useDebounce";
import { useAppColorScheme } from "@hooks/useAppColorScheme";

const AVATAR_SIZE = 40;

const STATUS_TABS: { key: EventParticipantStatus; label: string }[] = [
  { key: "going", label: "Going" },
  { key: "interested", label: "Interested" },
  { key: "waitlisted", label: "Waitlisted" },
];

const HOST_ONLY_TABS: { key: EventParticipantStatus; label: string }[] = [
  { key: "invited", label: "Invited" },
];

// Ports web's EventParticipantsModal (frontend/src/features/events/
// components/EventParticipantsModal.tsx) as a pushed screen — mobile favors
// dedicated screens over Drawer/Modal for list surfaces like this (see
// (chat)/members/[id].tsx). isHost is passed as a route param from
// event-details rather than re-fetched here, mirroring the existing
// isGroup="1" string-param convention used for chat navigation.
const EventParticipants = () => {
  const { id, isHost: isHostParam } = useLocalSearchParams<{ id: string; isHost?: string }>();
  const isHost = isHostParam === "1";
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;
  const currentUserId = useAuthStore((state) => state.user?.id);

  const visibleTabs = isHost ? [...STATUS_TABS, ...HOST_ONLY_TABS] : STATUS_TABS;
  const [activeTab, setActiveTab] = useState<EventParticipantStatus>("going");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const { data, isPending, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useGetEventParticipantsInfiniteQuery(id, activeTab, true, debouncedSearch);
  const participants = data?.pages.flatMap((page) => page.items) ?? [];

  const { mutate: banParticipant, isPending: isBanning } = useBanEventParticipantMutation(id);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  const handleBan = (participant: EventParticipantWithUser) => {
    const name = getFullName(participant.user) || "this participant";
    useConfirmDialogStore.getState().open({
      title: `Remove ${name} from the event?`,
      message: "They'll be removed immediately and won't be able to RSVP again until you unban them.",
      confirmLabel: "Remove",
      destructive: true,
      icon: "ban-outline",
      onConfirm: () => {
        setPendingUserId(participant.userId);
        banParticipant({ userId: participant.userId }, { onSettled: () => setPendingUserId(null) });
      },
    });
  };

  return (
    <ThemedView safe fullHeight>
      <SettingsScreenHeader title="Participants" />
      <View className="gap-3 px-4 pb-3 pt-3">
        <SearchInput value={search} onChangeText={setSearch} placeholder="Search participants..." />
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={visibleTabs}
          keyExtractor={(tab) => tab.key}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item: tab }) => (
            <SelectChip label={tab.label} selected={activeTab === tab.key} onPress={() => setActiveTab(tab.key)} />
          )}
        />
      </View>

      {isPending ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={participants}
          keyExtractor={(participant) => participant.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 4 }}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          ListEmptyComponent={
            <Text className="pt-8 text-center text-sm" style={{ color: theme.tabIconColour }}>
              No one here yet.
            </Text>
          }
          ListFooterComponent={
            isFetchingNextPage ? <ActivityIndicator className="py-4" color={Colors.primary} /> : null
          }
          renderItem={({ item: participant }) => {
            const name = getFullName(participant.user) || "Unknown";
            const isRowPending = pendingUserId === participant.userId && isBanning;
            const canManage = isHost && participant.userId !== currentUserId;

            return (
              <View className="flex-row items-center gap-3 py-2.5">
                {participant.user.profilePicture ? (
                  <Image
                    source={{ uri: participant.user.profilePicture }}
                    style={{ width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2 }}
                  />
                ) : (
                  <View
                    className="items-center justify-center rounded-full"
                    style={{ width: AVATAR_SIZE, height: AVATAR_SIZE, backgroundColor: getAvatarColor(participant.userId) }}
                  >
                    <Text className="text-xs font-semibold" style={{ color: "#ffffff" }}>
                      {getInitials(name)}
                    </Text>
                  </View>
                )}
                <Text className="min-w-0 flex-1 text-sm font-semibold" style={{ color: theme.title }} numberOfLines={1}>
                  {name}
                </Text>
                {canManage ? (
                  <PressableScale enabled={!isRowPending} onPress={() => handleBan(participant)} hitSlop={8}>
                    <Ionicons name="ban-outline" size={IconSizes.lg} color={Colors.warning} />
                  </PressableScale>
                ) : null}
              </View>
            );
          }}
        />
      )}
    </ThemedView>
  );
};

export default EventParticipants;
