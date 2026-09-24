import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { BottomSheetFlatList, type BottomSheetModal } from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { getFullName, type FollowUser } from "@universe/shared";
import ThemedBottomSheet from "@components/BottomSheet";
import SearchInput from "@components/SearchInput";
import UserAvatar from "@components/UserAvatar";
import {
  useGetRelevantFollowersInfiniteQuery,
  useGetRelevantFollowingInfiniteQuery,
} from "@queryAndMutation/queries/user-queries";
import { useAuthStore } from "@store/authStore";
import { Colors } from "@constants/colors";
import { PressableScale } from "@lib/styled";
import { useDebounce } from "@hooks/useDebounce";
import { useAppColorScheme } from "@hooks/useAppColorScheme";

type FollowTab = "followers" | "following";

export type FollowListSheetHandle = { present: (tab: FollowTab) => void; dismiss: () => void };

type FollowListSheetProps = { userId?: string };

const FollowListRow = ({
  user,
  isSelf,
  onPress,
}: {
  user: FollowUser;
  isSelf: boolean;
  onPress: () => void;
}) => {
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;
  const name = isSelf ? "You" : getFullName(user);

  return (
    <PressableScale onPress={onPress} className="flex-row items-center gap-3 px-5 py-2.5">
      <UserAvatar user={user} size={44} iconColor={theme.iconMuted} />
      <Text className="flex-1 text-sm font-semibold" style={{ color: theme.title }} numberOfLines={1}>
        {name}
      </Text>
    </PressableScale>
  );
};

// Mobile port of web's FollowListSheet (frontend/src/features/profile/FollowListSheet.tsx),
// as a gorhom bottom sheet instead of a Drawer, with an in-sheet tab switcher
// instead of web's two-separate-Drawer-instances approach. Search is
// server-side (useGetRelevantFollowers/FollowingInfiniteQuery, already built
// in packages/shared) rather than filtered client-side, matching web exactly.
const FollowListSheet = forwardRef<FollowListSheetHandle, FollowListSheetProps>(({ userId }, ref) => {
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;
  const insets = useSafeAreaInsets();
  const { user: authUser } = useAuthStore();
  const sheetRef = useRef<BottomSheetModal>(null);
  const [tab, setTab] = useState<FollowTab>("followers");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);

  useImperativeHandle(ref, () => ({
    present: (initialTab) => {
      setTab(initialTab);
      setSearch("");
      sheetRef.current?.present();
    },
    dismiss: () => sheetRef.current?.dismiss(),
  }));

  const handleTabChange = (nextTab: FollowTab) => {
    setTab(nextTab);
    setSearch("");
  };

  // Both hooks are always called (rules of hooks) but only the active tab's
  // gets a real userId - the other stays dormant via the hook's own
  // `enabled: !!id` guard, same trick web's FollowListSheet uses.
  const followersQuery = useGetRelevantFollowersInfiniteQuery(
    tab === "followers" ? userId : undefined,
    debouncedSearch,
  );
  const followingQuery = useGetRelevantFollowingInfiniteQuery(
    tab === "following" ? userId : undefined,
    debouncedSearch,
  );
  const { data, isPending, hasNextPage, isFetchingNextPage, fetchNextPage } =
    tab === "followers" ? followersQuery : followingQuery;

  const users = data?.pages.flatMap((page) => page.users) ?? [];
  const emptyMessage = debouncedSearch
    ? "No matches found."
    : tab === "followers"
      ? "No followers yet."
      : "Not following anyone yet.";

  const handleRowPress = (rowUserId: string) => {
    sheetRef.current?.dismiss();
    router.push(rowUserId === authUser?.id ? "/profile" : `/profile/${rowUserId}`);
  };

  return (
    <ThemedBottomSheet ref={sheetRef} snapPoints={["75%"]} scrollable onDismiss={() => setSearch("")}>
      <BottomSheetFlatList
        data={users}
        keyExtractor={(item) => item.id}
        stickyHeaderIndices={[0]}
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
        ListHeaderComponent={
          <View style={{ backgroundColor: theme.uiBackground }}>
            <View
              className="flex-row items-center gap-6 border-b px-5 pb-3 pt-1"
              style={{ borderBottomColor: theme.borderColor }}
            >
              {(["followers", "following"] as const).map((t) => (
                <PressableScale key={t} onPress={() => handleTabChange(t)} hitSlop={8}>
                  <Text
                    className="text-sm font-semibold capitalize"
                    style={{ color: tab === t ? theme.title : theme.tabIconColour }}
                  >
                    {t}
                  </Text>
                </PressableScale>
              ))}
            </View>
            <View className="px-5 pb-3 pt-3">
              <SearchInput value={search} onChangeText={setSearch} placeholder={`Search ${tab}...`} />
            </View>
          </View>
        }
        ListEmptyComponent={
          isPending ? (
            <View className="items-center py-10">
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : (
            <Text className="px-5 pt-8 text-center text-sm" style={{ color: theme.tabIconColour }}>
              {emptyMessage}
            </Text>
          )
        }
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        ListFooterComponent={
          isFetchingNextPage ? <ActivityIndicator className="py-4" color={Colors.primary} /> : null
        }
        renderItem={({ item }) => (
          <FollowListRow
            user={item}
            isSelf={item.id === authUser?.id}
            onPress={() => handleRowPress(item.id)}
          />
        )}
      />
    </ThemedBottomSheet>
  );
});

FollowListSheet.displayName = "FollowListSheet";

export default FollowListSheet;
