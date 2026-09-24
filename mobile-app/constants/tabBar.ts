// Shared between GlassTabBar (the floating pill itself) and any fixed-position
// footer that needs to clear it - it floats over screen content rather than
// making expo-router/react-navigation reserve layout space, since a custom
// `tabBar` render prop opts out of that automatic content inset.
export const TAB_BAR_HEIGHT = 62;
export const TAB_BAR_RADIUS = 31;
// How far the bar travels off-screen when hidden - large enough to clear its
// own height plus the bottom safe-area padding on any device.
export const TAB_BAR_HIDE_TRAVEL = 120;
// Gap between the bar's bottom edge and the safe-area inset it floats above.
export const TAB_BAR_BOTTOM_GAP = 8;
