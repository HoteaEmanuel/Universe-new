import { View, Text } from "react-native";
import React from "react";
import { Colors } from "@constants/colors";
import { useAppColorScheme } from "@hooks/useAppColorScheme";
const ThemedText = ({ style = null, title = false, ...props }) => {
  const colorScheme = useAppColorScheme();
  const theme = Colors[colorScheme] || Colors.light;
  const textColor = title ? theme.title : theme.text;
  return <Text style={{ color: textColor, ...style }} {...props}></Text>;
};

export default ThemedText;
