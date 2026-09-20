import { View, Text, Image, Pressable, TouchableOpacity } from "react-native";
import React, { useState } from "react";
import ThemedView from "./ThemedView";
import ThemedText from "./ThemedText";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useGetLikesQuery } from "../queryAndMutation/queries/post-queries";
import { useGetPostCommentsCount } from "../queryAndMutation/queries/comments-queries";
import { usePostLikedQuery } from "../queryAndMutation/queries/post-queries";
import { useLikeMutation } from "../queryAndMutation/mutations/post-mutation";
import { useUnlikeMutation } from "../queryAndMutation/mutations/post-mutation";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/colors";
import { useColorScheme } from "react-native";
const ThemedPostCard = (item) => {
  const colorScheme = useColorScheme();

  const theme = Colors[colorScheme] || Colors.light;
  console.log("POST : ");
  const { data: likes, isLoading } = useGetLikesQuery(item.post._id);

  const { data: liked, isLoading: likedLoading } = usePostLikedQuery(
    item.post._id,
  );

  const { data: comments, isLoading: commentsLoading } =
    useGetPostCommentsCount(item.post._id);

  const { mutate: likePost } = useLikeMutation(item.post._id);
  const { mutate: unlikePost } = useUnlikeMutation(item.post._id);
  if (isLoading || commentsLoading || likedLoading)
    return (
      <ThemedView safe={true} className="flex-1 items-center justify-center">
        <Text>Loading...</Text>
      </ThemedView>
    );

  console.log("POST IS LIKED : " + liked);
  return (
    <TouchableOpacity
      onPress={() => router.push(`/post-details/${item.post._id}`)}
      className="w-full h-[50vh] "
    >
      <ThemedView safe={true} className="w-full h-full ">
        <View
          className="w-full h-full rounded-2xl border-x border-b border-t-0 border-gray-800"
          style={{ borderColor: theme.borderColor }}
        >
          <Image
            source={{ uri: item.post.imageUrl }}
            className="h-[80%] w-full rounded-t-2xl"
          />
          <View className="flex-row items-center gap-2 p-1">
            {liked ? (
              <TouchableOpacity
                onPress={async (e) => {
                  // e.stopPropagation();
                  unlikePost({ postId: item.post._id });
                  setPostLiked(false);
                }}
              >
                <Ionicons
                  name="heart"
                  size={20}
                  style={{ color: theme.iconColour }}
                />
              </TouchableOpacity>
            ) : (
              <Pressable
                onPress={async (e) => {
                  console.log("BTN PRESSED");
                  e.stopPropagation();
                  likePost({ postId: item.post._id });
                  setPostLiked(true);
                }}
              >
                <Ionicons
                  name="heart-outline"
                  size={20}
                  color={theme.iconColour}
                  className="text-red-500"
                />
              </Pressable>
            )}
            <ThemedText className="text-sm font-bold">{likes}</ThemedText>
            <Ionicons
              name="chatbubble-outline"
              size={20}
              style={{ color: theme.iconColour }}
            />
            <ThemedText className="text-sm font-bold">{comments}</ThemedText>
          </View>
          <ThemedText className="p-2 text-xs flex-row">
            {item.post.caption.substr(0, 50) +
              (item.post.caption.length > 50 ? "..." : "")}
          </ThemedText>
        </View>
      </ThemedView>
    </TouchableOpacity>
  );
};

export default ThemedPostCard;
