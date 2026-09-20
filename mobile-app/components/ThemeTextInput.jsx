import { View, Text, TextInput } from "react-native";
import React from "react";
import { useColorScheme } from "react-native";
import { Colors } from "../constants/colors";
const ThemedTextInput = ({
  placeholder,
  style,
  multiline = false,
  ...props
}) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] || Colors.light;
  return (
    <TextInput
      placeholder={placeholder}
      placeholderTextColor={"#9591a5"}
      multiline={multiline}
      style={[
        {
          color: theme.text,
          fontSize: 16,
          borderColor: theme.text,
          borderWidth: 1,
          padding: 10,
          borderRadius: 5,
          textAlignVertical: "top",
        },
        style,
      ]}
      {...props}
    />
  );
};

export default ThemedTextInput;
