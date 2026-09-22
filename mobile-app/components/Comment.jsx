import { View, Text } from "react-native";
import React from "react";
import ThemedText from "./ThemedText";
import ThemedView from "./ThemedView";
import ProfileCard from "./ProfileCard";
import { useGetUserByIdQuery } from "../queryAndMutation/queries/user-queries";
import { Image, ActivityIndicator } from "react-native";
import { getUserFullName } from "../utils/user/getUserFullName";
const Comment = ({ comment }) => {
  console.log("COMMENT HERE: ", comment);
  const { data: creator, isPending } = useGetUserByIdQuery(comment.userId);
  if (isPending)
    return (
      <ThemedView safe={true}>
        <ActivityIndicator size="large" color={"#000"} />
      </ThemedView>
    );

  return (
    <View className="flex-row items-center gap-2">
      <Image
        source={{ uri: creator.profilePicture }}
        className="w-10 h-10 rounded-full"
      />
      <View>
        <ThemedText className="font-semibold">
          {getUserFullName(creator)}
        </ThemedText>
        <ThemedText className="text-sm">{comment.text}</ThemedText>
      </View>
    </View>
  );
};

export default Comment;
