import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { type Post } from "@universe/shared";
import { Colors } from "@constants/colors";
import { IconSizes } from "@constants/iconSizes";
import ProfilePostTile from "@components/profile/ProfilePostTile";
import { useAppColorScheme } from "@hooks/useAppColorScheme";

type ProfilePostGridProps = {
  posts?: Post[];
  emptyTitle: string;
  emptyDescription: string;
};

// A plain two-column split (not FlatList's numColumns) so the grid has no
// scroll container of its own — the profile screen wraps everything in one
// ScrollView, and nesting a virtualized list inside that would fight it for
// the scroll gesture instead of the whole page scrolling as one.
const ProfilePostGrid = ({ posts = [], emptyTitle, emptyDescription }: ProfilePostGridProps) => {
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;

  if (posts.length === 0) {
    return (
      <View className="items-center gap-2 px-8 py-12">
        <Ionicons name="images-outline" size={IconSizes["2xl"]} color={theme.iconMuted} />
        <Text className="text-center text-base font-semibold" style={{ color: theme.title }}>
          {emptyTitle}
        </Text>
        <Text className="text-center text-sm" style={{ color: theme.tabIconColour }}>
          {emptyDescription}
        </Text>
      </View>
    );
  }

  const leftColumn = posts.filter((_, index) => index % 2 === 0);
  const rightColumn = posts.filter((_, index) => index % 2 === 1);

  return (
    <View className="flex-row gap-3 px-4 pb-6">
      <View className="flex-1 gap-3">
        {leftColumn.map((post) => (
          <ProfilePostTile key={post.id} post={post} />
        ))}
      </View>
      <View className="flex-1 gap-3">
        {rightColumn.map((post) => (
          <ProfilePostTile key={post.id} post={post} />
        ))}
      </View>
    </View>
  );
};

export default ProfilePostGrid;
