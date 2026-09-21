import { View, Text, ScrollViewBase, ScrollView } from "react-native";
import React, { Activity } from "react";
import ThemedView from "../../../components/ThemedView";
import { Image } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useGetPostQuery } from "../../../queryAndMutation/queries/post-queries";
import { useGetLikesQuery } from "../../../queryAndMutation/queries/post-queries";
import { usePostLikedQuery } from "../../../queryAndMutation/queries/post-queries";
import { useGetPostCommentsCount } from "../../../queryAndMutation/queries/comments-queries";
import ThemedText from "../../../components/ThemedText";
import { Ionicons } from "@expo/vector-icons";
import { useLikeMutation } from "../../../queryAndMutation/mutations/post-mutation";
import { useUnlikeMutation } from "../../../queryAndMutation/mutations/post-mutation";
import { Colors } from "../../../constants/colors";
import { useColorScheme } from "react-native";
import { TouchableOpacity } from "react-native";
import { Pressable } from "react-native";
import { ActivityIndicator } from "react-native";
import ImageSlider from "../../../components/ImageSlider";
const PostDetails = () => {
  const { id } = useLocalSearchParams();

  const { data: post, isLoading } = useGetPostQuery(id);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] || Colors.light;

  const { data: likes, isLoading: likesLoading } = useGetLikesQuery(id);

  const { data: liked, isLoading: likedLoading } = usePostLikedQuery(id);
  const { data: comments, isLoading: commentsLoading } =
    useGetPostCommentsCount(id);

  const { mutate: likePost } = useLikeMutation(id);
  const { mutate: unlikePost } = useUnlikeMutation(id);
  if (isLoading || commentsLoading || likedLoading)
    return (
      <ThemedView safe={true} className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={Colors.primary} />
      </ThemedView>
    );
  if (isLoading)
    return (
      <ThemedView safe={true}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </ThemedView>
    );
  console.log("POST ID :L ");
  console.log(id);
  console.log("POST: ");
  console.log(post?.imagesUrls);
  return (
    <ThemedView safe={true} className="min-h-screen">
      {post?.imagesUrls && (
        <ImageSlider images={post.imagesUrls} style={{ height: 300 }} />
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
              e.stopPropagation();
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
            router.push(`comments/${id}`);
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
      {post?.title && (
        <ThemedText className="text-2xl font-bold p-4">{post.title}</ThemedText>
      )}
      {post?.caption && (
        <ThemedText className="p-4 text-lg">{post.caption}</ThemedText>
      )}
    </ThemedView>
  );
};

export default PostDetails;
