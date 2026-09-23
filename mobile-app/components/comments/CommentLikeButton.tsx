import { useEffect, useRef } from "react";
import { Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { PressableScale } from "@lib/styled";
import { formatCount } from "@universe/shared";

type CommentLikeButtonProps = {
  liked: boolean;
  likesCount: number;
  onPress: () => void;
  color: string;
  mutedColor: string;
  size?: number;
};

// A smaller, burst-free sibling of AnimatedLikeButton (components/post/) —
// the radiating-burst moment is reserved for the single per-post like; a
// list of comment rows repeating it would be noisy, so this keeps only the
// scale-pop half of that motion language at comment scale.
const CommentLikeButton = ({
  liked,
  likesCount,
  onPress,
  color,
  mutedColor,
  size = 14,
}: CommentLikeButtonProps) => {
  const scale = useSharedValue(1);
  const wasLiked = useRef(liked);

  useEffect(() => {
    if (liked && !wasLiked.current) {
      scale.value = withSequence(
        withTiming(1.3, { duration: 110, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 150 }),
      );
    }
    wasLiked.current = liked;
  }, [liked, scale]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <PressableScale
      onPress={onPress}
      hitSlop={8}
      className="items-center gap-0.5"
      aria-label={liked ? "Unlike comment" : "Like comment"}
    >
      <Animated.View style={animatedStyle}>
        <Ionicons
          name={liked ? "heart" : "heart-outline"}
          size={size}
          color={liked ? color : mutedColor}
        />
      </Animated.View>
      {likesCount > 0 ? (
        <Text
          className="text-[10px] leading-none"
          style={{ color: liked ? color : mutedColor }}
        >
          {formatCount(likesCount)}
        </Text>
      ) : null}
    </PressableScale>
  );
};

export default CommentLikeButton;
