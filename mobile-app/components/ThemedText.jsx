import { View, Text } from "react-native";
import React from "react";
import { useColorScheme } from "react-native";
import { Colors } from "../constants/colors";
const ThemedText = ({ style = null, title = false, ...props }) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] || Colors.light;
  const textColor = title ? theme.title : theme.text;
  return <Text style={{ color: textColor, ...style }} {...props}></Text>;
};

export default ThemedText;
