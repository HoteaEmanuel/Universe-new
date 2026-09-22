import { View, Text } from "react-native";
import React from "react";
import { FlatList } from "react-native";
import ThemedPostCard from "./ThemedPostCard";
import ThemedText from "./ThemedText";
import ThemedView from "./ThemedView";
const PostsContainer = ({posts}) => {
  return (
    <FlatList
      data={posts}
      numColumns={2}
      direction="column"
      columnWrapperStyle={{
        gap: 16,
        paddingHorizontal: 8,
      }}
      contentContainerStyle={{
        gap: 16,
        paddingVertical: 8,
      }}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={{ flex: 1 }}>
          <ThemedPostCard post={item} personal={true} />
        </View>
      )}
    />
  );
};

export default PostsContainer;
