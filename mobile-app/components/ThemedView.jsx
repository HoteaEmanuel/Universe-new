import { View, Text, ScrollView } from "react-native";
import React from "react";
import { Colors } from "@constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppColorScheme } from "@hooks/useAppColorScheme";

/** @param {{ style?: import("react-native").StyleProp<import("react-native").ViewStyle>, safe?: boolean, fullHeight?: boolean, [key: string]: any }} props */
const ThemedView = ({ style, safe = false, fullHeight = false, ...props }) => {
  const colorScheme = useAppColorScheme();
  const theme = Colors[colorScheme] || Colors.light;
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        {
          backgroundColor: theme.background,
          ...(fullHeight ? { flex: 1 } : null),
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
        style,
      ]}
      {...props}
    />
  );
};

export default ThemedView;
