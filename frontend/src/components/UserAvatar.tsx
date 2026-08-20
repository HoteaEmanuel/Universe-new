import { FaUserCircle } from "react-icons/fa";
import { cn } from "@/lib/utils";
import { getFullName } from "@/utils/fullName";

type AvatarUser = {
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  profilePicture?: string | null;
};

type UserAvatarProps = {
  user?: AvatarUser | null;
  name?: string;
  className?: string;
  fallbackClassName?: string;
};

const UserAvatar = ({
  user,
  name,
  className,
  fallbackClassName,
}: UserAvatarProps) => {
  const displayName = name || getFullName(user);
  const classes = cn("size-11 shrink-0 rounded-full object-cover", className);

  if (user?.profilePicture) {
    return (
      <img
        src={user.profilePicture}
        alt={`${displayName}'s avatar`}
        className={classes}
      />
    );
  }

  return (
    <FaUserCircle
      aria-hidden="true"
      className={cn("text-muted-foreground", classes, fallbackClassName)}
    />
  );
};

export default UserAvatar;
