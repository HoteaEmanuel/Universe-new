import { View, Text, Image, Pressable, ActivityIndicator } from "react-native";
import React from "react";
import ThemedView from "./ThemedView";
import ThemedText from "./ThemedText";
import { getUserFullName } from "../utils/user/getUserFullName";
import { router } from "expo-router";
import { useAuthStore } from "../store/authStore";
import { useGetUserByIdQuery } from "../queryAndMutation/queries/user-queries";
const ProfileCard = ({ userId, ...props }) => {
  const { user } = useAuthStore();
  console.log("USER ID : " + userId);
  const { data: creator, isPending } = useGetUserByIdQuery(userId);
  if (isPending)
    return (
      <ThemedView safe={true}>
        <ActivityIndicator size="large" color={"#000"} />
      </ThemedView>
    );
  return (
    <View
      safe={true}
      fullHeight={false}
      className="flex-row items-center h-10"
      {...props}
    >
      <Pressable
        onPress={() => {
          user.id !== creator.id
            ? router.push(`/profile/${creator.id}`)
            : router.push("/profile");
        }}
        className="w-10 h-10"
      >
        <Image
          source={{ uri: creator.profilePicture }}
          className="w-10 h-10 rounded-full"
        />
      </Pressable>

      <ThemedText className="p-2 w-full h-10 m-0 font-semibold">
        {getUserFullName(creator)}
      </ThemedText>
    </View>
  );
};

export default ProfileCard;
