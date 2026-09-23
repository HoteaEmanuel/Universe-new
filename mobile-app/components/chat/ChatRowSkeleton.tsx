import { View } from "react-native";
import Animated, { useAnimatedStyle, withRepeat, withTiming, useSharedValue, Easing } from "react-native-reanimated";
import { useEffect } from "react";
import { Colors } from "@constants/colors";
import { useAppColorScheme } from "@hooks/useAppColorScheme";

const AVATAR_SIZE = 52;

// Mirrors frontend/src/features/chat/ChatContainer.tsx's ChatListSkeleton
// (avatar circle + two text bars per row), adapted to RN with a Reanimated
// opacity pulse standing in for web's Skeleton shimmer.
const ChatRowSkeleton = () => {
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
    <Animated.View className="flex-row items-center gap-3 px-4 py-2.5" style={animatedStyle}>
      <View
        className="rounded-full"
        style={{ width: AVATAR_SIZE, height: AVATAR_SIZE, backgroundColor: theme.borderColor }}
      />
      <View className="flex-1 gap-2">
        <View className="h-3.5 w-1/3 rounded-full" style={{ backgroundColor: theme.borderColor }} />
        <View className="h-3 w-2/3 rounded-full" style={{ backgroundColor: theme.borderColor }} />
      </View>
    </Animated.View>
  );
};

export default ChatRowSkeleton;
