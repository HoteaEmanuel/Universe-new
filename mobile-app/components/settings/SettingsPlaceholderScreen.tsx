import { View, Text } from "react-native";
import ThemedView from "@components/ThemedView";
import { Colors } from "@constants/colors";
import SettingsScreenHeader from "./SettingsScreenHeader";
import { useAppColorScheme } from "@hooks/useAppColorScheme";

type SettingsPlaceholderScreenProps = {
  title: string;
};

const SettingsPlaceholderScreen = ({ title }: SettingsPlaceholderScreenProps) => {
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;

  return (
    <ThemedView safe fullHeight>
      <SettingsScreenHeader title={title} />

      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-sm" style={{ color: theme.tabIconColour }}>
          Coming soon.
        </Text>
      </View>
    </ThemedView>
  );
};

export default SettingsPlaceholderScreen;
