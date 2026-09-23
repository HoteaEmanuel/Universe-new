import { useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { runOnJS } from "react-native-worklets";
import Svg, { Line } from "react-native-svg";
import { PressableScale } from "@lib/styled";
import { IconSizes } from "@constants/iconSizes";

const CELEBRATE_SIZE = 56;
// Eight lines radiating from the heart icon on a 100x100 viewBox, same
// layout as the web like-celebrate burst.
const CELEBRATE_LINES: [number, number, number, number][] = [
  [94, 50, 82, 50],
  [81, 81, 73, 73],
  [50, 94, 50, 82],
  [19, 81, 27, 73],
  [6, 50, 18, 50],
  [19, 19, 27, 27],
  [50, 6, 50, 18],
  [81, 19, 73, 27],
];

type AnimatedLikeButtonProps = {
  liked: boolean;
  color: string;
  mutedColor: string;
  onPress: () => void;
  size?: number;
  hitSlop?: number;
};

// Watches `liked` rather than being told when to animate, so it plays the
// pop/celebrate burst on every unliked->liked transition regardless of
// whether that came from this button's own press or an optimistic cache
// update landing from elsewhere.
const AnimatedLikeButton = ({
  liked,
  color,
  mutedColor,
  onPress,
  size = IconSizes["2xl"],
  hitSlop = 6,
}: AnimatedLikeButtonProps) => {
  const [showCelebrate, setShowCelebrate] = useState(false);
  const heartScale = useSharedValue(1);
  const celebrateScale = useSharedValue(0);
  const celebrateOpacity = useSharedValue(0);
  const wasLiked = useRef(liked);

  useEffect(() => {
    if (liked && !wasLiked.current) {
      heartScale.value = withSequence(
        withTiming(1.35, { duration: 120, easing: Easing.out(Easing.quad) }),
        withTiming(0.92, { duration: 100 }),
        withTiming(1, { duration: 180 }),
      );

      setShowCelebrate(true);
      celebrateScale.value = 0;
      celebrateOpacity.value = 0;
      celebrateScale.value = withTiming(1.4, { duration: 500, easing: Easing.out(Easing.quad) });
      celebrateOpacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0, { duration: 300 }, (finished) => {
          if (finished) runOnJS(setShowCelebrate)(false);
        }),
      );
    }
    wasLiked.current = liked;
  }, [liked, heartScale, celebrateScale, celebrateOpacity]);

  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));
  const celebrateAnimatedStyle = useAnimatedStyle(() => ({
    opacity: celebrateOpacity.value,
    transform: [{ scale: celebrateScale.value }],
  }));

  return (
    <PressableScale onPress={onPress} hitSlop={hitSlop} className="relative">
      <Animated.View style={heartAnimatedStyle}>
        <Ionicons name={liked ? "heart" : "heart-outline"} size={size} color={liked ? color : mutedColor} />
      </Animated.View>
      {showCelebrate ? (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              left: "50%",
              top: "50%",
              width: CELEBRATE_SIZE,
              height: CELEBRATE_SIZE,
              marginLeft: -CELEBRATE_SIZE / 2,
              marginTop: -CELEBRATE_SIZE / 2,
            },
            celebrateAnimatedStyle,
          ]}
        >
          <Svg width={CELEBRATE_SIZE} height={CELEBRATE_SIZE} viewBox="0 0 100 100">
            {CELEBRATE_LINES.map(([x1, y1, x2, y2]) => (
              <Line
                key={`${x1}-${y1}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={color}
                strokeWidth={6}
                strokeLinecap="round"
              />
            ))}
          </Svg>
        </Animated.View>
      ) : null}
    </PressableScale>
  );
};

export default AnimatedLikeButton;
