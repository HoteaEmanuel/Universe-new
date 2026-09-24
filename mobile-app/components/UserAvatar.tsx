import { Image, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type AvatarUser = {
  profilePicture?: string | null;
};

type UserAvatarProps = {
  user?: AvatarUser | null;
  size?: number;
  iconColor: string;
  onPress?: () => void;
};

const UserAvatar = ({ user, size = 40, iconColor, onPress }: UserAvatarProps) => {
  const content = user?.profilePicture ? (
    <Image
      source={{ uri: user.profilePicture }}
      style={{ width: size, height: size, borderRadius: size / 2 }}
    />
  ) : (
    <Ionicons name="person-circle" size={size} color={iconColor} />
  );

  if (!onPress) return content;

  return (
    <Pressable onPress={onPress} hitSlop={6} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
      {content}
    </Pressable>
  );
};

export default UserAvatar;
