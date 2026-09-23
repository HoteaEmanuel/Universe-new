import { View, TextInput, type TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@constants/colors";
import { IconSizes } from "@constants/iconSizes";
import { useAppColorScheme } from "@hooks/useAppColorScheme";

type SearchInputProps = Omit<TextInputProps, "style" | "className" | "placeholderTextColor">;

// Mobile's first SearchInput — mirrors frontend/src/components/SearchInput.tsx
// visually (icon + rounded field) but built on Colors.light/dark + Uniwind
// spacing, this app's established convention, rather than reusing
// ComposerField (which is label+error oriented) or AuthTextField (hardcoded
// to authPalette).
const SearchInput = ({ value, ...inputProps }: SearchInputProps) => {
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;

  return (
    <View
      className="flex-row items-center gap-2 rounded-xl px-3.5"
      style={{ backgroundColor: theme.uiBackground, borderWidth: 1, borderColor: theme.borderColor }}
    >
      <Ionicons name="search" size={IconSizes.md} color={theme.tabIconColour} />
      <TextInput
        {...inputProps}
        value={value}
        placeholderTextColor={theme.tabIconColour}
        className="flex-1 py-2.5 text-sm"
        style={{ color: theme.title }}
      />
    </View>
  );
};

export default SearchInput;
