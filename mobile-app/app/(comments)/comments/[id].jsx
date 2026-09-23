import { View, ActivityIndicator, FlatList } from "react-native";
import React from "react";
import { useLocalSearchParams } from "expo-router";
import ThemedView from "../../../components/ThemedView";
import ThemedText from "../../../components/ThemedText";
import { useGetPostCommentsInfinite } from "../../../queryAndMutation/queries/comments-queries";
import { Colors } from "../../../constants/colors";
import Comment from "../../../components/comments/Comment";
const Comments = () => {
  const { id } = useLocalSearchParams();
  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useGetPostCommentsInfinite(id);
  const comments = data?.pages.flatMap((page) => page.comments) ?? [];
  if (isLoading)
    return (
      <ThemedView safe={true} className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={Colors.primary} />
      </ThemedView>
    );

  return (
    <ThemedView safe={true} className="flex-1 min-h-screen">
      <ThemedText className="text-lg font-bold p-2">Comments</ThemedText>
      <FlatList
        data={comments}
        keyExtractor={(item) => item.id}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        renderItem={({ item }) => (
          <View style={{ flex: 1, padding: 8 }}>
            <Comment comment={item} postId={id} />
          </View>
        )}
      />
    </ThemedView>
  );
};

export default Comments;
