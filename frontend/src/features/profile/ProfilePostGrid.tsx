import type { MouseEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Heart, Images, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Post } from "../../queryAndMutation/types";

type ProfilePostGridProps = {
  posts: Post[];
  showEditIcon?: boolean;
  emptyTitle: string;
  emptyDescription?: string;
  showCreateCta?: boolean;
};

const ProfilePostGrid = ({
  posts,
  showEditIcon = false,
  emptyTitle,
  emptyDescription,
  showCreateCta = false,
}: ProfilePostGridProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
        <p className="font-medium">{emptyTitle}</p>
        {emptyDescription && (
          <p className="text-sm text-muted-foreground">{emptyDescription}</p>
        )}
        {showCreateCta && (
          <Button size="sm" onClick={() => navigate("/create-post")}>
            <Plus />
            Create your first post
          </Button>
        )}
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-3 gap-1 sm:gap-2">
      {posts.map((post) => {
        const hasImage = post.imagesUrls?.length > 0;
        return (
          <li key={post._id} className="group/tile relative aspect-square">
            <Link
              to={`/post/${post._id}`}
              state={{ backgroundLocation: location }}
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
                {post.likes?.length ?? 0}
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
                  navigate(`/edit-post/${post._id}`);
                }}
              >
                <Pencil />
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
};

export default ProfilePostGrid;
