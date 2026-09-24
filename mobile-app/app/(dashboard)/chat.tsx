import { useState } from "react";
import { View, Text, FlatList } from "react-native";
import { router } from "expo-router";
import type { ConversationListEntry } from "@universe/shared";
import { useAuthStore } from "@store/authStore";
import { useMergedConversationFeed } from "@hooks/useMergedConversationFeed";
import { useDebounce } from "@hooks/useDebounce";
import { Colors } from "@constants/colors";
import ThemedView from "@components/ThemedView";
import ThemedText from "@components/ThemedText";
import SearchInput from "@components/SearchInput";
import ConversationRow from "@components/chat/ConversationRow";
import ChatRowSkeleton from "@components/chat/ChatRowSkeleton";
import { useAppColorScheme } from "@hooks/useAppColorScheme";
import { useHideTabBarOnScroll } from "@hooks/useHideTabBarOnScroll";

const SKELETON_ROWS = 6;

const ChatScreen = () => {
  const handleTabBarScroll = useHideTabBarOnScroll();
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;
  const currentUserId = useAuthStore((state) => state.user?.id);
  const onlineUsers = useAuthStore((state) => state.onlineUsers);

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 350);

  const { items, isPending, hasMore, isFetchingNextPage, fetchNextPage } =
    useMergedConversationFeed(currentUserId, debouncedSearch.trim());

  const goToEntry = (entry: ConversationListEntry) => {
    const isGroup = !!entry.name;
    router.push({
      pathname: "/(chat)/conversation/[id]",
      params: {
        id: entry.id,
        title: isGroup ? entry.name : undefined,
        isGroup: isGroup ? "1" : "",
      },
    });
  };

  return (
    <ThemedView safe fullHeight style={{ paddingBottom: 0 }}>
      <View className="px-4 pt-10">
        <Text className="pb-4 text-2xl font-bold" style={{ color: theme.title }}>
          Messages
        </Text>
        <SearchInput
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="Search contacts or groups"
        />
      </View>

      <FlatList<ConversationListEntry>
        className="flex-1"
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ConversationRow
            entry={item}
            currentUserId={currentUserId ?? ""}
            isOnline={!item.name && !!item.user && onlineUsers.includes(item.user.id)}
            onPress={() => goToEntry(item)}
          />
        )}
        ListEmptyComponent={
          isPending ? (
            <View>
              {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                <ChatRowSkeleton key={i} />
              ))}
            </View>
          ) : (
            <ThemedText className="pt-10 text-center text-sm">
              {debouncedSearch.trim() ? "No results" : "No conversations yet"}
            </ThemedText>
          )
        }
        ListFooterComponent={isFetchingNextPage ? <ChatRowSkeleton /> : null}
        onEndReached={() => {
          if (hasMore && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        onScroll={handleTabBarScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
      />
    </ThemedView>
  );
};

export default ChatScreen;
