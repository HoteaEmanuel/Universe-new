import type { ReactNode } from "react";
import { View, Text, Pressable } from "react-native";
import Animated, { LinearTransition, FadeIn, FadeOut } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@constants/colors";
import { IconSizes } from "@constants/iconSizes";
import { useAppColorScheme } from "@hooks/useAppColorScheme";

type ExpandingSectionProps = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  summary?: string;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
};

// A closed row that snaps open into a grid-locked panel on tap — the
// direction locked for the compose screen's Photos/Location/Tags sections.
// A completed row keeps its summary chip visible even while collapsed, so
// a filled-in section stays confirmed rather than reverting to a bare label.
const ExpandingSection = ({
  label,
  icon,
  summary,
  expanded,
  onToggle,
  children,
}: ExpandingSectionProps) => {
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;

  return (
    <Animated.View
      layout={LinearTransition}
      className="overflow-hidden rounded-xl"
      style={{ borderWidth: 1, borderColor: theme.borderColor, backgroundColor: theme.uiBackground }}
    >
      <Pressable
        onPress={onToggle}
        className="flex-row items-center gap-3 px-3.5 py-3"
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <View
          className="items-center justify-center rounded-full p-2"
          style={{ backgroundColor: `${Colors.primary}1f` }}
        >
          <Ionicons name={icon} size={IconSizes.md} color={Colors.primary} />
        </View>
        <Text className="flex-1 text-sm font-semibold" style={{ color: theme.title }}>
          {label}
        </Text>
        {summary ? (
          <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: Colors.primary }}>
            <Text className="text-2xs font-semibold" style={{ color: "#ffffff" }}>
              {summary}
            </Text>
          </View>
        ) : null}
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={IconSizes.sm}
          color={theme.iconMuted}
        />
      </Pressable>
      {expanded ? (
        <Animated.View
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(100)}
          className="gap-2 px-3.5 pb-3.5"
        >
          {children}
        </Animated.View>
      ) : null}
    </Animated.View>
  );
};

export default ExpandingSection;
