import { View, Text } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ThemedView from "@components/ThemedView";
import ThemedText from "@components/ThemedText";
import { Colors } from "@constants/colors";
import { IconSizes } from "@constants/iconSizes";
import { PressableScale } from "@lib/styled";
import { useAppColorScheme } from "@hooks/useAppColorScheme";

// Placeholder destination for a tapped chat-list row — the real message
// thread (bubbles, input, voice/files/reactions/typing indicator, mirroring
// web's Conversation.tsx) is deliberately out of scope for this pass and
// becomes its own follow-up feature, same staging as Settings' screens.
const ConversationStub = () => {
  const { title, isGroup } = useLocalSearchParams<{
    id: string;
    title?: string;
    isGroup?: string;
  }>();
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;

  return (
    <ThemedView safe fullHeight>
      <View className="flex-row items-center gap-3 px-4 pt-2">
        <PressableScale onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={IconSizes.xl} color={theme.iconMuted} />
        </PressableScale>
        <ThemedText title className="text-lg font-bold" numberOfLines={1}>
          {title || (isGroup ? "Group" : "Conversation")}
        </ThemedText>
      </View>

      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-sm" style={{ color: theme.tabIconColour }}>
          Coming soon.
        </Text>
      </View>
    </ThemedView>
  );
};

export default ConversationStub;
