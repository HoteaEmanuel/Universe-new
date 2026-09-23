import { View, Text, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getFullName, type ConversationListEntry } from "@universe/shared";
import { Colors } from "@constants/colors";
import { IconSizes } from "@constants/iconSizes";
import { PressableScale } from "@lib/styled";
import { useAppColorScheme } from "@hooks/useAppColorScheme";
import { getAvatarColor, getInitials } from "@utils/chatAvatarColor";
import { formatChatListTime } from "@utils/chatListTime";

const AVATAR_SIZE = 52;

type ConversationRowProps = {
  entry: ConversationListEntry;
  currentUserId: string;
  isOnline?: boolean;
  onPress: () => void;
};

// Mirrors frontend/src/features/chat/components/ConversationListItem.tsx —
// same title/prefix/fallback-label rules, adapted to RN (Image + colored-
// initials fallback instead of an <img>, Ionicons instead of lucide).
const ConversationRow = ({ entry, currentUserId, isOnline, onPress }: ConversationRowProps) => {
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;

  const isGroup = !!entry.name;
  const avatarSrc = isGroup ? entry.coverImageUrl : entry.user?.profilePicture;
  const title = isGroup ? entry.name : getFullName(entry.user);

  const lastMessage = entry.lastMessage;
  const lastSenderId = lastMessage?.senderId;
  const lastSender = lastMessage?.sender;
  const prefix =
    lastSenderId === currentUserId
      ? "You: "
      : isGroup && lastSender
        ? `${getFullName(lastSender)}: `
        : "";
  const isImageOnly = !lastMessage?.content && !!lastMessage?.imageUrls?.length;
  const isVoiceOnly = !lastMessage?.content && !!lastMessage?.audioUrl;
  const isFileOnly = !lastMessage?.content && !!lastMessage?.attachments?.length;
  const isSharedPostOnly = !lastMessage?.content && !!lastMessage?.sharedPostId;
  const time = lastMessage ? formatChatListTime(entry.updatedAt) : null;
  const unreadCount = "unreadCount" in entry ? (entry.unreadCount ?? 0) : 0;
  const hasUnread = unreadCount > 0;

  return (
    <PressableScale onPress={onPress} className="flex-row items-center gap-3 px-4 py-2.5">
      <View className="relative">
        {avatarSrc ? (
          <Image
            source={{ uri: avatarSrc }}
            style={{ width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2 }}
          />
        ) : (
          <View
            className="items-center justify-center rounded-full"
            style={{
              width: AVATAR_SIZE,
              height: AVATAR_SIZE,
              backgroundColor: getAvatarColor(entry.id),
            }}
          >
            <Text className="text-base font-semibold" style={{ color: "#ffffff" }}>
              {getInitials(title)}
            </Text>
          </View>
        )}
        {!isGroup && isOnline ? (
          <View
            className="absolute rounded-full"
            style={{
              width: 14,
              height: 14,
              right: 1,
              bottom: 1,
              backgroundColor: "#22c55e",
              borderWidth: 2,
              borderColor: theme.background,
            }}
          />
        ) : null}
      </View>

      <View className="min-w-0 flex-1 gap-0.5">
        <View className="flex-row items-baseline justify-between gap-2">
          <Text className="flex-1 text-sm font-semibold" style={{ color: theme.title }} numberOfLines={1}>
            {title}
          </Text>
          {time ? (
            <Text className="shrink-0 text-2xs" style={{ color: theme.tabIconColour }}>
              {time}
            </Text>
          ) : null}
        </View>

        <View className="flex-row items-center gap-1">
          {lastMessage ? (
            unreadCount > 1 ? (
              <Text
                className="flex-1 text-sm font-semibold"
                style={{ color: theme.title }}
                numberOfLines={1}
              >
                +{unreadCount} new messages
              </Text>
            ) : (
              <>
                {!isImageOnly && !isVoiceOnly && !isFileOnly && !isSharedPostOnly ? (
                  <Text
                    className="flex-1 text-sm"
                    style={{ color: hasUnread ? theme.title : theme.tabIconColour }}
                    numberOfLines={1}
                  >
                    {prefix}
                    {lastMessage.content}
                  </Text>
                ) : (
                  <View className="flex-1 flex-row items-center gap-1">
                    <Text
                      className="text-sm"
                      style={{ color: hasUnread ? theme.title : theme.tabIconColour }}
                    >
                      {prefix}
                    </Text>
                    <Ionicons
                      name={
                        isImageOnly
                          ? "camera-outline"
                          : isVoiceOnly
                            ? "mic-outline"
                            : isFileOnly
                              ? "attach-outline"
                              : "paper-plane-outline"
                      }
                      size={IconSizes.xs}
                      color={hasUnread ? theme.title : theme.tabIconColour}
                    />
                    <Text
                      className="text-sm"
                      style={{ color: hasUnread ? theme.title : theme.tabIconColour }}
                    >
                      {isImageOnly
                        ? "Photo"
                        : isVoiceOnly
                          ? "Voice message"
                          : isFileOnly
                            ? "File"
                            : "Shared a post"}
                    </Text>
                  </View>
                )}
                {hasUnread ? (
                  <View
                    className="items-center justify-center rounded-full px-1.5"
                    style={{ minWidth: 18, height: 18, backgroundColor: Colors.primary }}
                  >
                    <Text className="text-2xs font-semibold" style={{ color: "#ffffff" }}>
                      {unreadCount}
                    </Text>
                  </View>
                ) : null}
              </>
            )
          ) : (
            <Text className="flex-1 text-sm" style={{ color: theme.tabIconColour }}>
              No messages yet
            </Text>
          )}
        </View>
      </View>
    </PressableScale>
  );
};

export default ConversationRow;
