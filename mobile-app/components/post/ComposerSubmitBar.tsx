import { View, Text, ActivityIndicator, useColorScheme } from "react-native";
import Svg, { Defs, LinearGradient, Stop, Rect } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/colors";
import { PressableScale } from "../../lib/styled";
import { IconSizes } from "../../constants/iconSizes";

// Same violet brand ramp global.css aliases from Tailwind's built-in scale
// (--color-brand-500/--color-brand-700) rather than inventing new stops.
// brand-500 -> brand-800: close enough in value that white label text stays
// legible across the whole width, unlike the earlier brand-400 start, which
// was pale enough to look like two flat color blocks instead of a gradient.
const GRADIENT_START = "#8b5cf6";
const GRADIENT_END = "#5b21b6";

const PILL_RADIUS = 12;

type ComposerSubmitBarProps = {
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel?: string;
  disabled?: boolean;
  loading?: boolean;
};

// Pins to the bottom of the compose screen so Cancel/Post stay thumb-reachable
// regardless of how far the accordion sections above have scrolled.
const ComposerSubmitBar = ({
  onCancel,
  onSubmit,
  submitLabel = "Post",
  disabled,
  loading,
}: ComposerSubmitBarProps) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;

  return (
    <View
      className="flex-row items-center gap-3 px-gutter py-4"
      style={{
        backgroundColor: theme.background,
        borderTopWidth: 1,
        borderTopColor: theme.borderColor,
      }}
    >
      <PressableScale onPress={onCancel} className="px-2 py-2.5" enabled={!loading}>
        <Text className="text-sm font-semibold" style={{ color: theme.text }}>
          Cancel
        </Text>
      </PressableScale>
      <View
        className="ml-auto flex-1"
        style={{
          borderRadius: PILL_RADIUS,
          shadowColor: GRADIENT_END,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: disabled || loading ? 0 : 0.35,
          shadowRadius: 10,
          elevation: disabled || loading ? 0 : 6,
        }}
      >
        <PressableScale
          onPress={onSubmit}
          enabled={!disabled && !loading}
          style={{ opacity: disabled || loading ? 0.6 : 1 }}
        >
          <View
            className="items-center justify-center px-12 "
            style={{ borderRadius: PILL_RADIUS, overflow: "hidden" }}
          >
            <Svg width="100%" height="100%" style={{ position: "absolute" }}>
              <Defs>
                <LinearGradient id="postButtonGradient" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0" stopColor={GRADIENT_START} />
                  <Stop offset="1" stopColor={GRADIENT_END} />
                </LinearGradient>
              </Defs>
              <Rect
                width="100%"
                height="100%"
                rx={PILL_RADIUS}
                ry={PILL_RADIUS}
                fill="url(#postButtonGradient)"
              />
            </Svg>
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <View className="flex-row items-center gap-2">
                <Text className="text-base font-bold" style={{ color: "#ffffff" }}>
                  {submitLabel}
                </Text>
                <Ionicons name="paper-plane" size={IconSizes.md} color="#ffffff" />
              </View>
            )}
          </View>
        </PressableScale>
      </View>
    </View>
  );
};

export default ComposerSubmitBar;
