import { View, Text, Pressable, FlatList, ScrollView } from "react-native";
import React from "react";
import ThemedView from "../../components/ThemedView";
import { useAuthStore } from "../../store/authStore";
import ThemedText from "../../components/ThemedText";
import { Image } from "react-native";
import { Link } from "expo-router";
import { getUserFullName } from "../../utils/user/getUserFullName";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/colors";
import {
  useGetFollowersQuery,
  useGetFollowingQuery,
} from "../../queryAndMutation/queries/user-queries.js";
import "../../global.css";
import { ActivityIndicator } from "react-native";
import { useGetUserPostsQuery } from "../../queryAndMutation/queries/post-queries.js";
import ThemedPostCard from "../../components/ThemedPostCard.jsx";
import { SafeAreaView } from "react-native-safe-area-context";
import PostsContainer from "../../components/PostsContainer.jsx";
const Profile = () => {
  const { user } = useAuthStore();
  const { data: followersData, isLoading: followersLoading } =
    useGetFollowersQuery(user?._id);
  const { data: followingData, isLoading: followingLoading } =
    useGetFollowingQuery(user?._id);

  const { data: userPostsData, isLoading: userPostsLoading } =
    useGetUserPostsQuery(user?._id);
  if (followersLoading || followingLoading || userPostsLoading) {
    return (
      <ThemedView safe={true} className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={Colors.primary} />
      </ThemedView>
    );
  }
  return (
    <ThemedView safe={true}>
      <Ionicons
        name="menu-outline"
        size={24}
        color={"#fff"}
        className="absolute top-10 right-5"
        onPress={() => {}}
      />
      <View className="flex-row p-10 mt-10">
        {" "}
        <Image
          source={{ uri: user?.profilePicture }}
          style={{ width: 100, height: 100, borderRadius: 50 }}
        />
        <View className="p-2 gap-2">
          <ThemedText className="text-2xl font-bold">
            {getUserFullName(user)}
          </ThemedText>
          <ThemedText>
            <Ionicons name="school" size={16} className="ml-2" />
            <ThemedText className="font-bold"> {user?.university}</ThemedText>
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
        </View>
      </View>

      <View>
        <View>
          <ThemedText className="text-2xl font-bold px-5">My Posts</ThemedText>
        </View>
        <PostsContainer posts={userPostsData} />
      </View>
    </ThemedView>
  );
};

export default Profile;

const postsContainer = {
  display: "flex",
  flexDirection: "row",
  width: "95%",
  // flexWrap: "wrap",
  gap: 16,
  gridTemplateColumns: "repeat(2, 1fr)",
  paddingHorizontal: 8,
};
