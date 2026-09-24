import { useState } from "react";
import { View, Text, FlatList, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Defs, RadialGradient, Stop, Circle } from "react-native-svg";
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
import MessageIllustration from "@components/chat/MessageIllustration";
import { useAppColorScheme } from "@hooks/useAppColorScheme";
import { useHideTabBarOnScroll } from "@hooks/useHideTabBarOnScroll";

const SKELETON_ROWS = 6;
const HEADER_ART_HEIGHT = 170;

// Scattered, scrambled-looking reaction emoji — deliberately irregular
// position/size/rotation per item (not a grid) so it reads as a messy
// sticker scatter behind the header rather than a tidy pattern.
const EMOJI_SCATTER: { emoji: string; top: number; left: number; size: number; rotate: number }[] = [
  { emoji: "😂", top: 12, left: 0.1, size: 20, rotate: -16 },
  { emoji: "🔥", top: 46, left: 0.72, size: 24, rotate: 14 },
  { emoji: "❤️", top: 4, left: 0.4, size: 16, rotate: 6 },
  { emoji: "👍", top: 92, left: 0.06, size: 18, rotate: -12 },
  { emoji: "💬", top: 74, left: 0.55, size: 22, rotate: 18 },
  { emoji: "😮", top: 26, left: 0.9, size: 16, rotate: -20 },
  { emoji: "🎉", top: 108, left: 0.32, size: 18, rotate: 24 },
  { emoji: "😢", top: 56, left: 0.2, size: 14, rotate: -8 },
  { emoji: "👀", top: 8, left: 0.62, size: 15, rotate: 10 },
];

// Ambient brand glow behind the "Messages" title/search bar — two soft
// radial washes bleeding off the top corners (dark mode only; on the light
// background they read as a flat violet smear rather than a glow), a small
// outline chat bubble faded into the top-right corner so the mark reads as
// "messages", and a scatter of low-opacity reaction emoji for a messy,
// lived-in feel. Sized in real pixels from useWindowDimensions rather than
// percentages, matching AuthHeroHeader's fix for percentage-sized Svg not
// tracking parent layout.
const ChatHeaderArt = () => {
  const colorScheme = useAppColorScheme();
  const { width } = useWindowDimensions();
  const isLight = colorScheme === "light";

  return (
    <View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, width, height: HEADER_ART_HEIGHT }}>
      {isLight ? null : (
        <Svg width={width} height={HEADER_ART_HEIGHT} style={{ position: "absolute" }}>
          <Defs>
            <RadialGradient id="chatGlowTL" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={Colors.primary} stopOpacity={0.34} />
              <Stop offset="1" stopColor={Colors.primary} stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id="chatGlowTR" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={Colors.primary} stopOpacity={0.26} />
              <Stop offset="1" stopColor={Colors.primary} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={-30} cy={-10} r={150} fill="url(#chatGlowTL)" />
          <Circle cx={width + 10} cy={20} r={110} fill="url(#chatGlowTR)" />
        </Svg>
      )}
      <Ionicons
        name="chatbubble-ellipses"
        size={34}
        color={Colors.primary}
        style={{
          position: "absolute",
          top: 12,
          right: 20,
          opacity: isLight ? 0.18 : 0.24,
          transform: [{ rotate: "-10deg" }],
        }}
      />
      {EMOJI_SCATTER.map((item, index) => (
        <Text
          key={index}
          style={{
            position: "absolute",
            top: item.top,
            left: item.left * width,
            fontSize: item.size,
            opacity: isLight ? 0.16 : 0.22,
            transform: [{ rotate: `${item.rotate}deg` }],
          }}
        >
          {item.emoji}
        </Text>
      ))}
    </View>
  );
};

// "No conversations yet" state — flat vector paper-airplane mark (same one
// as the conversation thread's own empty state) instead of an illustration
// asset, so the two screens' "nothing here" moments feel like one family.
const ChatEmptyState = () => {
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;

  return (
    <View className="w-full items-center gap-5 px-8 pt-10">
      <MessageIllustration size={112} />

      <View className="items-center gap-1.5">
        <Text className="text-center text-base font-semibold" style={{ color: theme.title }}>
          No messages yet
        </Text>
        <Text className="text-center text-sm" style={{ color: theme.tabIconColour }}>
          Start a conversation and it'll show up here.
        </Text>
      </View>
    </View>
  );
};

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
      <View style={{ overflow: "hidden" }}>
        <ChatHeaderArt />
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
          ) : debouncedSearch.trim() ? (
            <ThemedText className="pt-10 text-center text-sm">No results</ThemedText>
          ) : (
            <ChatEmptyState />
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
