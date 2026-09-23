import { useState } from "react";
import { View, Text, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@constants/colors";
import { IconSizes } from "@constants/iconSizes";
import { PressableScale } from "@lib/styled";
import { useAppColorScheme } from "@hooks/useAppColorScheme";
import { useSendMessageMutation } from "@queryAndMutation/mutations/conversation-mutation";
import { useSendMessageToGroupMutation } from "@queryAndMutation/mutations/group-mutation";

type MessageInputProps = {
  variant: "direct" | "group";
  id: string;
  disabled?: boolean;

  onSent?: () => void;
};

// Structural port of frontend/src/features/chat/components/MessageInput.tsx,
// stripped to text-only — no image/file attachments, voice recording, emoji
// picker, polls, or @mention autocomplete/typing-indicator emission, all
// explicitly out of scope for this pass. Styling mirrors this app's existing
// CommentInput (mobile-app/components/comments/CommentInput.tsx).
const MessageInput = ({ variant, id, disabled, onSent }: MessageInputProps) => {
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;
  const [text, setText] = useState("");

  const directMutation = useSendMessageMutation(variant === "direct" ? id : undefined);
  const groupMutation = useSendMessageToGroupMutation(variant === "group" ? id : undefined);
  const { mutate, isPending } = variant === "direct" ? directMutation : groupMutation;

  const canSend = !!text.trim() && !isPending && !disabled;

  const handleSend = () => {
    if (!canSend) return;
    mutate({ messageText: text.trim() });
    setText("");
    onSent?.();
  };

  if (disabled) {
    return (
      <View className="px-4 py-3">
        <Text className="text-sm" style={{ color: theme.tabIconColour }}>
          You can&apos;t send messages to this conversation.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-row items-end gap-2 px-4 py-2.5">
      <View
        className="flex-1 justify-center rounded-2xl px-3.5"
        style={{ backgroundColor: theme.uiBackground, minHeight: 40 }}
      >
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Send a message"
          placeholderTextColor={theme.tabIconColour}
          multiline
          style={{ color: theme.text, maxHeight: 96, paddingVertical: 9 }}
          className="text-sm"
        />
      </View>
      <PressableScale onPress={handleSend} enabled={canSend} hitSlop={8} className="pb-2">
        <Ionicons name="send" size={IconSizes.lg} color={canSend ? Colors.primary : theme.iconMuted} />
      </PressableScale>
    </View>
  );
};

export default MessageInput;
