import { useState } from "react";
import { View, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@constants/colors";
import { IconSizes } from "@constants/iconSizes";
import { PressableScale } from "@lib/styled";
import { useAppColorScheme } from "@hooks/useAppColorScheme";
import { useSendReplyMutation } from "@queryAndMutation/mutations/comment-mutation";

type ReplyInputProps = {
  postId?: string;
  parentId: string;
  onSent: () => void;
};

const ReplyInput = ({ postId, parentId, onSent }: ReplyInputProps) => {
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;
  const [text, setText] = useState("");
  const { mutate: sendReply, isPending } = useSendReplyMutation(postId, parentId);
  const canSend = !!text.trim() && !isPending;

  const handleSend = () => {
    if (!canSend) return;
    sendReply(text.trim(), { onSuccess: onSent });
    setText("");
  };

  return (
    <View className="mt-1.5 flex-row items-end gap-1.5">
      <View
        className="flex-1 justify-center rounded-xl px-3"
        style={{ backgroundColor: theme.uiBackground, minHeight: 30 }}
      >
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Write a reply..."
          placeholderTextColor={theme.tabIconColour}
          multiline
          autoFocus
          style={{ color: theme.text, maxHeight: 80, paddingVertical: 6, fontSize: 12 }}
        />
      </View>
      <PressableScale onPress={handleSend} enabled={canSend} hitSlop={8} className="pb-1.5">
        <Ionicons
          name="send"
          size={IconSizes.sm}
          color={canSend ? Colors.primary : theme.iconMuted}
        />
      </PressableScale>
    </View>
  );
};

export default ReplyInput;
