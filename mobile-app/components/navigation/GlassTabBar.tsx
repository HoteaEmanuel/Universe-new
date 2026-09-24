import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import type { BottomTabBarProps } from "expo-router/js-tabs";
import { Colors } from "@constants/colors";
import { IconSizes } from "@constants/iconSizes";
import { useAppColorScheme } from "@hooks/useAppColorScheme";
import { useTabBarVisibilityStore } from "@store/tabBarVisibilityStore";
import { useAuthStore } from "@store/authStore";
import UserAvatar, { type AvatarUser } from "@components/UserAvatar";
import { TAB_BAR_HEIGHT, TAB_BAR_RADIUS, TAB_BAR_HIDE_TRAVEL, TAB_BAR_BOTTOM_GAP } from "@constants/tabBar";

type IconName = keyof typeof Ionicons.glyphMap;

// Keyed by route name (the dashboard screen's filename), matching the
// focused/unfocused Ionicons pairs the old _layout.jsx screenOptions used.
const TAB_ICONS: Record<string, { active: IconName; inactive: IconName }> = {
  home: { active: "home", inactive: "home-outline" },
  chat: { active: "chatbubble-ellipses", inactive: "chatbubble-ellipses-outline" },
  opportunities: { active: "briefcase", inactive: "briefcase-outline" },
  events: { active: "calendar", inactive: "calendar-outline" },
  profile: { active: "person", inactive: "person-outline" },
  "create-post": { active: "add-circle", inactive: "add-circle-outline" },
};

// Floating, blurred replacement for expo-router's default <Tabs> bar:
// elevated off the screen edge with visible side margins, active tab shown
// as icon+label at a larger size, inactive tabs as icon-only. Slides away
// on scroll-down and back on scroll-up via useTabBarVisibilityStore, which
// each dashboard screen's list/scroll view feeds through useHideTabBarOnScroll.
const GlassTabBar = ({ state, descriptors, navigation, insets }: BottomTabBarProps) => {
  const colorScheme = useAppColorScheme();
  const theme = Colors[colorScheme] || Colors.light;
  const isDark = colorScheme === "dark";
  const hidden = useTabBarVisibilityStore((s) => s.hidden);
  const authUser = useAuthStore((s) => s.user);

  useEffect(() => {
    useTabBarVisibilityStore.getState().setHidden(false);
  }, [state.index]);

  const hideProgress = useSharedValue(0);
  useEffect(() => {
    hideProgress.value = withTiming(hidden ? 1 : 0, { duration: 260, easing: Easing.out(Easing.cubic) });
  }, [hidden, hideProgress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 1 - hideProgress.value,
    transform: [{ translateY: hideProgress.value * TAB_BAR_HIDE_TRAVEL }],
  }));

  return (
    <Animated.View
      pointerEvents={hidden ? "none" : "auto"}
      className="absolute bottom-0 left-0 right-0 items-center"
      style={[{ paddingBottom: Math.max(insets.bottom, TAB_BAR_BOTTOM_GAP) }, animatedStyle]}
    >
      <View
        className="flex-row items-center overflow-hidden border"
        style={{
          height: TAB_BAR_HEIGHT,
          borderRadius: TAB_BAR_RADIUS,
          borderColor: theme.borderColor,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.22,
          shadowRadius: 24,
          elevation: 10,
        }}
      >
        <BlurView
          intensity={isDark ? 46 : 60}
          tint={isDark ? "dark" : "light"}
          className="absolute inset-0"
        />
        <View
          className="absolute inset-0"
          style={{ backgroundColor: isDark ? "rgba(18,15,26,0.55)" : "rgba(255,255,255,0.62)" }}
        />

        <View className="flex-row items-center gap-1 px-2.5">
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const focused = state.index === index;
            const icons = TAB_ICONS[route.name] ?? TAB_ICONS.home;
            const label = typeof options.title === "string" ? options.title : route.name;

            const onPress = () => {
              const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            };

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityState={focused ? { selected: true } : {}}
                accessibilityLabel={
                  typeof options.tabBarAccessibilityLabel === "string" ? options.tabBarAccessibilityLabel : label
                }
                className="items-center justify-center px-2.5 py-1.5"
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
              >
                {route.name === "profile" ? (
                  <UserAvatar
                    user={(authUser as AvatarUser | null) ?? null}
                    size={focused ? IconSizes.xl : IconSizes.lg}
                    iconColor={focused ? theme.tabIconColourFocused : theme.tabIconColour}
                  />
                ) : (
                  <Ionicons
                    name={focused ? icons.active : icons.inactive}
                    size={focused ? IconSizes.xl : IconSizes.lg}
                    color={focused ? theme.tabIconColourFocused : theme.tabIconColour}
                  />
                )}
                {focused ? (
                  <Text
                    className="mt-0.5 text-[10px] font-semibold"
                    numberOfLines={1}
                    style={{ color: theme.tabIconColourFocused }}
                  >
                    {label}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>
    </Animated.View>
  );
};

export default GlassTabBar;
