import { FlatList, RefreshControl } from "react-native";
import ThemedView from "../../components/ThemedView";
import ThemedText from "../../components/ThemedText";
import { useGetPostsInfiniteQuery } from "../../queryAndMutation/queries/post-queries";
import PostCard from "../../components/post/PostCard";
import { Colors } from "../../constants/colors";
import { useHideTabBarOnScroll } from "@hooks/useHideTabBarOnScroll";

const Home = () => {
  const handleTabBarScroll = useHideTabBarOnScroll();
  const {
    data,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useGetPostsInfiniteQuery("Global");
  const posts = data?.pages.flatMap((page) => page.posts) ?? [];

  if (isLoading)
    return (
      <ThemedView safe className="flex-1 items-center justify-center">
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );

  return (
    <ThemedView safe>
      <ThemedText className="p-2 text-xl font-bold capitalize">home</ThemedText>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        onScroll={handleTabBarScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ gap: 12, padding: 16 }}
        renderItem={({ item }) => <PostCard post={item} />}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />
        }
      />
    </ThemedView>
  );
};

export default Home;
