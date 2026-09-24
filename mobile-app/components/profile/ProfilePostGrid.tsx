import type { ReactNode } from "react";
import { View, Text, Image, type ImageSourcePropType, type LayoutChangeEvent } from "react-native";
import { router } from "expo-router";
import Svg, { Defs, RadialGradient, Stop, Rect } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { type Post } from "@universe/shared";
import { Colors } from "@constants/colors";
import { IconSizes } from "@constants/iconSizes";
import { PressableScale } from "@lib/styled";
import ProfilePostTile from "@components/profile/ProfilePostTile";
import { useAppColorScheme } from "@hooks/useAppColorScheme";
import studentLifeIllustration from "@/assets/images/profile-empty-state/student-life-documentary-photos.webp";
import constellationIllustration from "@/assets/images/profile-empty-state/incomplete-constellation-color.webp";

// Mirrors frontend/src/features/profile/ProfilePostGrid.tsx's two empty
// states — the same illustrations, so a visitor sees a consistent "nothing
// here" moment across platforms: "student-life" for your own empty grid
// (with a CTA into composing), "constellation" for someone else's.
type EmptyIllustration = "student-life" | "constellation";

const ILLUSTRATIONS: Record<EmptyIllustration, ImageSourcePropType> = {
  "student-life": studentLifeIllustration,
  constellation: constellationIllustration,
};

type ProfilePostGridProps = {
  posts?: Post[];
  emptyTitle: ReactNode;
  emptyDescription: string;
  emptyIllustration?: EmptyIllustration;
  showCreateCta?: boolean;
  selectable?: boolean;
  selectMode?: boolean;
  selectedIds?: Set<string>;
  onLongPressTile?: (postId: string) => void;
  onToggleSelect?: (postId: string) => void;
  onLayout?: (event: LayoutChangeEvent) => void;
};

// A plain two-column split (not FlatList's numColumns) so the grid has no
// scroll container of its own — the profile screen wraps everything in one
// ScrollView, and nesting a virtualized list inside that would fight it for
// the scroll gesture instead of the whole page scrolling as one.
const ProfilePostGrid = ({
  posts = [],
  emptyTitle,
  emptyDescription,
  emptyIllustration,
  showCreateCta = false,
  selectable = false,
  selectMode = false,
  selectedIds,
  onLongPressTile,
  onToggleSelect,
  onLayout,
}: ProfilePostGridProps) => {
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;

  if (posts.length === 0) {
    return (
      <View className="items-center gap-5 px-8 py-6">
        {emptyIllustration ? (
          <View
            className="w-full max-w-sm items-center justify-center overflow-hidden rounded-2xl"
            style={{ minHeight: 180 }}
          >
            <Svg width="100%" height="100%" style={{ position: "absolute" }}>
              <Defs>
                <RadialGradient id="emptyGlowWarm" cx="28%" cy="30%" r="65%">
                  <Stop offset="0" stopColor="#fbbf24" stopOpacity={0.22} />
                  <Stop offset="1" stopColor="#fbbf24" stopOpacity={0} />
                </RadialGradient>
                <RadialGradient id="emptyGlowCool" cx="75%" cy="70%" r="65%">
                  <Stop offset="0" stopColor={Colors.primary} stopOpacity={0.22} />
                  <Stop offset="1" stopColor={Colors.primary} stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#emptyGlowWarm)" />
              <Rect width="100%" height="100%" fill="url(#emptyGlowCool)" />
            </Svg>
            <Image
              source={ILLUSTRATIONS[emptyIllustration]}
              style={{ width: "70%", height: 180 }}
              resizeMode="contain"
            />
          </View>
        ) : (
          <Ionicons name="images-outline" size={IconSizes["2xl"]} color={theme.iconMuted} />
        )}

        <View className="items-center gap-2">
          <Text className="text-center text-base font-semibold" style={{ color: theme.title }}>
            {emptyTitle}
          </Text>
          <Text className="text-center text-sm" style={{ color: theme.tabIconColour }}>
            {emptyDescription}
          </Text>
        </View>

        {showCreateCta ? (
          <PressableScale
            onPress={() => router.push("/create-post")}
            className="flex-row items-center gap-2 rounded-full px-5 py-2.5"
            style={{ backgroundColor: Colors.primary }}
          >
            <Ionicons name="add" size={IconSizes.sm} color="#ffffff" />
            <Text className="text-sm font-semibold" style={{ color: "#ffffff" }}>
              Share something with your friends
            </Text>
          </PressableScale>
        ) : null}
      </View>
    );
  }

  const leftColumn = posts.filter((_, index) => index % 2 === 0);
  const rightColumn = posts.filter((_, index) => index % 2 === 1);

  const renderTile = (post: Post) => (
    <ProfilePostTile
      key={post.id}
      post={post}
      selectable={selectable}
      selectMode={selectMode}
      selected={selectedIds?.has(post.id)}
      onLongPress={() => onLongPressTile?.(post.id)}
      onToggleSelect={() => onToggleSelect?.(post.id)}
    />
  );

  return (
    <View className="flex-row gap-3 px-4" onLayout={onLayout}>
      <View className="flex-1 gap-3">{leftColumn.map(renderTile)}</View>
      <View className="flex-1 gap-3">{rightColumn.map(renderTile)}</View>
    </View>
  );
};

export default ProfilePostGrid;
