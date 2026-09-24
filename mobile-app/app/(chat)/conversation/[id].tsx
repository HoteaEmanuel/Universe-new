import { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Platform,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { KeyboardAvoidingView, useKeyboardState } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getFullName, type ChatMessage } from "@universe/shared";
import { conversationKeys, groupKeys } from "@universe/shared/queries";
import { createConversationsApi, createGroupsApi } from "@universe/shared/api";
import { useAuthStore } from "@store/authStore";
import {
  useGetConvoMessagesInfinite,
  useGetUserByConvoId,
} from "@queryAndMutation/queries/conversation-queries";
import { useMarkConversationReadMutation } from "@queryAndMutation/mutations/conversation-mutation";
import { useGetGroupById, useGetGroupMessagesInfinite } from "@queryAndMutation/queries/group-queries";
import { Colors } from "@constants/colors";
import { IconSizes } from "@constants/iconSizes";
import { PressableScale } from "@lib/styled";
import { httpClient } from "@lib/http";
import ThemedView from "@components/ThemedView";
import ConversationEmptyState from "@components/chat/ConversationEmptyState";
import MessageBubble from "@components/chat/MessageBubble";
import MessageInput from "@components/chat/MessageInput";
import ConversationHeader, { type MessageJumpPayload } from "@components/chat/ConversationHeader";
import { dayKey, formatDaySeparator } from "@utils/chatMessageTime";
import { useAppColorScheme } from "@hooks/useAppColorScheme";

// Small breathing room between the input bar and the keyboard's top edge —
// otherwise the input sits flush against the keyboard when it's open.
const INPUT_KEYBOARD_GAP = 8;

// Imperative, not hooked through react-query - pagination while anchored to
// a jumped-to message reuses the plain paginated messages endpoint (see
// loadOlderAnchorMessages below), fired from a scroll callback rather than a
// rendered query. Same instantiate-once-at-module-scope pattern the
// mutation files use for their api instances.
const conversationsApi = createConversationsApi(httpClient);
const groupsApi = createGroupsApi(httpClient);

type DisplayMessage = ChatMessage & { showSender: boolean; highlighted: boolean };

type ThreadRow =
  | { kind: "separator"; id: string; label: string }
  | { kind: "message"; id: string; message: DisplayMessage };

// The big centered day label between messages — plain text, no chip, so it
// reads as a section break rather than another chat bubble.
const DaySeparator = ({ label }: { label: string }) => {
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;
  return (
    <View className="items-center py-4">
      <Text
        className="text-sm font-semibold"
        style={{ color: theme.tabIconColour }}
      >
        {label}
      </Text>
    </View>
  );
};


const ConversationThread = () => {
  const {
    id,
    title,
    isGroup: isGroupParam,
  } = useLocalSearchParams<{
    id: string;
    title?: string;
    isGroup?: string;
  }>();
  const isGroup = isGroupParam === "1";
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;
  const insets = useSafeAreaInsets();
  // The safe-area bottom inset only makes sense at rest (clearing the home
  // indicator) — once the keyboard is open it docks flush with the screen
  // bottom itself, so keeping that inset too was stacking on top of the
  // keyboard's own height and leaving a dead gap above it.
  const isKeyboardVisible = useKeyboardState((state) => state.isVisible);
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const socket = useAuthStore((state) => state.socket);
  const listRef = useRef<FlatList<ThreadRow>>(null);
  const scrollToBottom = () =>
    listRef.current?.scrollToOffset({ offset: 0, animated: true });

  const [anchor, setAnchor] = useState<{
    messages: ChatMessage[];
    olderCursor: string | null;
    hasOlder: boolean;
    isLoadingOlder: boolean;
    highlightedMessageId: string | null;
  } | null>(null);
  const [pendingScrollToBottom, setPendingScrollToBottom] = useState(false);
  const scrolledToHighlightRef = useRef<string | null>(null);

  const handleJump = ({ messages, hasOlder, olderCursor, targetId }: MessageJumpPayload) => {
    setAnchor({ messages, olderCursor, hasOlder, isLoadingOlder: false, highlightedMessageId: targetId });
  };

  const loadOlderAnchorMessages = async () => {
    if (!anchor || !anchor.hasOlder || !anchor.olderCursor || anchor.isLoadingOlder || !id) return;
    const cursor = anchor.olderCursor;
    setAnchor((prev) => (prev ? { ...prev, isLoadingOlder: true } : prev));
    try {
      const page = isGroup
        ? await groupsApi.listMessages(id, cursor)
        : await conversationsApi.listMessages(id, cursor);
      setAnchor((prev) =>
        prev
          ? {
              ...prev,
              messages: [...page.messages, ...prev.messages],
              olderCursor: page.nextCursor,
              hasOlder: page.hasMore,
              isLoadingOlder: false,
            }
          : prev,
      );
    } finally {
      setAnchor((prev) => (prev && prev.isLoadingOlder ? { ...prev, isLoadingOlder: false } : prev));
    }
  };

  const returnToLive = () => {
    if (anchor) {
      setAnchor(null);
      setPendingScrollToBottom(true);
    } else {
      scrollToBottom();
    }
  };

  useEffect(() => {
    if (pendingScrollToBottom && !anchor) {
      scrollToBottom();
      setPendingScrollToBottom(false);
    }
  }, [pendingScrollToBottom, anchor]);

  // Highlight fades on its own; the anchored view stays put until the
  // viewer explicitly returns to live via the floating button.
  useEffect(() => {
    if (!anchor?.highlightedMessageId) return;
    const timer = setTimeout(() => {
      setAnchor((prev) => (prev ? { ...prev, highlightedMessageId: null } : prev));
    }, 2200);
    return () => clearTimeout(timer);
  }, [anchor?.highlightedMessageId]);

  const { data: otherUser, isPending: isPendingUser } = useGetUserByConvoId(
    isGroup ? undefined : id,
  );
  const { data: group, isPending: isPendingGroup } = useGetGroupById(
    isGroup ? id : undefined,
  );

  const {
    data: convoPages,
    isPending: isPendingConvoMessages,
    hasNextPage: hasNextConvoPage,
    isFetchingNextPage: isFetchingNextConvoPage,
    fetchNextPage: fetchNextConvoPage,
  } = useGetConvoMessagesInfinite(isGroup ? undefined : id);
  const {
    data: groupPages,
    isPending: isPendingGroupMessages,
    hasNextPage: hasNextGroupPage,
    isFetchingNextPage: isFetchingNextGroupPage,
    fetchNextPage: fetchNextGroupPage,
  } = useGetGroupMessagesInfinite(isGroup ? id : undefined);

  const messagePages = isGroup ? groupPages : convoPages;
  const isPendingMessages = isGroup
    ? isPendingGroupMessages
    : isPendingConvoMessages;
  // While anchored, "load more" means "load older, from the anchor
  // window's own edge" instead of continuing the live infinite query.
  const hasNextPage = anchor ? anchor.hasOlder : isGroup ? hasNextGroupPage : hasNextConvoPage;
  const isFetchingNextPage = anchor
    ? anchor.isLoadingOlder
    : isGroup
      ? isFetchingNextGroupPage
      : isFetchingNextConvoPage;
  const fetchNextPage = anchor ? loadOlderAnchorMessages : isGroup ? fetchNextGroupPage : fetchNextConvoPage;
  const canSend = isGroup ? true : (convoPages?.pages[0]?.canSend ?? true);

  // Groups have no read-cursor support server-side yet — this only applies
  // to DMs, matching web's Conversation.tsx (which has no Group.tsx
  // equivalent for read tracking either).
  const { mutate: markConversationRead } = useMarkConversationReadMutation(
    isGroup ? undefined : id,
  );

  // Pages arrive newest-page-first, each page's own messages oldest→newest —
  // same shape web's Conversation.tsx/Group.tsx unwind. Reversed again below
  // for the inverted FlatList (newest-first, index 0 renders at the bottom).
  // While anchored, the jumped-to window (already chronological) replaces
  // the live thread entirely.
  const chronological = useMemo(() => {
    if (anchor) return anchor.messages;
    return messagePages?.pages.slice().reverse().flatMap((page) => page.messages) ?? [];
  }, [anchor, messagePages]);

  // Interleaves a separator row before each calendar day's first message —
  // built in chronological order (oldest first) so the separator lands
  // right before the day it introduces, then reversed as a whole for the
  // inverted FlatList below (higher index = higher up the screen, so the
  // separator still renders above that day's oldest message).
  const threadRows: ThreadRow[] = useMemo(() => {
    const rows: ThreadRow[] = [];
    let previousDayKey: string | null = null;
    let previousSenderId: string | null = null;
    for (const message of chronological) {
      const key = dayKey(message.createdAt);
      const isNewDay = key !== previousDayKey;
      if (isNewDay) {
        rows.push({
          kind: "separator",
          id: `separator-${key}`,
          label: formatDaySeparator(message.createdAt),
        });
      }
      rows.push({
        kind: "message",
        id: message.id,
        message: {
          ...message,
          showSender:
            isGroup &&
            message.senderId !== currentUserId &&
            (isNewDay || message.senderId !== previousSenderId),
          highlighted: message.id === anchor?.highlightedMessageId,
        },
      });
      previousDayKey = key;
      previousSenderId = message.senderId;
    }
    return rows.slice().reverse();
  }, [chronological, isGroup, currentUserId, anchor?.highlightedMessageId]);

  // "Seen" should mean you're actually looking at the newest message, not
  // just "the thread screen is open" — otherwise scrolling up into old
  // history, or a new message arriving while you're up there, would falsely
  // mark it read. This list is inverted, so the newest message sits at
  // scroll offset 0 — "am I at the bottom?" is just "is that offset near 0?".
  const BOTTOM_THRESHOLD = 40;
  const [isAtBottom, setIsAtBottom] = useState(true);
  const lastReadMessageIdRef = useRef<string | null>(null);
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIsAtBottom(event.nativeEvent.contentOffset.y <= BOTTOM_THRESHOLD);
  };

  const latestMessageId = threadRows[0]?.kind === "message" ? threadRows[0].message.id : null;

  useEffect(() => {
    // Anchored means "looking at a jumped-to message in history", not the
    // true live bottom — skip read-tracking until back on the live thread.
    if (isGroup || anchor || !latestMessageId || !isAtBottom) return;
    if (lastReadMessageIdRef.current === latestMessageId) return;
    lastReadMessageIdRef.current = latestMessageId;
    markConversationRead();
  }, [isGroup, anchor, latestMessageId, isAtBottom, markConversationRead]);

  // Scrolls to and briefly highlights a freshly-anchored target message.
  // Guarded by a ref (not just the effect dep) so re-renders from loading
  // older anchor pages don't re-trigger the scroll mid-pagination — only a
  // genuinely new target does.
  useEffect(() => {
    const targetId = anchor?.highlightedMessageId;
    if (!targetId || scrolledToHighlightRef.current === targetId) return;
    const index = threadRows.findIndex((row) => row.kind === "message" && row.message.id === targetId);
    if (index === -1) return;
    scrolledToHighlightRef.current = targetId;
    const timeout = setTimeout(() => {
      listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
    }, 60);
    return () => clearTimeout(timeout);
  }, [anchor?.highlightedMessageId, threadRows]);

  useEffect(() => {
    if (!socket || !id) return;
    const event = isGroup ? "newGroupMessage" : "newMessage";
    const queryKey = isGroup
      ? groupKeys.messages(id)
      : conversationKeys.messages(id);
    const handleIncoming = (message: ChatMessage) => {
      const belongsHere = isGroup
        ? message.groupId === id
        : message.conversationId === id;
      if (belongsHere) queryClient.invalidateQueries({ queryKey });
    };
    socket.on(event, handleIncoming);
    return () => {
      socket.off(event, handleIncoming);
    };
  }, [socket, id, isGroup, queryClient]);

  const headerTitle =
    (isGroup ? group?.name : getFullName(otherUser)) || title || "";
  const headerAvatarSrc = (isGroup ? group?.coverImageUrl : otherUser?.profilePicture) ?? undefined;
  const isPendingHeader = isGroup ? isPendingGroup : isPendingUser;

  return (
    <ThemedView safe fullHeight style={{ paddingBottom: 0 }}>
      <ConversationHeader
        id={id ?? ""}
        isGroup={isGroup}
        headerTitle={headerTitle}
        headerAvatarSrc={headerAvatarSrc}
        isPendingHeader={isPendingHeader}
        onJump={handleJump}
      />

      {/* Wraps both the list and the input footer — one source of truth for
          the keyboard offset, so they move together instead of each having
          its own independent (and easily out-of-sync) keyboard tracking.
          Shrinking/padding this single container as the keyboard rises both
          resizes the FlatList (newest messages stay visible) and carries
          the input up with it in the same motion. */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, position: "relative" }}>
          {isPendingMessages ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : (
            <FlatList<ThreadRow>
              ref={listRef}
              className="flex-1"
              data={threadRows}
              keyExtractor={(item) => item.id}
              inverted
              maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
              onScroll={handleScroll}
              scrollEventThrottle={200}
              renderItem={({ item }) =>
                item.kind === "separator" ? (
                  <DaySeparator label={item.label} />
                ) : (
                  <MessageBubble
                    message={item.message}
                    isOwn={item.message.senderId === currentUserId}
                    variant={isGroup ? "group" : "direct"}
                    showSender={item.message.showSender}
                    highlighted={item.message.highlighted}
                  />
                )
              }
              onEndReached={() => {
                if (hasNextPage && !isFetchingNextPage) fetchNextPage();
              }}
              onEndReachedThreshold={0.3}
              onScrollToIndexFailed={(info) => {
                setTimeout(() => {
                  listRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0.5 });
                }, 100);
              }}
              ListFooterComponent={
                isFetchingNextPage ? (
                  <ActivityIndicator
                    size="small"
                    color={Colors.primary}
                    style={{ marginVertical: 12 }}
                  />
                ) : null
              }
              ListEmptyComponent={
                <View className="pt-10">
                  <ConversationEmptyState />
                </View>
              }
              contentContainerStyle={{ paddingVertical: 12, flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
            />
          )}

          {/* Unifies "jump back to live from an anchored search result" and
              "scroll to bottom after scrolling up" behind one button, since
              both mean the same thing to the viewer: get back to the
              newest message. */}
          {!isPendingMessages && (anchor || !isAtBottom) ? (
            <PressableScale
              onPress={returnToLive}
              className="absolute items-center justify-center rounded-full"
              style={{
                right: 16,
                bottom: 16,
                width: 40,
                height: 40,
                backgroundColor: theme.uiBackground,
                borderWidth: 1,
                borderColor: theme.borderColor,
              }}
            >
              <Ionicons name="chevron-down" size={IconSizes.lg} color={theme.iconMuted} />
            </PressableScale>
          ) : null}
        </View>

        <View
          style={{
            backgroundColor: theme.background,
            borderTopWidth: 1,
            borderTopColor: theme.borderColor,
            paddingBottom: isKeyboardVisible ? 0 : insets.bottom,
            marginBottom: isKeyboardVisible ? INPUT_KEYBOARD_GAP : 0,
          }}
        >
          <MessageInput
            variant={isGroup ? "group" : "direct"}
            id={id as string}
            disabled={!canSend}
            onSent={scrollToBottom}
          />
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
};

export default ConversationThread;
