import { Link, useLocation } from "react-router-dom";
import { getFullName } from "@/utils/fullName";
import UserAvatar from "@/components/UserAvatar";
import type { SharedPost } from "../types";

type SharedPostCardProps = {
  post: SharedPost;
  isOwn: boolean;
};

const SharedPostCard = ({ post, isOwn }: SharedPostCardProps) => {
  const location = useLocation();
  const cover = post.imagesUrls?.[0];

  return (
    <Link
      to={`/post/${post.id}`}
      state={{ backgroundLocation: location }}
      className={`flex w-56 flex-col overflow-hidden rounded-2xl border text-left transition-colors ${
        isOwn
          ? "border-primary-foreground/20 bg-primary/10 hover:bg-primary/15"
          : "border-border bg-background hover:bg-muted"
      }`}
    >
      {cover && (
        <img
          src={cover}
          alt={post.title}
          className="aspect-square w-full object-cover"
        />
      )}
      <div className="flex flex-col gap-1 p-2.5">
        <div className="flex items-center gap-1.5">
          <UserAvatar user={post.user} className="size-4" />
          <span className="truncate text-xs text-muted-foreground">
            {getFullName(post.user)}
          </span>
        </div>
        <p className="line-clamp-2 text-sm font-medium">{post.title}</p>
      </div>
    </Link>
  );
};

export default SharedPostCard;
