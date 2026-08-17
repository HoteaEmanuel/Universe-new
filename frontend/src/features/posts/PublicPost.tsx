import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import { Heart, MessageCircle, ImageOff } from "lucide-react";
import NotFoundState from "@/components/NotFoundState";
import { useAuthStore } from "@/store/authStore";
import { useGetPublicPostQuery } from "@/queryAndMutation/queries/post-queries";
import { formatDateDetailed } from "@/utils/formatDate";
import { formatCount } from "@/utils/formatCount";
import { getFullName } from "@/utils/fullName";
import ImageSlider from "./components/ImageSlider";

const PublicPost = () => {
  const { id: postId } = useParams();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    document.title = "Post";
  }, []);

  const { data: post, isPending, isError } = useGetPublicPostQuery(postId);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (isError || !post) {
    return (
      <NotFoundState
        icon={ImageOff}
        title="Post not found"
        description="This post may have been removed, or the link is incorrect."
      />
    );
  }

  const hasImages = post.imagesUrls.length > 0;

  return (
    <div className="flex min-h-screen justify-center bg-background px-4 py-10">
      <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-center gap-3 px-4 py-3">
          {post.user.profilePicture ? (
            <img
              src={post.user.profilePicture}
              alt="profile picture"
              className="size-9 rounded-full object-cover"
            />
          ) : (
            <FaUserCircle className="size-9 text-muted-foreground" />
          )}
          <div>
            <p className="text-sm font-semibold leading-tight">
              {getFullName(post.user)}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDateDetailed(post.createdAt)}
              {post.location && " · " + post.location}
            </p>
          </div>
        </div>

        {hasImages &&
          (post.imagesUrls.length === 1 ? (
            <img
              src={post.imagesUrls[0]}
              alt="post image"
              className="aspect-square w-full object-cover"
            />
          ) : (
            <ImageSlider images={post.imagesUrls} />
          ))}

        <div className="px-4 pt-3">
          <span className="mr-1.5 text-sm font-semibold">{post.title}</span>
          {post.body && <span className="text-sm wrap-break-word">{post.body}</span>}
        </div>

        <div className="flex items-center gap-4 px-4 pt-3">
          <Heart className="size-6.5 text-foreground/80" />
          <MessageCircle className="size-6 text-foreground/80" />
        </div>

        <div className="px-4 pt-2 text-sm text-muted-foreground">
          {formatCount(post._count.likes)}{" "}
          {post._count.likes === 1 ? "like" : "likes"}
          {post._count.comments > 0 && (
            <>
              {" · "}
              {formatCount(post._count.comments)}{" "}
              {post._count.comments === 1 ? "comment" : "comments"}
            </>
          )}
        </div>

        {post.tags.length > 0 && (
          <ul className="flex flex-wrap gap-2 px-4 pt-2 pb-4">
            {post.tags.map((tag) => (
              <li
                key={tag.name}
                className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground"
              >
                #{tag.name}
              </li>
            ))}
          </ul>
        )}

        <div className="border-t border-border p-4">
          {isAuthenticated ? (
            <Link
              to={`/post/${post.id}`}
              className="block w-full rounded-lg bg-primary py-2 text-center text-sm font-medium text-primary-foreground hover:bg-primary/80"
            >
              View post
            </Link>
          ) : (
            <div className="flex flex-col items-center gap-2 text-center">
              <p className="text-sm text-muted-foreground">
                Log in to like, comment, and see more from Universe.
              </p>
              <div className="flex w-full gap-2">
                <Link
                  to="/login"
                  className="flex-1 rounded-lg bg-primary py-2 text-center text-sm font-medium text-primary-foreground hover:bg-primary/80"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="flex-1 rounded-lg border border-border py-2 text-center text-sm font-medium hover:bg-muted"
                >
                  Sign up
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicPost;
