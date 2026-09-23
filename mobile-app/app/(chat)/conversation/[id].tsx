import { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  ActivityIndicator,
  Platform,
  Pressable,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { KeyboardAvoidingView, useKeyboardState } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getFullName, type ChatMessage } from "@universe/shared";
import { conversationKeys, groupKeys } from "@universe/shared/queries";
import { useAuthStore } from "@store/authStore";
import {
  useGetConvoMessagesInfinite,
  useGetUserByConvoId,
} from "@queryAndMutation/queries/conversation-queries";
import { useMarkConversationReadMutation } from "@queryAndMutation/mutations/conversation-mutation";
import {
  useGetGroupById,
  useGetGroupMessagesInfinite,
} from "@queryAndMutation/queries/group-queries";
import { Colors } from "@constants/colors";
import { IconSizes } from "@constants/iconSizes";
import { PressableScale } from "@lib/styled";
import ThemedView from "@components/ThemedView";
import MessageBubble from "@components/chat/MessageBubble";
import MessageInput from "@components/chat/MessageInput";
import { getAvatarColor, getInitials } from "@utils/chatAvatarColor";
import { dayKey, formatDaySeparator } from "@utils/chatMessageTime";
import { useAppColorScheme } from "@hooks/useAppColorScheme";

const HEADER_AVATAR_SIZE = 36;
// Small breathing room between the input bar and the keyboard's top edge —
// otherwise the input sits flush against the keyboard when it's open.
const INPUT_KEYBOARD_GAP = 8;

type DisplayMessage = ChatMessage & { showSender: boolean };

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

// Real message thread, replacing the ConversationStub placeholder from the
// Chat-list-only pass. One screen for both DMs and groups (`isGroup` route
// param set by the list's goToEntry) — mirrors how web shares
// MessageThread/MessageInput between Conversation.tsx and Group.tsx instead
// of forking two screens. Scope is structure only: bubbles + text input +
// send, working live via the socket "newMessage"/"newGroupMessage" events;
// no voice, emoji, reactions, attachments, polls, edit/delete, or read
// receipts — see context/current-feature.md.
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
  const hasNextPage = isGroup ? hasNextGroupPage : hasNextConvoPage;
  const isFetchingNextPage = isGroup
    ? isFetchingNextGroupPage
    : isFetchingNextConvoPage;
  const fetchNextPage = isGroup ? fetchNextGroupPage : fetchNextConvoPage;
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
  const chronological = useMemo(
    () =>
      messagePages?.pages
        .slice()
        .reverse()
        .flatMap((page) => page.messages) ?? [],
    [messagePages],
  );

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
        },
      });
      previousDayKey = key;
      previousSenderId = message.senderId;
    }
    return rows.slice().reverse();
  }, [chronological, isGroup, currentUserId]);

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
    if (isGroup || !latestMessageId || !isAtBottom) return;
    if (lastReadMessageIdRef.current === latestMessageId) return;
    lastReadMessageIdRef.current = latestMessageId;
    markConversationRead();
  }, [isGroup, latestMessageId, isAtBottom, markConversationRead]);

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
  const headerAvatarSrc = isGroup
    ? group?.coverImageUrl
    : otherUser?.profilePicture;
  const isPendingHeader = isGroup ? isPendingGroup : isPendingUser;

  return (
    <ThemedView safe fullHeight style={{ paddingBottom: 0 }}>
      <View
        className="flex-row items-center gap-3 px-4 pb-3 pt-2"
        style={{ borderBottomWidth: 1, borderBottomColor: theme.borderColor }}
      >
        <PressableScale onPress={() => router.back()} hitSlop={8}>
          <Ionicons
            name="chevron-back"
            size={IconSizes.xl}
            color={theme.iconMuted}
          />
        </PressableScale>

        <Pressable
          className="flex-1 flex-row items-center gap-3"
          disabled={isGroup || !otherUser?.id}
          onPress={() => router.push(`/profile/${otherUser?.id}`)}
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
                backgroundColor: getAvatarColor(id ?? ""),
              }}
            >
              <Text
                className="text-xs font-semibold"
                style={{ color: "#ffffff" }}
              >
                {getInitials(headerTitle || "?")}
              </Text>
            </View>
          )}

          <Text
            className="flex-1 text-base font-bold"
            style={{ color: theme.title }}
            numberOfLines={1}
          >
            {headerTitle}
          </Text>
        </Pressable>
      </View>

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
                />
              )
            }
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) fetchNextPage();
            }}
            onEndReachedThreshold={0.3}
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
              <Text
                className="pt-10 text-center text-sm"
                style={{ color: theme.tabIconColour }}
              >
                No messages yet. Say hi!
              </Text>
            }
            contentContainerStyle={{ paddingVertical: 12, flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          />
        )}

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
