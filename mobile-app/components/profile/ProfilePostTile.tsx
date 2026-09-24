import { View, Text, Image } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { type Post } from "@universe/shared";
import { Colors } from "@constants/colors";
import { IconSizes } from "@constants/iconSizes";
import { PressableScale } from "@lib/styled";
import { useAppColorScheme } from "@hooks/useAppColorScheme";

type ProfilePostTileProps = { post: Post };

// Mirrors frontend/src/features/profile/ProfilePostGrid.tsx's
// ProfilePostTile — a fixed aspect-square tile (image cover-cropped, or a
// clamped title/body excerpt for text-only and opportunity posts) rather
// than rendering the full PostCard into a grid cell, which stretched badge
// rows/apply buttons and left plain posts looking empty.
const ProfilePostTile = ({ post }: ProfilePostTileProps) => {
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;
  const hasImage = post.imagesUrls?.length > 0;

  return (
    <PressableScale
      onPress={() => router.push(`/post-details/${post.id}`)}
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
    </PressableScale>
  );
};

export default ProfilePostTile;
