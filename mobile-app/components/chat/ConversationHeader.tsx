import { useEffect, useState } from "react";
import { View, Text, Image, TextInput, ActivityIndicator, Pressable } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { createConversationsApi, createGroupsApi } from "@universe/shared/api";
import type { ChatMessage } from "@universe/shared";
import { useSearchConvoMessages } from "@queryAndMutation/queries/conversation-queries";
import { useSearchGroupMessages } from "@queryAndMutation/queries/group-queries";
import { Colors } from "@constants/colors";
import { IconSizes } from "@constants/iconSizes";
import { PressableScale } from "@lib/styled";
import { httpClient } from "@lib/http";
import ActionSheetModal from "@components/ActionSheetModal";
import { getAvatarColor, getInitials } from "@utils/chatAvatarColor";
import { useDebounce } from "@hooks/useDebounce";
import { useAppColorScheme } from "@hooks/useAppColorScheme";

const HEADER_AVATAR_SIZE = 36;

// Imperative, not hooked through react-query — the up/down match arrows fire
// one-off context fetches from a button press, not something a rendered
// query should own. Same instantiate-once-at-module-scope pattern the
// mutation files use for their api instances.
const conversationsApi = createConversationsApi(httpClient);
const groupsApi = createGroupsApi(httpClient);

export type MessageJumpPayload = {
  messages: ChatMessage[];
  hasOlder: boolean;
  olderCursor: string | null;
  targetId: string;
};

type ConversationHeaderProps = {
  id: string;
  isGroup: boolean;
  headerTitle: string;
  headerAvatarSrc?: string;
  isPendingHeader: boolean;
  onJump: (payload: MessageJumpPayload) => void;
};

// Owns the header's own local UI state (3-dot menu, search text, match
// navigation) so typing in the search box or opening the quick-actions menu
// only re-renders this component, not the whole message thread above it —
// only an actual jump (via onJump) touches the parent's state.
const ConversationHeader = ({
  id,
  isGroup,
  headerTitle,
  headerAvatarSrc,
  isPendingHeader,
  onJump,
}: ConversationHeaderProps) => {
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;

  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 350);
  const [matchIndex, setMatchIndex] = useState<number | null>(null);

  const { data: convoResults, isFetching: isFetchingConvo } = useSearchConvoMessages(
    !isGroup && searchOpen ? id : undefined,
    debouncedSearchQuery,
  );
  const { data: groupResults, isFetching: isFetchingGroup } = useSearchGroupMessages(
    isGroup && searchOpen ? id : undefined,
    debouncedSearchQuery,
  );
  const searchResults = isGroup ? groupResults : convoResults;
  const matches = searchResults?.messages ?? [];
  const isSearching = isGroup ? isFetchingGroup : isFetchingConvo;

  // A fresh result set selects its most recent match first (closest to
  // live) — the up/down arrows then step further back/forward from there,
  // WhatsApp-style.
  useEffect(() => {
    setMatchIndex(
      searchResults && searchResults.messages.length > 0 ? searchResults.messages.length - 1 : null,
    );
  }, [searchResults]);

  const currentMatchId = matchIndex !== null ? matches[matchIndex]?.id : undefined;

  useEffect(() => {
    if (!currentMatchId) return;
    let cancelled = false;
    (async () => {
      const context = isGroup
        ? await groupsApi.getMessageContext(id, currentMatchId)
        : await conversationsApi.getMessageContext(id, currentMatchId);
      if (cancelled || !context) return;
      onJump({
        messages: context.messages,
        hasOlder: context.hasOlder,
        olderCursor: context.olderCursor,
        targetId: currentMatchId,
      });
    })();
    return () => {
      cancelled = true;
    };
    // Only the target message id should retrigger this - id/isGroup/onJump
    // are stable for the screen's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMatchId]);

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery("");
  };

  const canGoOlder = matchIndex !== null && matchIndex > 0;
  const canGoNewer = matchIndex !== null && matchIndex < matches.length - 1;

  if (searchOpen) {
    return (
      <View
        className="flex-row items-center gap-2 px-4 pb-3 pt-2"
        style={{ borderBottomWidth: 1, borderBottomColor: theme.borderColor }}
      >
        <Pressable onPress={closeSearch} hitSlop={8}>
          <Ionicons name="close" size={IconSizes.xl} color={theme.iconMuted} />
        </Pressable>
        <TextInput
          autoFocus
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search in conversation"
          placeholderTextColor={theme.tabIconColour}
          className="flex-1 text-sm"
          style={{ color: theme.title }}
        />
        {isSearching ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : (
          <Text className="text-xs" style={{ color: theme.tabIconColour }}>
            {matches.length > 0 && matchIndex !== null
              ? `${matchIndex + 1}/${matches.length}`
              : debouncedSearchQuery.trim().length >= 2
                ? "0/0"
                : ""}
          </Text>
        )}
        <Pressable
          onPress={() => setMatchIndex((current) => (current !== null ? Math.max(0, current - 1) : current))}
          disabled={!canGoOlder}
          hitSlop={8}
        >
          <Ionicons name="chevron-up" size={IconSizes.md} color={canGoOlder ? theme.iconMuted : theme.borderColor} />
        </Pressable>
        <Pressable
          onPress={() =>
            setMatchIndex((current) => (current !== null ? Math.min(matches.length - 1, current + 1) : current))
          }
          disabled={!canGoNewer}
          hitSlop={8}
        >
          <Ionicons
            name="chevron-down"
            size={IconSizes.md}
            color={canGoNewer ? theme.iconMuted : theme.borderColor}
          />
        </Pressable>
      </View>
    );
  }

  return (
    <View
      className="flex-row items-center gap-3 px-4 pb-3 pt-2"
      style={{ borderBottomWidth: 1, borderBottomColor: theme.borderColor }}
    >
      <PressableScale onPress={() => router.back()} hitSlop={8}>
        <Ionicons name="chevron-back" size={IconSizes.xl} color={theme.iconMuted} />
      </PressableScale>

      <Pressable
        className="flex-1 flex-row items-center gap-3"
        disabled={isPendingHeader}
        onPress={() =>
          router.push({
            pathname: "/(chat)/details/[id]",
            params: { id, title: headerTitle, isGroup: isGroup ? "1" : "" },
          })
        }
      >
        {isPendingHeader ? (
          <View
            style={{
              width: HEADER_AVATAR_SIZE,
              height: HEADER_AVATAR_SIZE,
              borderRadius: HEADER_AVATAR_SIZE / 2,
              backgroundColor: theme.uiBackground,
            }}
          />
        ) : headerAvatarSrc ? (
          <Image
            source={{ uri: headerAvatarSrc }}
            style={{
              width: HEADER_AVATAR_SIZE,
              height: HEADER_AVATAR_SIZE,
              borderRadius: HEADER_AVATAR_SIZE / 2,
            }}
          />
        ) : (
          <View
            className="items-center justify-center rounded-full"
            style={{
              width: HEADER_AVATAR_SIZE,
              height: HEADER_AVATAR_SIZE,
              backgroundColor: getAvatarColor(id),
            }}
          >
            <Text className="text-xs font-semibold" style={{ color: "#ffffff" }}>
              {getInitials(headerTitle || "?")}
            </Text>
          </View>
        )}

        <Text className="flex-1 text-base font-bold" style={{ color: theme.title }} numberOfLines={1}>
          {headerTitle}
        </Text>
      </Pressable>

      <PressableScale onPress={() => setActionSheetOpen(true)} hitSlop={8}>
        <Ionicons name="ellipsis-vertical" size={IconSizes.lg} color={theme.iconMuted} />
      </PressableScale>

      <ActionSheetModal
        visible={actionSheetOpen}
        onClose={() => setActionSheetOpen(false)}
        items={[
          {
            key: "search",
            label: "Search in conversation",
            icon: "search-outline",
            onPress: () => setSearchOpen(true),
          },
        ]}
      />
    </View>
  );
};

export default ConversationHeader;
