import { View, ScrollView, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import ThemedView from "@components/ThemedView";
import { useAuthStore } from "@store/authStore";
import { useConfirmDialogStore } from "@store/confirmDialogStore";
import { Colors } from "@constants/colors";
import { IconSizes } from "@constants/iconSizes";
import { PressableScale } from "@lib/styled";
import { useGetFollowersQuery, useGetFollowingQuery } from "@queryAndMutation/queries/user-queries";
import { useGetUserPostsQuery } from "@queryAndMutation/queries/post-queries";
import ProfileHeader, { type ProfileHeaderUser } from "@components/profile/ProfileHeader";
import ProfilePostGrid from "@components/profile/ProfilePostGrid";
import { useAppColorScheme } from "@hooks/useAppColorScheme";

const Profile = () => {
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;
  const { user, logOut } = useAuthStore();

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

  if (followersLoading || followingLoading || userPostsLoading) {
    return (
      <ThemedView safe className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={Colors.primary} />
      </ThemedView>
    );
  }

  return (
    <ThemedView safe fullHeight>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="flex-row items-center justify-end gap-4 px-4 pt-2">
          <PressableScale onPress={() => router.push("/settings")} hitSlop={8}>
            <Ionicons name="settings-outline" size={IconSizes.xl} color={theme.iconMuted} />
          </PressableScale>
          <PressableScale onPress={handleLogout} hitSlop={8}>
            <Ionicons name="log-out-outline" size={IconSizes.xl} color={theme.iconMuted} />
          </PressableScale>
        </View>

        <ProfileHeader
          user={(user as ProfileHeaderUser | null) ?? {}}
          isOwnProfile
          postsCount={userPostsData?.length ?? 0}
          followersCount={followersData?.length ?? 0}
          followingCount={followingData?.length ?? 0}
        />

        <ProfilePostGrid
          posts={userPostsData}
          emptyTitle="No posts yet"
          emptyDescription="Share something with your friends."
        />
      </ScrollView>
    </ThemedView>
  );
};

export default Profile;
