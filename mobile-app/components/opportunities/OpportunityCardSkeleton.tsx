import { View } from "react-native";
import Animated, { useAnimatedStyle, withRepeat, withTiming, useSharedValue, Easing } from "react-native-reanimated";
import { useEffect } from "react";
import { Colors } from "@constants/colors";
import { useAppColorScheme } from "@hooks/useAppColorScheme";

// Mirrors ChatRowSkeleton's opacity-pulse approach, shaped like a PostCard
// (avatar+name row, then a body block) rather than a chat row — matches web's
// PostSkeleton usage on the equivalent loading state.
const OpportunityCardSkeleton = () => {
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
      className="w-full gap-3 rounded-2xl p-4"
      style={[{ backgroundColor: theme.uiBackground, borderWidth: 1, borderColor: theme.borderColor }, animatedStyle]}
    >
      <View className="flex-row items-center gap-3">
        <View className="rounded-full" style={{ width: 36, height: 36, backgroundColor: theme.borderColor }} />
        <View className="flex-1 gap-2">
          <View className="h-3 w-1/3 rounded-full" style={{ backgroundColor: theme.borderColor }} />
          <View className="h-2.5 w-1/4 rounded-full" style={{ backgroundColor: theme.borderColor }} />
        </View>
      </View>
      <View className="h-24 w-full rounded-xl" style={{ backgroundColor: theme.borderColor }} />
      <View className="h-3 w-3/4 rounded-full" style={{ backgroundColor: theme.borderColor }} />
      <View className="h-3 w-1/2 rounded-full" style={{ backgroundColor: theme.borderColor }} />
    </Animated.View>
  );
};

export default OpportunityCardSkeleton;
