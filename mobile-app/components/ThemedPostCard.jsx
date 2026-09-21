import {
  View,
  Text,
  Image,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
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
import ProfileCard from "./ProfileCard";
import Spacer from "./Spacer";
import ImageSlider from "./ImageSlider";
const ThemedPostCard = ({ post, personal, style }) => {
  const colorScheme = useColorScheme();

  const theme = Colors[colorScheme] || Colors.light;
  console.log("POST : ");
  const { data: likes, isLoading } = useGetLikesQuery(post._id);

  const { data: liked, isLoading: likedLoading } = usePostLikedQuery(post._id);

  const { data: comments, isLoading: commentsLoading } =
    useGetPostCommentsCount(post._id);

  const { mutate: likePost } = useLikeMutation(post._id);
  const { mutate: unlikePost } = useUnlikeMutation(post._id);
  if (isLoading || commentsLoading || likedLoading)
    return (
      <ThemedView safe={true} className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={Colors.primary} />
      </ThemedView>
    );

  console.log("POST IS LIKED : " + liked);
  return (
    <TouchableOpacity
      onPress={() => router.push(`/post-details/${post._id}`)}
      className="w-full  rounded-2xl overflow-hidden p-3 border border-gray-800"
      style={[
        {
          height: post?.imageUrl ? 400 : 300, // ← Height fix în pixeli
        },
        style,
      ]}
    >
      <ThemedView safe={true} className="w-full h-full rounded-2xl">
        <View
          className="w-full  rounded-2xl border border-gray-700"
          // style={{ borderColor: theme.borderColor }}
        >
          {post?.imagesUrls.length == 1 && (
            <Image
              source={{ uri: post.imagesUrls[0] }}
              className="h-[60%] w-full rounded-t-2xl"
            />
          )}
          {post?.imagesUrls.length > 1 && (
            <ImageSlider images={post.imagesUrls} />
          )}
          <Spacer height={5} />
          {personal === false && (
            <View className="w-full h-10 p-1">
              <ProfileCard
                userId={post.userId}
                postId={post._id}
                key={`${post._id}-profile`}
              />
            </View>
          )}

          {post.title && (
            <ThemedText className="text-lg text-gray-500 p-2 font-bold">
              {post.title}
            </ThemedText>
          )}
          {post.caption && (
            <ThemedText className="p-2 text-xs flex-row">
              {post.caption.substr(0, 100) +
                (post.caption.length > 100 ? "..." : "")}
            </ThemedText>
          )}
          <View className="flex-row items-center gap-2 p-1">
            {liked ? (
              <TouchableOpacity
                onPress={async (e) => {
                  // e.stopPropagation();
                  unlikePost({ postId: post._id });
                }}
              >
                <Ionicons
                  name="heart"
                  size={20}
                  style={{ color: theme.iconColour }}
                />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={async (e) => {
                  console.log("BTN PRESSED");
                  likePost({ postId: post._id });
                }}
              >
                <Ionicons
                  name="heart-outline"
                  size={20}
                  color={theme.iconColour}
                  className="text-red-500"
                />
              </TouchableOpacity>
            )}
            <ThemedText className="text-sm font-bold">{likes}</ThemedText>
            <TouchableOpacity
              onPress={() => {
                console.log("TO COMMENTS");
                router.push(`comments/${post._id}`);
              }}
              className="flex-row items-center gap-2"
            >
              <Ionicons
                name="chatbubble-outline"
                size={20}
                style={{ color: theme.iconColour }}
              />
              <ThemedText className="text-sm font-bold">{comments}</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </ThemedView>
    </TouchableOpacity>
  );
};

export default ThemedPostCard;
