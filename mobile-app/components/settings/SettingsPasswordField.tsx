import { useState } from "react";
import { View, Text, TextInput, Pressable, useColorScheme, type TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/colors";
import { IconSizes } from "../../constants/iconSizes";

type SettingsPasswordFieldProps = {
  label: string;
  error?: string;
} & Omit<TextInputProps, "style" | "className" | "placeholderTextColor" | "secureTextEntry">;

// Same visual language as ComposerField (theme-driven, not the auth screens'
// fixed palette) with an eye toggle, for the password inputs on
// Change Password / Delete Account.
const SettingsPasswordField = ({ label, error, ...inputProps }: SettingsPasswordFieldProps) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;
  const [hidden, setHidden] = useState(true);

  return (
    <View className="gap-1.5">
      <Text className="text-xs font-semibold" style={{ color: theme.title }}>
        {label}
      </Text>
      <View
        className="flex-row items-center rounded-xl px-3.5"
        style={{
          backgroundColor: theme.uiBackground,
          borderWidth: 1,
          borderColor: error ? Colors.warning : theme.borderColor,
          height: 48,
        }}
      >
        <TextInput
          {...inputProps}
          secureTextEntry={hidden}
          placeholderTextColor={theme.tabIconColour}
          className="flex-1 text-sm"
          style={{ color: theme.title }}
        />
        <Pressable
          onPress={() => setHidden((prev) => !prev)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={hidden ? "Show password" : "Hide password"}
        >
          <Ionicons
            name={hidden ? "eye-outline" : "eye-off-outline"}
            size={IconSizes.md}
            color={theme.tabIconColour}
          />
        </Pressable>
      </View>
      {error ? (
        <Text className="text-2xs" style={{ color: Colors.warning }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
};

export default SettingsPasswordField;
