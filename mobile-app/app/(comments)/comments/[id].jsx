import { View, Text, ActivityIndicator, FlatList } from "react-native";
import React from "react";
import { useLocalSearchParams } from "expo-router";
import ThemedView from "../../../components/ThemedView";
import ThemedText from "../../../components/ThemedText";
import { useGetPostComments } from "../../../queryAndMutation/queries/comments-queries";
import { Colors } from "../../../constants/colors";
import Comment from "../../../components/Comment";
import ThemedPostCard from "../../../components/ThemedPostCard";
const Comments = () => {
  const { id } = useLocalSearchParams();
  const { data: comments, isLoading } = useGetPostComments(id);
  if (isLoading)
    return (
      <ThemedView safe={true} className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={Colors.primary} />
      </ThemedView>
    );

  console.log("POST COMMENTS: ", comments);
  return (
    <ThemedView safe={true} className="flex-1 min-h-screen">
      <ThemedText className="text-lg font-bold p-2">Comments</ThemedText>
      <FlatList
        data={comments}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={{ flex: 1, padding: 8 }}>
            {/* <ThemedPostCard post={item} personal={true} /> */}
            <Comment comment={item} />
          </View>
        )}
      />
    </ThemedView>
  );
};

export default Comments;
