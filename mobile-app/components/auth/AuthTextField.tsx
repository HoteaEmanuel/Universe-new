import { useState } from "react";
import { View, Text, TextInput, Pressable, type TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { authPalette } from "./authPalette";

type AuthTextFieldProps = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
  hint?: string;
} & Omit<TextInputProps, "secureTextEntry" | "style" | "className">;

const AuthTextField = ({ label, icon, isPassword, hint, id, ...inputProps }: AuthTextFieldProps) => {
  const [hidden, setHidden] = useState(true);

  return (
    <View className="gap-1.5">
      <Text
        nativeID={id ? `${id}-label` : undefined}
        style={{ fontSize: 12, fontWeight: "600", color: authPalette.textLabel }}
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
          borderColor: authPalette.fieldBorder,
          height: 50,
          paddingHorizontal: 14,
        }}
        className="rounded-xl"
      >
        <Ionicons name={icon} size={18} color={authPalette.textMuted} />
        <TextInput
          {...inputProps}
          accessibilityLabelledBy={id ? `${id}-label` : undefined}
          secureTextEntry={isPassword ? hidden : false}
          placeholderTextColor={authPalette.textMuted}
          style={{ flex: 1, fontSize: 14, color: authPalette.textPrimary }}
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
              size={19}
              color={authPalette.textMuted}
            />
          </Pressable>
        ) : null}
      </View>
      {hint ? <Text style={{ fontSize: 11, color: authPalette.textHint }}>{hint}</Text> : null}
    </View>
  );
};

export default AuthTextField;
