import { View, Text, ScrollView } from "react-native";
import React from "react";
import ThemedView from "../../components/ThemedView";
import ThemedText from "../../components/ThemedText";
import { Link } from "expo-router";
import { FlatList } from "react-native";
import { useGetPostsQuery } from "../../queryAndMutation/queries/post-queries";
import ThemedPostCard from "../../components/ThemedPostCard";
const Home = () => {
  const { data: posts, isLoading, error } = useGetPostsQuery("Global");
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
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={{ flex: 1, marginBottom:50, paddingHorizontal: 8 }}>
            <ThemedPostCard post={item} personal={false} />
          </View>
        )}
      />
    </ThemedView>
  );
};

export default Home;
