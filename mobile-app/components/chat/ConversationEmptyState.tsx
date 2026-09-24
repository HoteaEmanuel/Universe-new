import { View, Text } from "react-native";
import { Colors } from "@constants/colors";
import { useAppColorScheme } from "@hooks/useAppColorScheme";
import MessageIllustration from "./MessageIllustration";

// Shared by the conversation thread (conversation/[id].tsx) and the
// new-conversation composer (new-conversation/[id].tsx) — both are "nothing
// sent in this DM yet" moments, just reached from different entry points, so
// they share one empty-state visual.
const ConversationEmptyState = () => {
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;

  return (
    <View className="w-full items-center gap-3 px-8">
      <MessageIllustration size={88} />
      <Text className="text-center text-sm" style={{ color: theme.tabIconColour }}>
        No messages yet. Say hi!
      </Text>
    </View>
  );
};

export default ConversationEmptyState;
