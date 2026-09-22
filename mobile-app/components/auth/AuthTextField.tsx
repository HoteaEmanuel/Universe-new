import { useState } from "react";
import { View, Text, TextInput, Pressable, type TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { authPalette } from "./authPalette";
import { IconSizes } from "../../constants/iconSizes";

type AuthTextFieldProps = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
  hint?: string;
  error?: string;
} & Omit<TextInputProps, "secureTextEntry" | "style" | "className">;

const AuthTextField = ({
  label,
  icon,
  isPassword,
  hint,
  error,
  id,
  ...inputProps
}: AuthTextFieldProps) => {
  const [hidden, setHidden] = useState(true);

  return (
    <View className="gap-1.5">
      <Text
        nativeID={id ? `${id}-label` : undefined}
        className="text-xs font-semibold"
        style={{ color: authPalette.textLabel }}
      >
        {label}
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          backgroundColor: authPalette.fieldBg,
          borderWidth: 1,
          borderColor: error ? authPalette.error : authPalette.fieldBorder,
          height: 50,
          paddingHorizontal: 14,
        }}
        className="rounded-xl"
      >
        <Ionicons name={icon} size={IconSizes.md} color={authPalette.textMuted} />
        <TextInput
          {...inputProps}
          accessibilityLabelledBy={id ? `${id}-label` : undefined}
          secureTextEntry={isPassword ? hidden : false}
          placeholderTextColor={authPalette.textMuted}
          className="flex-1 text-sm"
          style={{ color: authPalette.textPrimary }}
        />
        {isPassword ? (
          <Pressable
            onPress={() => setHidden((prev) => !prev)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={hidden ? "Show password" : "Hide password"}
          >
            <Ionicons
              name={hidden ? "eye-outline" : "eye-off-outline"}
              size={IconSizes.md}
              color={authPalette.textMuted}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text className="text-2xs" style={{ color: authPalette.error }}>
          {error}
        </Text>
      ) : hint ? (
        <Text className="text-2xs" style={{ color: authPalette.textHint }}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
};

export default AuthTextField;
