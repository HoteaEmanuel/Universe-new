import { useRef, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import ThemedView from "@components/ThemedView";
import { useAuthStore } from "@store/authStore";
import { useConfirmDialogStore } from "@store/confirmDialogStore";
import { Colors } from "@constants/colors";
import { IconSizes } from "@constants/iconSizes";
import { PressableScale } from "@lib/styled";
import { useGetFollowersQuery, useGetFollowingQuery } from "@queryAndMutation/queries/user-queries";
import { useGetUserPostsQuery, useGetSavedPostsQuery } from "@queryAndMutation/queries/post-queries";
import { useBulkDeletePostsMutation } from "@queryAndMutation/mutations/post-mutation";
import ProfileHeader, { type ProfileHeaderUser } from "@components/profile/ProfileHeader";
import ProfilePostGrid from "@components/profile/ProfilePostGrid";
import FollowListSheet, { type FollowListSheetHandle } from "@components/profile/FollowListSheet";
import { useAppColorScheme } from "@hooks/useAppColorScheme";
import { usePostDragSelect } from "@hooks/usePostDragSelect";

type ProfileTab = "posts" | "saved";

const Profile = () => {
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;
  const insets = useSafeAreaInsets();
  const { user, logOut } = useAuthStore();
  const [tab, setTab] = useState<ProfileTab>("posts");
  const followListSheetRef = useRef<FollowListSheetHandle>(null);

  const handleLogout = () => {
    useConfirmDialogStore.getState().open({
      title: "Log out?",
      message: "You'll need to sign back in to use the app again.",
      confirmLabel: "Log out",
      destructive: true,
      icon: "log-out-outline",
      onConfirm: async () => {
        await logOut();
        router.replace("/login");
      },
    });
  };

  const { data: followersData, isLoading: followersLoading } = useGetFollowersQuery(user?.id);
  const { data: followingData, isLoading: followingLoading } = useGetFollowingQuery(user?.id);
  const { data: userPostsData, isLoading: userPostsLoading } = useGetUserPostsQuery(user?.id);
  const { data: savedPostsData, isLoading: savedPostsLoading } = useGetSavedPostsQuery(user?.id ?? "");

  const {
    selectMode,
    selectedIds,
    scrollEnabled,
    gesture,
    scrollViewRef,
    handleScroll,
    handleScrollViewLayout,
    handleGridLayout,
    enterSelectMode,
    toggleSelect,
    selectAll,
    exitSelectMode,
  } = usePostDragSelect(userPostsData ?? []);

  const bulkDeleteMutation = useBulkDeletePostsMutation(user?.id);

  // Bulk delete only applies to your own posts - leaving select mode active
  // wouldn't make sense once you're looking at what you've saved from others.
  const handleTabChange = (nextTab: ProfileTab) => {
    if (selectMode) exitSelectMode();
    setTab(nextTab);
  };

  const handleDeleteSelected = () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    useConfirmDialogStore.getState().open({
      title: `Delete ${ids.length} post${ids.length === 1 ? "" : "s"}?`,
      message: "This action cannot be undone.",
      confirmLabel: "Delete",
      destructive: true,
      onConfirm: () => {
        bulkDeleteMutation.mutate(ids, { onSuccess: exitSelectMode });
      },
    });
  };

  if (followersLoading || followingLoading || userPostsLoading) {
    return (
      <ThemedView safe className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={Colors.primary} />
      </ThemedView>
    );
  }

  return (
    <ThemedView safe fullHeight style={{ paddingBottom: 0 }}>
      <GestureDetector gesture={gesture}>
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          scrollEnabled={scrollEnabled}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onLayout={handleScrollViewLayout}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {selectMode ? (
            <View className="flex-row items-center justify-between px-4 pt-2">
              <Text className="text-sm font-semibold" style={{ color: theme.title }}>
                {selectedIds.size} selected
              </Text>
              <PressableScale onPress={selectAll} hitSlop={8}>
                <Text className="text-sm font-semibold" style={{ color: Colors.primary }}>
                  Select all
                </Text>
              </PressableScale>
            </View>
          ) : (
            <View className="flex-row items-center justify-end gap-4 px-4 pt-2">
              <PressableScale onPress={() => router.push("/settings")} hitSlop={8}>
                <Ionicons name="settings-outline" size={IconSizes.xl} color={theme.iconMuted} />
              </PressableScale>
              <PressableScale onPress={handleLogout} hitSlop={8}>
                <Ionicons name="log-out-outline" size={IconSizes.xl} color={theme.iconMuted} />
              </PressableScale>
            </View>
          )}

          <ProfileHeader
            user={(user as ProfileHeaderUser | null) ?? {}}
            isOwnProfile
            postsCount={userPostsData?.length ?? 0}
            followersCount={followersData?.length ?? 0}
            followingCount={followingData?.length ?? 0}
            onFollowersPress={() => followListSheetRef.current?.present("followers")}
            onFollowingPress={() => followListSheetRef.current?.present("following")}
          />

          <View
            className="flex-row justify-center gap-10 border-t"
            style={{ borderTopColor: theme.borderColor }}
          >
            <PressableScale
              onPress={() => handleTabChange("posts")}
              className="items-center gap-1 py-3"
              style={{
                borderTopWidth: 2,
                borderTopColor: tab === "posts" ? Colors.primary : "transparent",
                marginTop: -1,
              }}
            >
              <Ionicons
                name={tab === "posts" ? "grid" : "grid-outline"}
                size={IconSizes.md}
                color={tab === "posts" ? theme.title : theme.tabIconColour}
              />
            </PressableScale>
            <PressableScale
              onPress={() => handleTabChange("saved")}
              className="items-center gap-1 py-3"
              style={{
                borderTopWidth: 2,
                borderTopColor: tab === "saved" ? Colors.primary : "transparent",
                marginTop: -1,
              }}
            >
              <Ionicons
                name={tab === "saved" ? "bookmark" : "bookmark-outline"}
                size={IconSizes.md}
                color={tab === "saved" ? theme.title : theme.tabIconColour}
              />
            </PressableScale>
          </View>

          {tab === "saved" && savedPostsLoading ? (
            <View className="items-center py-10">
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : tab === "posts" ? (
            <ProfilePostGrid
              posts={userPostsData}
              emptyTitle={
                <>
                  Give this space some{" "}
                  <Text className="italic" style={{ color: "#f59e0b", fontWeight: "800" }}>
                    life
                  </Text>
                </>
              }
              emptyDescription="You don't need the perfect post — just something real."
              emptyIllustration="student-life"
              showCreateCta
              selectable
              selectMode={selectMode}
              selectedIds={selectedIds}
              onLongPressTile={enterSelectMode}
              onToggleSelect={toggleSelect}
              onLayout={handleGridLayout}
            />
          ) : (
            <ProfilePostGrid
              posts={savedPostsData}
              emptyTitle="No saved posts yet"
              emptyDescription="Posts you save will show up here."
            />
          )}
        </ScrollView>
      </GestureDetector>

      {selectMode ? (
        <View
          className="flex-row items-center justify-between px-gutter pt-3"
          style={{
            backgroundColor: theme.background,
            borderTopWidth: 1,
            borderTopColor: theme.borderColor,
            paddingBottom: Math.max(insets.bottom, 16),
          }}
        >
          <PressableScale onPress={exitSelectMode} className="px-2 py-2.5">
            <Text className="text-sm font-semibold" style={{ color: theme.text }}>
              Cancel
            </Text>
          </PressableScale>
          <PressableScale
            onPress={handleDeleteSelected}
            enabled={selectedIds.size > 0 && !bulkDeleteMutation.isPending}
            className="flex-row items-center gap-2 rounded-full px-5 py-2.5"
            style={{
              backgroundColor: Colors.warning,
              opacity: selectedIds.size > 0 ? 1 : 0.5,
            }}
          >
            <Ionicons name="trash-outline" size={IconSizes.sm} color="#ffffff" />
            <Text className="text-sm font-semibold" style={{ color: "#ffffff" }}>
              Delete
            </Text>
          </PressableScale>
        </View>
      ) : null}

      <FollowListSheet ref={followListSheetRef} userId={user?.id} />
    </ThemedView>
  );
};

export default Profile;
