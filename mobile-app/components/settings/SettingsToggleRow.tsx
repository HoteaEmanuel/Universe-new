import { View, Text, Switch } from "react-native";
import { Colors } from "@constants/colors";
import { useAppColorScheme } from "@hooks/useAppColorScheme";

type SettingsToggleRowProps = {
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
};

// Sibling to SettingsRow (which navigates via a chevron) - this variant ends
// in a Switch instead, for a setting toggled in place rather than drilled
// into. Shares SettingsSection's row/divider container with SettingsRow.
const SettingsToggleRow = ({ title, subtitle, value, onValueChange, disabled = false }: SettingsToggleRowProps) => {
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;

  return (
    <View className="flex-row items-center gap-3 px-4 py-3.5">
      <View className="flex-1 gap-0.5">
        <Text className="text-sm font-semibold" style={{ color: theme.title }}>
          {title}
        </Text>
        {subtitle ? (
          <Text className="text-xs" style={{ color: theme.tabIconColour }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: theme.borderColor, true: Colors.primary }}
        thumbColor="#ffffff"
        ios_backgroundColor={theme.borderColor}
      />
    </View>
  );
};

export default SettingsToggleRow;
