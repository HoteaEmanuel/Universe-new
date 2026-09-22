import { View, Text, FlatList } from "react-native";
import React, { Activity } from "react";
import { useLocalSearchParams } from "expo-router";
import {
  useGetUserByIdQuery,
  useIsFollowingQuery,
} from "../../../queryAndMutation/queries/user-queries";
import ThemedView from "../../../components/ThemedView";
import ProfileCard from "../../../components/ProfileCard";
import { Image } from "react-native";
import ThemedText from "../../../components/ThemedText";
import { getUserFullName } from "../../../utils/user/getUserFullName";
import { Ionicons } from "@expo/vector-icons";
import {
  useGetFollowersQuery,
  useGetFollowingQuery,
} from "../../../queryAndMutation/queries/user-queries.js";
import { Pressable } from "react-native";
import { useGetUserPostsQuery } from "../../../queryAndMutation/queries/post-queries.js";
import ThemedPostCard from "../../../components/ThemedPostCard";
import { useFollowMutation } from "../../../queryAndMutation/mutations/user-mutation.js";
import { useUnfollowMutation } from "../../../queryAndMutation/mutations/user-mutation.js";
import { useAuthStore } from "../../../store/authStore.js";
import PostsContainer from "../../../components/PostsContainer.jsx";
import { ActivityIndicator } from "react-native";
const UserProfile = () => {
  const { user: authUser } = useAuthStore();
  const { id } = useLocalSearchParams();
  const { data: user, isLoading, error } = useGetUserByIdQuery(id);
  const { data: followersData, isLoading: followersLoading } =
    useGetFollowersQuery(id);
  const { data: followingData, isLoading: followingLoading } =
    useGetFollowingQuery(id);
  const { data: isFollowingData, isLoading: isFollowingLoading } =
    useIsFollowingQuery(id);

  const { data: userPosts, isLoading: userPostsLoading } =
    useGetUserPostsQuery(id);

  const { mutate: followUser } = useFollowMutation(id, authUser.id);
  const { mutate: unfollowUser } = useUnfollowMutation(id, authUser.id);

  if (
    isLoading ||
    followersLoading ||
    followingLoading ||
    isFollowingLoading ||
    userPostsLoading
  ) {
    return (
      <View>
        <ActivityIndicator size="large" color={"#000"} />
      </View>
    );
  }
  return (
    <ThemedView className="min-h-screen">
      <View className="flex-row p-5">
        {" "}
        <Image
          source={{ uri: user?.profilePicture }}
          style={{ width: 100, height: 100, borderRadius: 50 }}
        />
        <View className="p-2 gap-2">
          <ThemedText className="text-lg font-bold">
            {getUserFullName(user)}
          </ThemedText>
          <ThemedText>
            <Ionicons name="school" size={16} className="ml-2" />
            <ThemedText className="font-bold text-sm">
              {" "}
              {user?.university}
            </ThemedText>
          </ThemedText>

          {user?.bio && <ThemedText>Bio: {user.bio}</ThemedText>}
          <View className="flex-row gap-5">
            <Pressable className="flex-row gap-1 items-center">
              <ThemedText>Followers</ThemedText>
              <ThemedText className="font-bold text-xl">
                {" "}
                {followersData?.length}
              </ThemedText>
            </Pressable>
            <Pressable className="flex-row gap-1 items-center">
              <ThemedText>Following</ThemedText>
              <ThemedText className="font-bold text-xl">
                {" "}
                {followingData?.length}
              </ThemedText>
            </Pressable>
          </View>
          <View className="flex-row gap-5 h-10 w-20 border">
            <Pressable
              className={
                isFollowingData
                  ? "btn-remove items-center gap-2"
                  : "btn items-center gap-2"
              }
              onPress={() => {
                isFollowingData ? unfollowUser() : followUser();
              }}
            >
              <Ionicons
                name={isFollowingData ? "remove" : "add"}
                size={20}
                className="ml-2"
                color={"#fff"}
              />
              <ThemedText>{isFollowingData ? "Unfollow" : "Follow"}</ThemedText>
            </Pressable>

            <Pressable
              className="btn items-center gap-2"
              onPress={() => {
                console.log("TO MESSAGES");
              }}
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={20}
                color={"#fff"}
              />
              <ThemedText>Message</ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
      <ThemedText className="text-2xl font-bold px-5">Posts</ThemedText>
      <PostsContainer posts={userPosts} />
    </ThemedView>
  );
};

export default UserProfile;
