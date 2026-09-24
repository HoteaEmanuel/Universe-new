import { useRef } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { useTabBarVisibilityStore } from "@store/tabBarVisibilityStore";

const DIRECTION_THRESHOLD = 4;
const TOP_REVEAL_OFFSET = 8;

// Attach the returned handler to a screen's FlatList/ScrollView onScroll
// (with scrollEventThrottle={16}) to drive GlassTabBar's hide-on-scroll-down /
// reveal-on-scroll-up behavior, matching the approved mockup and the Uber
// reference the user pointed at.
export const useHideTabBarOnScroll = () => {
  const setHidden = useTabBarVisibilityStore((s) => s.setHidden);
  const lastOffsetRef = useRef(0);

  return (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = event.nativeEvent.contentOffset.y;
    const delta = offset - lastOffsetRef.current;

    if (offset <= TOP_REVEAL_OFFSET) {
      setHidden(false);
    } else if (delta > DIRECTION_THRESHOLD) {
      setHidden(true);
    } else if (delta < -DIRECTION_THRESHOLD) {
      setHidden(false);
    }

    lastOffsetRef.current = offset;
  };
};
