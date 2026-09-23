import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { getFullName, type ChatMessage } from "@universe/shared";
import { Colors } from "@constants/colors";
import UserAvatar from "@components/UserAvatar";
import { useAppColorScheme } from "@hooks/useAppColorScheme";
import { formatMessageDetail, formatMessageTime } from "@utils/chatMessageTime";
import MessageImageGrid from "./MessageImageGrid";
import MessageFileList from "./MessageFileList";
import AudioMessagePlayer from "./AudioMessagePlayer";

const AVATAR_SIZE = 24;

type MessageBubbleProps = {
  message: ChatMessage;
  isOwn: boolean;
  variant: "direct" | "group";
  showSender: boolean;
};


const MessageBubble = ({ message, isOwn, variant, showSender }: MessageBubbleProps) => {
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;
  const isGroupOther = variant === "group" && !isOwn;
  const [showDetail, setShowDetail] = useState(false);

  return (
    <View
      className={`flex-row px-4 py-0.5 ${isOwn ? "justify-end" : "justify-start"}`}
    >
      {isGroupOther ? (
        <View style={{ width: AVATAR_SIZE, marginRight: 8 }}>
          {showSender ? (
            <UserAvatar user={message.sender} size={AVATAR_SIZE} iconColor={theme.iconMuted} />
          ) : null}
        </View>
      ) : null}

      <View className="max-w-[78%]" style={{ alignItems: isOwn ? "flex-end" : "flex-start" }}>
        {isGroupOther && showSender ? (
          <Text
            className="px-1 pb-0.5 text-xs font-semibold"
            style={{ color: theme.tabIconColour }}
          >
            {getFullName(message.sender)}
          </Text>
        ) : null}

        <Pressable
          onPress={() => setShowDetail((prev) => !prev)}
          className="gap-1"
          style={{ alignItems: isOwn ? "flex-end" : "flex-start" }}
        >
          {!message.deleted && message.imageUrls && message.imageUrls.length > 0 && (
            <MessageImageGrid images={message.imageUrls} />
          )}

          {!message.deleted && message.attachments && message.attachments.length > 0 && (
            <MessageFileList attachments={message.attachments} isOwn={isOwn} />
          )}

          {!message.deleted && message.audioUrl && (
            <View
              className="rounded-2xl px-2 py-1"
              style={{ backgroundColor: isOwn ? Colors.primary : theme.uiBackground }}
            >
              <AudioMessagePlayer
                audioUrl={message.audioUrl}
                durationSec={message.audioDurationSec}
                isOwn={isOwn}
              />
            </View>
          )}

          {(message.deleted || message.content) && (
            <View
              className="rounded-2xl px-3 py-2"
              style={{ backgroundColor: isOwn ? Colors.primary : theme.uiBackground }}
            >
              <Text
                className="text-sm"
                style={{ color: isOwn ? "#ffffff" : theme.text, fontStyle: message.deleted ? "italic" : "normal" }}
              >
                {message.deleted ? "This message was deleted" : message.content}
              </Text>
            </View>
          )}
        </Pressable>

        <Text className="px-1 pt-0.5 text-2xs" style={{ color: theme.tabIconColour }}>
          {showDetail ? formatMessageDetail(message.createdAt) : formatMessageTime(message.createdAt)}
        </Text>
      </View>
    </View>
  );
};

export default MessageBubble;
