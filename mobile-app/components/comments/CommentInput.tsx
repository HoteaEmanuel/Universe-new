import { useState } from "react";
import { View, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@constants/colors";
import { IconSizes } from "@constants/iconSizes";
import { PressableScale } from "@lib/styled";
import { useAppColorScheme } from "@hooks/useAppColorScheme";
import { useSendCommentMutation } from "@queryAndMutation/mutations/comment-mutation";

type CommentInputProps = {
  postId?: string;
};

// The permanently-visible footer composer — mounted outside the comments
// FlatList by post-details and wrapped in a KeyboardStickyView there, so this
// component only owns the input itself, not its keyboard-following position.
const CommentInput = ({ postId }: CommentInputProps) => {
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;
  const [text, setText] = useState("");
  const { mutate: sendComment, isPending } = useSendCommentMutation(postId);
  const canSend = !!text.trim() && !isPending;

  const handleSend = () => {
    if (!canSend) return;
    sendComment(text.trim());
    setText("");
  };

  return (
    <View className="flex-row items-end gap-2 px-4 py-2.5">
      <View
        className="flex-1 justify-center rounded-2xl px-3.5"
        style={{ backgroundColor: theme.uiBackground, minHeight: 40 }}
      >
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Add a comment..."
          placeholderTextColor={theme.tabIconColour}
          multiline
          style={{ color: theme.text, maxHeight: 96, paddingVertical: 9 }}
          className="text-sm"
        />
      </View>
      <PressableScale onPress={handleSend} enabled={canSend} hitSlop={8} className="pb-2">
        <Ionicons
          name="send"
          size={IconSizes.lg}
          color={canSend ? Colors.primary : theme.iconMuted}
        />
      </PressableScale>
    </View>
  );
};

export default CommentInput;
