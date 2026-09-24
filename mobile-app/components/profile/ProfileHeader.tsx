import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatCount } from "@universe/shared";
import { Colors } from "@constants/colors";
import { IconSizes } from "@constants/iconSizes";
import { PressableScale } from "@lib/styled";
import { getUserFullName } from "@utils/user/getUserFullName";
import UserAvatar from "@components/UserAvatar";
import { useAppColorScheme } from "@hooks/useAppColorScheme";

export type ProfileHeaderUser = {
  profilePicture?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  username?: string | null;
  university?: string | null;
  major?: string | null;
  bio?: string | null;
};

type ProfileHeaderProps = {
  user: ProfileHeaderUser;
  isOwnProfile: boolean;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  isFollowing?: boolean;
  onFollowToggle?: () => void;
  onMessage?: () => void;
  onFollowersPress?: () => void;
  onFollowingPress?: () => void;
};

type StatProps = { value: number; label: string; textPrimary: string; textMuted: string; onPress?: () => void };

const Stat = ({ value, label, textPrimary, textMuted, onPress }: StatProps) => {
  const content = (
    <View className="items-center gap-0.5">
      <Text className="text-base font-bold" style={{ color: textPrimary }}>
        {formatCount(value)}
      </Text>
      <Text className="text-xs" style={{ color: textMuted }}>
        {label}
      </Text>
    </View>
  );

  if (!onPress) return content;

  return <PressableScale onPress={onPress}>{content}</PressableScale>;
};

const ProfileHeader = ({
  user,
  isOwnProfile,
  postsCount,
  followersCount,
  followingCount,
  isFollowing = false,
  onFollowToggle,
  onMessage,
  onFollowersPress,
  onFollowingPress,
}: ProfileHeaderProps) => {
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;
  const border = theme.borderColor;
  const textPrimary = theme.title;
  const textBody = theme.text;
  const textMuted = theme.tabIconColour;

  const displayName = getUserFullName(user) || "Unknown";

  return (
    <View className="items-center gap-4 px-6 pb-5 pt-2">
      <View
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.2,
          shadowRadius: 10,
          elevation: 6,
        }}
      >
        <UserAvatar user={user} size={96} iconColor={theme.iconMuted} />
      </View>

      <View className="items-center gap-1">
        <Text className="text-xl font-bold" style={{ color: textPrimary }}>
          {displayName}
        </Text>
        {user.username ? (
          <Text className="text-sm" style={{ color: textMuted }}>
            @{user.username}
          </Text>
        ) : null}
      </View>

      <View className="flex-row items-center gap-8">
        <Stat
          value={postsCount}
          label={postsCount === 1 ? "post" : "posts"}
          textPrimary={textPrimary}
          textMuted={textMuted}
        />
        <Stat
          value={followersCount}
          label="followers"
          textPrimary={textPrimary}
          textMuted={textMuted}
          onPress={onFollowersPress}
        />
        <Stat
          value={followingCount}
          label="following"
          textPrimary={textPrimary}
          textMuted={textMuted}
          onPress={onFollowingPress}
        />
      </View>

      {user.university || user.major ? (
        <View className="items-center gap-1">
          {user.university ? (
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="school-outline" size={IconSizes.sm} color={textMuted} />
              <Text className="text-xs" style={{ color: textMuted }}>
                {user.university}
              </Text>
            </View>
          ) : null}
          {user.major ? (
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="book-outline" size={IconSizes.sm} color={textMuted} />
              <Text className="text-xs" style={{ color: textMuted }}>
                {user.major}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {user.bio ? (
        <Text className="px-4 text-center text-sm" style={{ color: textBody }}>
          {user.bio}
        </Text>
      ) : null}

      {!isOwnProfile ? (
        <View className="flex-row items-center gap-3 pt-1">
          <PressableScale
            onPress={onFollowToggle}
            className="rounded-full px-6 py-2"
            style={
              isFollowing ? { borderWidth: 1, borderColor: border } : { backgroundColor: Colors.primary }
            }
          >
            <Text className="text-sm font-semibold" style={{ color: isFollowing ? textMuted : "#ffffff" }}>
              {isFollowing ? "Following" : "Follow"}
            </Text>
          </PressableScale>
          <PressableScale
            onPress={onMessage}
            className="rounded-full p-2.5"
            style={{ borderWidth: 1, borderColor: border }}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={IconSizes.lg} color={theme.iconMuted} />
          </PressableScale>
        </View>
      ) : null}
    </View>
  );
};

export default ProfileHeader;
