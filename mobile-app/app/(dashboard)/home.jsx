import { View } from "react-native";
import React from "react";
import ThemedView from "../../components/ThemedView";
import ThemedText from "../../components/ThemedText";
import { FlatList } from "react-native";
import { useGetPostsInfiniteQuery } from "../../queryAndMutation/queries/post-queries";
import ThemedPostCard from "../../components/ThemedPostCard";
const Home = () => {
  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useGetPostsInfiniteQuery("Global");
  const posts = data?.pages.flatMap((page) => page.posts) ?? [];
  if (isLoading)
    return (
      <ThemedView safe={true} className="flex-1 items-center justify-center">
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  return (
    <ThemedView safe={true}>
      <ThemedText className="text-xl font-bold p-2 capitalize">home</ThemedText>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        renderItem={({ item }) => (
          <View style={{ flex: 1, marginBottom: 50, paddingHorizontal: 8 }}>
            <ThemedPostCard post={item} personal={false} />
          </View>
        )}
      />
    </ThemedView>
  );
};

export default Home;
