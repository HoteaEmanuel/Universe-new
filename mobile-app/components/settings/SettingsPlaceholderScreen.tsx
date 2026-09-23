import { View, Text, useColorScheme } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ThemedView from "../ThemedView";
import ThemedText from "../ThemedText";
import { Colors } from "../../constants/colors";
import { IconSizes } from "../../constants/iconSizes";
import { PressableScale } from "../../lib/styled";

type SettingsPlaceholderScreenProps = {
  title: string;
};

const SettingsPlaceholderScreen = ({ title }: SettingsPlaceholderScreenProps) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;

  return (
    <ThemedView safe fullHeight>
      <View className="flex-row items-center gap-3 px-4 pt-2">
        <PressableScale onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={IconSizes.xl} color={theme.iconMuted} />
        </PressableScale>
        <ThemedText title className="text-lg font-bold">
          {title}
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

export default SettingsPlaceholderScreen;
