import { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { router } from "expo-router";
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
  highlighted?: boolean;
};


const MessageBubble = ({ message, isOwn, variant, showSender, highlighted }: MessageBubbleProps) => {
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;
  const isGroupOther = variant === "group" && !isOwn;
  const [showDetail, setShowDetail] = useState(false);

  // Brief flash so a message jumped to via search stands out from the rest
  // of the thread, then fades back to normal on its own.
  const flash = useSharedValue(0);
  useEffect(() => {
    if (highlighted) {
      flash.value = 1;
      flash.value = withDelay(300, withTiming(0, { duration: 900 }));
    }
  }, [highlighted, flash]);
  const highlightStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(104, 73, 167, ${flash.value * 0.22})`,
  }));

  return (
    <Animated.View
      className={`flex-row px-4 py-0.5 ${isOwn ? "justify-end" : "justify-start"}`}
      style={[{ alignItems: "flex-start" }, highlightStyle]}
    >
      {isGroupOther ? (
        // The username label sits above the bubble as its own line — the
        // avatar should line up with the bubble (the actual message start),
        // not with that label, so it's pushed down by the label's height.
        <View
          style={{
            width: AVATAR_SIZE,
            height: AVATAR_SIZE,
            marginRight: 8,
            marginTop: showSender ? AVATAR_SIZE : 0,
          }}
        >
          {showSender ? (
            <UserAvatar
              user={message.sender}
              size={AVATAR_SIZE}
              iconColor={theme.iconMuted}
              onPress={() => router.push(`/profile/${message.senderId}`)}
            />
          ) : null}
        </View>
      ) : null}

      <View className="max-w-[78%]" style={{ alignItems: isOwn ? "flex-end" : "flex-start" }}>
        {isGroupOther && showSender ? (
          <Pressable
            onPress={() => router.push(`/profile/${message.senderId}`)}
            style={{ height: AVATAR_SIZE, justifyContent: "center" }}
          >
            <Text
              className="px-1 text-xs font-semibold"
              style={{ color: theme.tabIconColour }}
            >
              {getFullName(message.sender)}
            </Text>
          </Pressable>
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
    </Animated.View>
  );
};

export default MessageBubble;
