import { useState } from "react";
import { View, Text, TextInput, Pressable, type TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@constants/colors";
import { IconSizes } from "@constants/iconSizes";
import { useAppColorScheme } from "@hooks/useAppColorScheme";

type SettingsPasswordFieldProps = {
  label: string;
  error?: string;
  // Off for a high-stakes field (Delete Account) where letting the value be
  // revealed or lifted to the clipboard is itself a risk if the device is
  // unlocked in someone else's hands — on by default for the ordinary
  // Change Password case, where that convenience carries no such risk.
  showRevealToggle?: boolean;
  preventCopyPaste?: boolean;
} & Omit<TextInputProps, "style" | "className" | "placeholderTextColor" | "secureTextEntry">;

// Same visual language as ComposerField (theme-driven, not the auth screens'
// fixed palette) with an eye toggle, for the password inputs on
// Change Password / Delete Account.
const SettingsPasswordField = ({
  label,
  error,
  showRevealToggle = true,
  preventCopyPaste = false,
  ...inputProps
}: SettingsPasswordFieldProps) => {
  const colorScheme = useAppColorScheme();
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
          secureTextEntry={showRevealToggle ? hidden : true}
          // contextMenuHidden removes the long-press Copy/Paste/Select-All
          // menu (Android and iOS) - the standard RN way to keep a typed
          // password from being lifted to the clipboard.
          contextMenuHidden={preventCopyPaste || inputProps.contextMenuHidden}
          placeholderTextColor={theme.tabIconColour}
          className="flex-1 text-sm"
          style={{ color: theme.title }}
        />
        {showRevealToggle ? (
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
        ) : null}
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
