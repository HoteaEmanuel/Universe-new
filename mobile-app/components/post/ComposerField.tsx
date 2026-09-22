import { View, Text, TextInput, useColorScheme, type TextInputProps } from "react-native";
import { Colors } from "../../constants/colors";

type ComposerFieldProps = {
  label: string;
  error?: string;
  maxLength?: number;
  currentLength?: number;
} & Omit<TextInputProps, "style" | "className" | "placeholderTextColor">;

// The shared single/multiline text field for the compose screen — title,
// body, location, and tags all render through this one component rather
// than four near-identical ones, matching web's FormField/TextareaField
// split collapsed into one RN TextInput (multiline is just a prop there).
const ComposerField = ({
  label,
  error,
  maxLength,
  currentLength,
  multiline,
  ...inputProps
}: ComposerFieldProps) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;

  return (
    <View className="gap-1.5">
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-semibold" style={{ color: theme.title }}>
          {label}
        </Text>
        {maxLength ? (
          <Text className="text-2xs" style={{ color: theme.tabIconColour }}>
            {currentLength ?? 0}/{maxLength}
          </Text>
        ) : null}
      </View>
      <TextInput
        {...inputProps}
        multiline={multiline}
        maxLength={maxLength}
        placeholderTextColor={theme.tabIconColour}
        className={multiline ? "rounded-xl px-3.5 py-3 text-sm" : "rounded-xl px-3.5 text-sm"}
        style={{
          backgroundColor: theme.uiBackground,
          borderWidth: 1,
          borderColor: error ? Colors.warning : theme.borderColor,
          color: theme.title,
          minHeight: multiline ? 96 : 48,
          textAlignVertical: multiline ? "top" : "center",
        }}
      />
      {error ? (
        <Text className="text-2xs" style={{ color: Colors.warning }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
};

export default ComposerField;
