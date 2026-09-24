import { View, Text, Image } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { type Post } from "@universe/shared";
import { Colors } from "@constants/colors";
import { IconSizes } from "@constants/iconSizes";
import { PressableScale } from "@lib/styled";
import { useAppColorScheme } from "@hooks/useAppColorScheme";

type ProfilePostTileProps = {
  post: Post;
  selectable?: boolean;
  selectMode?: boolean;
  selected?: boolean;
  onLongPress?: () => void;
  onToggleSelect?: () => void;
};

// Mirrors frontend/src/features/profile/ProfilePostGrid.tsx's
// ProfilePostTile — a fixed aspect-square tile (image cover-cropped, or a
// clamped title/body excerpt for text-only and opportunity posts) rather
// than rendering the full PostCard into a grid cell, which stretched badge
// rows/apply buttons and left plain posts looking empty.
const ProfilePostTile = ({
  post,
  selectable,
  selectMode,
  selected,
  onLongPress,
  onToggleSelect,
}: ProfilePostTileProps) => {
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;
  const hasImage = post.imagesUrls?.length > 0;

  const handlePress = () => {
    if (selectMode) onToggleSelect?.();
    else router.push(`/post-details/${post.id}`);
  };

  return (
    <PressableScale
      onPress={handlePress}
      onLongPress={selectable ? onLongPress : undefined}
      style={{ aspectRatio: 1, borderRadius: 10, backgroundColor: theme.uiBackground }}
    >
      {hasImage ? (

        <View style={{ width: "100%", height: "100%", borderRadius: 10, overflow: "hidden" }}>
          <Image source={{ uri: post.imagesUrls[0] }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
        </View>
      ) : (
        <View className="flex-1 justify-center gap-1 p-3">
          <Text numberOfLines={3} className="text-xs font-semibold" style={{ color: theme.title }}>
            {post.title}
          </Text>
          {post.body ? (
            <Text numberOfLines={3} className="text-2xs" style={{ color: theme.tabIconColour }}>
              {post.body}
            </Text>
          ) : null}
        </View>
      )}

      {post.imagesUrls?.length > 1 ? (
        <View className="absolute right-2 top-2">
          <Ionicons name="images" size={IconSizes.sm} color="#ffffff" />
        </View>
      ) : null}

      {selectMode ? (
        <>
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 10,
              backgroundColor: selected ? "rgba(104, 73, 167, 0.28)" : "rgba(3, 7, 18, 0.25)",
              borderWidth: selected ? 2 : 0,
              borderColor: Colors.primary,
            }}
          />
          <View
            pointerEvents="none"
            className="absolute left-2 top-2 items-center justify-center rounded-full"
            style={{
              width: 22,
              height: 22,
              backgroundColor: selected ? Colors.primary : "rgba(3, 7, 18, 0.4)",
              borderWidth: selected ? 0 : 1.5,
              borderColor: "#ffffff",
            }}
          >
            {selected ? <Ionicons name="checkmark" size={IconSizes.xs} color="#ffffff" /> : null}
          </View>
        </>
      ) : null}
    </PressableScale>
  );
};

export default ProfilePostTile;
