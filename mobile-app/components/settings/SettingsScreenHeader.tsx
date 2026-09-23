import { View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ThemedText from "@components/ThemedText";
import { Colors } from "@constants/colors";
import { IconSizes } from "@constants/iconSizes";
import { PressableScale } from "@lib/styled";
import { useAppColorScheme } from "@hooks/useAppColorScheme";

type SettingsScreenHeaderProps = {
  title: string;
};

// Extracted from SettingsPlaceholderScreen so every real Account-section
// screen (edit-profile, change-password, delete-account) shares the same
// back-header instead of re-declaring it three times.
const SettingsScreenHeader = ({ title }: SettingsScreenHeaderProps) => {
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;

  return (
    <View className="flex-row items-center gap-3 px-4 pt-2">
      <PressableScale onPress={() => router.back()} hitSlop={8}>
        <Ionicons name="chevron-back" size={IconSizes.xl} color={theme.iconMuted} />
      </PressableScale>
      <ThemedText title className="text-lg font-bold">
        {title}
      </ThemedText>
    </View>
  );
};

export default SettingsScreenHeader;
