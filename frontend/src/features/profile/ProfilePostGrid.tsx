import type { MouseEvent, ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Heart, Images, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetLikesQuery } from "../../queryAndMutation/queries/post-queries";
import type { Post } from "../../queryAndMutation/types";
import transparentEaselIllustration from "@/assets/profile-empty-state/transparent-camera.webp";

type ProfilePostGridProps = {
  posts: Post[];
  showEditIcon?: boolean;
  emptyTitle: ReactNode;
  emptyDescription?: string;
  showCreateCta?: boolean;
  showIllustrations?: boolean;
};

const ProfilePostGrid = ({
  posts,
  showEditIcon = false,
  emptyTitle,
  emptyDescription,
  showCreateCta = false,
  showIllustrations = false,
}: ProfilePostGridProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-5 py-6 text-center sm:py-10">
        {showIllustrations && (
          <div className="relative flex min-h-34 w-full max-w-xl items-center justify-center overflow-hidden rounded-2xl px-6 pt-5 sm:min-h-60 sm:px-10 sm:pt-7">
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_25%,rgba(251,191,36,0.22),transparent_55%),radial-gradient(circle_at_75%_70%,rgba(124,58,237,0.22),transparent_60%)] blur-2xl"
            />
            <img
              src={transparentEaselIllustration}
              alt=""
              aria-hidden="true"
              className="h-auto w-1/2 max-w-sm object-contain"
            />
          </div>
        )}

        <div className="flex max-w-md flex-col items-center gap-2 px-4">
          <p className="text-xl font-bold text-violet-600 dark:text-violet-400">
            {emptyTitle}
          </p>
          {emptyDescription && (
            <p className="text-sm text-violet-900/70 dark:text-violet-200/70">
              {emptyDescription}
            </p>
          )}
          {showCreateCta && (
            <Button className="mt-2" onClick={() => navigate("/create-post")}>
              <Plus />
              Share something with your friends
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-3 gap-1 sm:gap-2">
      {posts.map((post) => (
        <ProfilePostTile
          key={post.id}
          post={post}
          showEditIcon={showEditIcon}
          backgroundLocation={location}
          onEdit={() => navigate(`/edit-post/${post.id}`)}
        />
      ))}
    </ul>
  );
};

type ProfilePostTileProps = {
  post: Post;
  showEditIcon: boolean;
  backgroundLocation: ReturnType<typeof useLocation>;
  onEdit: () => void;
};

const ProfilePostTile = ({
  post,
  showEditIcon,
  backgroundLocation,
  onEdit,
}: ProfilePostTileProps) => {
  const hasImage = post.imagesUrls?.length > 0;
  const { data: likes } = useGetLikesQuery(post.id);

  return (
    <li className="group/tile relative aspect-square">
      <Link
        to={`/post/${post.id}`}
        state={{ backgroundLocation }}
        className="block size-full overflow-hidden rounded-lg bg-muted"
      >
        {hasImage ? (
          <img
            src={post.imagesUrls[0]}
            alt={post.title}
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full flex-col justify-center gap-1 p-3">
            <p className="line-clamp-3 text-xs font-semibold">
              {post.title}
            </p>
            {post.body && (
              <p className="line-clamp-3 text-[11px] text-muted-foreground">
                {post.body}
              </p>
            )}
          </div>
        )}

        {post.imagesUrls?.length > 1 && (
          <Images className="absolute top-2 right-2 size-4 text-white drop-shadow" />
        )}

        <div className="absolute inset-0 hidden items-center justify-center gap-1.5 bg-black/40 text-sm font-semibold text-white group-hover/tile:flex">
          <Heart className="size-4" fill="currentColor" />
          {likes ?? 0}
        </div>
      </Link>

      {showEditIcon && (
        <Button
          type="button"
          variant="secondary"
          size="icon-sm"
          aria-label="Edit post"
          className="absolute top-2 left-2 opacity-0 shadow-sm transition-opacity group-hover/tile:opacity-100"
          onClick={(e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            onEdit();
          }}
        >
          <Pencil />
        </Button>
      )}
    </li>
  );
};

export default ProfilePostGrid;
