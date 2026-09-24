import { View } from "react-native";
import Animated, { useAnimatedStyle, withRepeat, withTiming, useSharedValue, Easing } from "react-native-reanimated";
import { useEffect } from "react";
import { Colors } from "@constants/colors";
import { useAppColorScheme } from "@hooks/useAppColorScheme";

// Mirrors OpportunityCardSkeleton's opacity-pulse approach, shaped like an
// EventCard (cover block, then badge/title/meta lines) instead.
const EventCardSkeleton = () => {
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      className="w-full overflow-hidden rounded-2xl"
      style={[{ backgroundColor: theme.uiBackground, borderWidth: 1, borderColor: theme.borderColor }, animatedStyle]}
    >
      <View style={{ width: "100%", aspectRatio: 16 / 9, backgroundColor: theme.borderColor }} />
      <View className="gap-2 p-3.5">
        <View className="h-4 w-1/3 rounded-full" style={{ backgroundColor: theme.borderColor }} />
        <View className="h-3 w-3/4 rounded-full" style={{ backgroundColor: theme.borderColor }} />
        <View className="h-2.5 w-1/2 rounded-full" style={{ backgroundColor: theme.borderColor }} />
      </View>
    </Animated.View>
  );
};

export default EventCardSkeleton;
