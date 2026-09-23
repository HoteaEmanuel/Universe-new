import { View, Text, useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/colors";
import { IconSizes } from "../../constants/iconSizes";
import { PressableScale } from "../../lib/styled";

type SettingsRowProps = {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  danger?: boolean;
};

const SettingsRow = ({ title, subtitle, icon, onPress, danger = false }: SettingsRowProps) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;
  const iconColor = danger ? Colors.warning : theme.iconMuted;
  const titleColor = danger ? Colors.warning : theme.title;

  return (
    <PressableScale onPress={onPress} className="flex-row items-center gap-3 px-4 py-3.5">
      {icon ? <Ionicons name={icon} size={IconSizes.lg} color={iconColor} /> : null}
      <View className="flex-1 gap-0.5">
        <Text className="text-sm font-semibold" style={{ color: titleColor }}>
          {title}
        </Text>
        {subtitle ? (
          <Text className="text-xs" style={{ color: theme.tabIconColour }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={IconSizes.md} color={theme.iconMuted} />
    </PressableScale>
  );
};

export default SettingsRow;
