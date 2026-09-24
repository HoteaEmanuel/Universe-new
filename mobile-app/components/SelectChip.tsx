import { Text } from "react-native";
import { Colors } from "@constants/colors";
import { PressableScale } from "@lib/styled";
import { useAppColorScheme } from "@hooks/useAppColorScheme";

type SelectChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

// Shared selectable-pill primitive: FiltersSheet's opportunity/workplace
// filters and CreatePost's opportunity-type/workplace pickers are the same
// single-select chip interaction, so both render through this one component.
const SelectChip = ({ label, selected, onPress }: SelectChipProps) => {
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;
  return (
    <PressableScale
      onPress={onPress}
      className="rounded-full px-3.5 py-2"
      style={{
        backgroundColor: selected ? Colors.primary : theme.background,
        borderWidth: 1,
        borderColor: selected ? Colors.primary : theme.borderColor,
      }}
    >
      <Text className="text-xs font-semibold" style={{ color: selected ? "#ffffff" : theme.text }}>
        {label}
      </Text>
    </PressableScale>
  );
};

export default SelectChip;
