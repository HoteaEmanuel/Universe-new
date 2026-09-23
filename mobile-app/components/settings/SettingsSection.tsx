import { Children, Fragment, type ReactNode } from "react";
import { View, Text, useColorScheme } from "react-native";
import { Colors } from "../../constants/colors";

type SettingsSectionProps = {
  title?: string;
  children: ReactNode;
};

const SettingsSection = ({ title, children }: SettingsSectionProps) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;
  const rows = Children.toArray(children);

  return (
    <View className="gap-2">
      {title ? (
        <Text className="px-4 text-xs font-semibold uppercase" style={{ color: theme.tabIconColour }}>
          {title}
        </Text>
      ) : null}
      <View
        className="w-full overflow-hidden rounded-2xl shadow-card"
        style={{ backgroundColor: theme.uiBackground, borderWidth: 1, borderColor: theme.borderColor }}
      >
        {rows.map((row, index) => (
          <Fragment key={index}>
            {index > 0 ? <View style={{ height: 1, backgroundColor: theme.borderColor }} /> : null}
            {row}
          </Fragment>
        ))}
      </View>
    </View>
  );
};

export default SettingsSection;
