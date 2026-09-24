import { useState } from "react";
import { View, Text, Image, SectionList, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { getFullName } from "@universe/shared";
import ThemedView from "@components/ThemedView";
import SettingsScreenHeader from "@components/settings/SettingsScreenHeader";
import SearchInput from "@components/SearchInput";
import { useGetFollowersQuery, useGetFollowingQuery } from "@queryAndMutation/queries/user-queries";
import { useGetConvoUsers } from "@queryAndMutation/queries/conversation-queries";
import { useSearchUsersInfinite } from "@queryAndMutation/queries/search-queries";
import { useInviteToEventMutation } from "@queryAndMutation/mutations/event-mutation";
import { useAuthStore } from "@store/authStore";
import { Colors } from "@constants/colors";
import { PressableScale } from "@lib/styled";
import { getAvatarColor, getInitials } from "@utils/chatAvatarColor";
import { useDebounce } from "@hooks/useDebounce";
import { useAppColorScheme } from "@hooks/useAppColorScheme";

const AVATAR_SIZE = 40;
const MIN_SEARCH_LENGTH = 2;

type InviteCandidate = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  profilePicture?: string | null;
};

type InviteCandidateRowProps = {
  candidate: InviteCandidate;
  invited: boolean;
  onInvite: (userId: string) => void;
  isInviting: boolean;
};

// Ports web's InviteToEventModal (frontend/src/features/events/components/
// InviteToEventModal.tsx) as a pushed screen rather than a bottom sheet, to
// match this feature's own participants-screen decision (screens over
// modals) and avoid the RNGH-inside-RN-Modal touch issue documented on
// ConfirmDialog. Unlike web (which fetches every user via useGetAllUsersQuery
// and filters client-side), search here hits the real, already-existing
// `/search/users` endpoint (trigram/tsvector backed, same as the rest of the
// app's search) via useSearchUsersInfinite — a deliberate improvement over
// the web pattern for this mobile port, not a 1:1 port of that part.
const InviteCandidateRow = ({ candidate, invited, onInvite, isInviting }: InviteCandidateRowProps) => {
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;
  const name = getFullName(candidate);

  return (
    <View className="flex-row items-center gap-3 py-2.5">
      {candidate.profilePicture ? (
        <Image
          source={{ uri: candidate.profilePicture }}
          style={{ width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2 }}
        />
      ) : (
        <View
          className="items-center justify-center rounded-full"
          style={{ width: AVATAR_SIZE, height: AVATAR_SIZE, backgroundColor: getAvatarColor(candidate.id) }}
        >
          <Text className="text-xs font-semibold" style={{ color: "#ffffff" }}>
            {getInitials(name)}
          </Text>
        </View>
      )}
      <Text className="min-w-0 flex-1 text-sm font-semibold" style={{ color: theme.title }} numberOfLines={1}>
        {name}
      </Text>
      {invited ? (
        <Text className="text-xs" style={{ color: theme.tabIconColour }}>
          Invited
        </Text>
      ) : (
        <PressableScale
          enabled={!isInviting}
          onPress={() => onInvite(candidate.id)}
          className="rounded-full px-3 py-1.5"
          style={{ backgroundColor: Colors.primary }}
        >
          <Text className="text-xs font-semibold" style={{ color: "#ffffff" }}>
            Invite
          </Text>
        </PressableScale>
      )}
    </View>
  );
};

const InviteToEvent = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;
  const currentUserId = useAuthStore((state) => state.user?.id);

  const [search, setSearch] = useState("");
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());
  const debouncedSearch = useDebounce(search, 500).trim();
  const isSearching = debouncedSearch.length >= MIN_SEARCH_LENGTH;

  const { data: convoUsers } = useGetConvoUsers();
  const { data: followers } = useGetFollowersQuery(currentUserId);
  const { data: following } = useGetFollowingQuery(currentUserId);
  const { mutate: inviteParticipant, isPending: isInviting } = useInviteToEventMutation(id);

  const {
    data: searchData,
    isPending: isSearchPending,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useSearchUsersInfinite(debouncedSearch, isSearching);
  const searchResults = searchData?.pages.flatMap((page) => page.items) ?? [];

  const handleInvite = (userId: string) => {
    inviteParticipant(userId, {
      onSuccess: () => setInvitedIds((prev) => new Set(prev).add(userId)),
    });
  };

  const sections = isSearching
    ? [{ title: "Search results", data: searchResults }]
    : ([
        { title: "From your conversations", data: convoUsers },
        { title: "Your followers", data: followers },
        { title: "People you follow", data: following },
      ] as { title: string; data?: InviteCandidate[] }[]
      ).filter((section) => section.data && section.data.length > 0) as {
        title: string;
        data: InviteCandidate[];
      }[];

  return (
    <ThemedView safe fullHeight>
      <SettingsScreenHeader title="Invite people" />
      <View className="px-4 pb-3 pt-3">
        <SearchInput value={search} onChangeText={setSearch} placeholder="Search users..." />
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(candidate) => candidate.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (isSearching && hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        renderSectionHeader={({ section }) => (
          <Text className="px-1 pb-1 pt-3 text-xs font-medium" style={{ color: theme.tabIconColour }}>
            {section.title}
          </Text>
        )}
        ListEmptyComponent={
          isSearching && !isSearchPending ? (
            <Text className="pt-8 text-center text-sm" style={{ color: theme.tabIconColour }}>
              No users found.
            </Text>
          ) : null
        }
        ListFooterComponent={
          (isSearching && isSearchPending) || isFetchingNextPage ? (
            <ActivityIndicator className="py-4" color={Colors.primary} />
          ) : null
        }
        renderItem={({ item: candidate }) => (
          <InviteCandidateRow
            candidate={candidate}
            invited={invitedIds.has(candidate.id)}
            onInvite={handleInvite}
            isInviting={isInviting}
          />
        )}
      />
    </ThemedView>
  );
};

export default InviteToEvent;
