import { View, Text } from "react-native";
import { Colors } from "@constants/colors";
import { PressableScale } from "@lib/styled";
import { useAppColorScheme } from "@hooks/useAppColorScheme";

export type ComposerPostType = "standard" | "opportunity";

type PostTypeToggleProps = {
  value: ComposerPostType;
  onChange: (next: ComposerPostType) => void;
};

const OPTIONS: { value: ComposerPostType; label: string }[] = [
  { value: "standard", label: "Post" },
  { value: "opportunity", label: "Job or internship" },
];

// Segmented Post/Opportunity toggle, only rendered for accounts allowed to
// publish opportunities — mirrors web's inline-flex pill in CreatePost.tsx.
const PostTypeToggle = ({ value, onChange }: PostTypeToggleProps) => {
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;

  return (
    <View
      className="flex-row self-start rounded-full p-1"
      style={{ backgroundColor: theme.uiBackground, borderWidth: 1, borderColor: theme.borderColor }}
    >
      {OPTIONS.map((option) => {
        const selected = value === option.value;
        return (
          <PressableScale
            key={option.value}
            onPress={() => onChange(option.value)}
            className="rounded-full px-4 py-2"
            style={{ backgroundColor: selected ? Colors.primary : "transparent" }}
          >
            <Text className="text-xs font-semibold" style={{ color: selected ? "#ffffff" : theme.text }}>
              {option.label}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
};

export default PostTypeToggle;
