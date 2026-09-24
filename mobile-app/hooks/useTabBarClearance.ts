import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TAB_BAR_BOTTOM_GAP, TAB_BAR_HEIGHT } from "@constants/tabBar";

// How much space a fixed-position footer rendered on a dashboard tab screen
// (e.g. ComposerSubmitBar on the Create tab) needs to add below itself so
// its buttons clear GlassTabBar instead of sitting underneath it.
export const useTabBarClearance = () => {
  const insets = useSafeAreaInsets();
  return TAB_BAR_HEIGHT + Math.max(insets.bottom, TAB_BAR_BOTTOM_GAP);
};
