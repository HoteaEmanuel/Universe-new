import { View, ScrollView, ActivityIndicator, useColorScheme } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  useGetUserByIdQuery,
  useIsFollowingQuery,
  useGetFollowersQuery,
  useGetFollowingQuery,
} from "../../../queryAndMutation/queries/user-queries";
import ThemedView from "../../../components/ThemedView";
import { useGetUserPostsQuery } from "../../../queryAndMutation/queries/post-queries";
import { useFollowMutation, useUnfollowMutation } from "../../../queryAndMutation/mutations/user-mutation";
import { useAuthStore } from "../../../store/authStore";
import { Colors } from "../../../constants/colors";
import { IconSizes } from "../../../constants/iconSizes";
import { PressableScale } from "../../../lib/styled";
import ProfileHeader from "../../../components/profile/ProfileHeader";
import ProfilePostGrid from "../../../components/profile/ProfilePostGrid";

const UserProfile = () => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;
  const { user: authUser } = useAuthStore();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: user, isLoading } = useGetUserByIdQuery(id);
  const { data: followersData, isLoading: followersLoading } = useGetFollowersQuery(id);
  const { data: followingData, isLoading: followingLoading } = useGetFollowingQuery(id);
  const { data: isFollowingData, isLoading: isFollowingLoading } = useIsFollowingQuery(id);
  const { data: userPosts, isLoading: userPostsLoading } = useGetUserPostsQuery(id);

  const { mutate: followUser } = useFollowMutation(id, authUser?.id);
  const { mutate: unfollowUser } = useUnfollowMutation(id, authUser?.id);

  if (isLoading || followersLoading || followingLoading || isFollowingLoading || userPostsLoading) {
    return (
      <ThemedView safe className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={Colors.primary} />
      </ThemedView>
    );
  }

  return (
    <ThemedView safe fullHeight>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="flex-row items-center px-4 pt-2">
          <PressableScale onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={IconSizes.xl} color={theme.iconMuted} />
          </PressableScale>
        </View>

        <ProfileHeader
          user={user ?? {}}
          isOwnProfile={false}
          postsCount={userPosts?.length ?? 0}
          followersCount={followersData?.length ?? 0}
          followingCount={followingData?.length ?? 0}
          isFollowing={!!isFollowingData}
          onFollowToggle={() => (isFollowingData ? unfollowUser() : followUser())}
          onMessage={() => {
            console.log("TO MESSAGES");
          }}
        />

        <ProfilePostGrid
          posts={userPosts}
          emptyTitle="No posts yet"
          emptyDescription="Nothing has been shared here yet."
        />
      </ScrollView>
    </ThemedView>
  );
};

export default UserProfile;
