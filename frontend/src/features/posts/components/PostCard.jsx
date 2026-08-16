import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useRef } from "react";
import { FaUserCircle } from "react-icons/fa";
import { Heart, MessageCircle, Bookmark, BookmarkCheck } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";
import { Link, useLocation } from "react-router-dom";
import {
  useGetLikesQuery,
  useGetRelevantLikerQuery,
  usePostLikedQuery,
  usePostUserQuery,
} from "@/queryAndMutation/queries/post-queries";
import { useIsFollowingQuery } from "@/queryAndMutation/queries/user-queries";
import {
  useFollowMutation,
  useSavePostMutation,
  useUnfollowMutation,
  useUnsavePostMutation,
} from "@/queryAndMutation/mutations/user-mutation";
import { useGetPostCommentsCount } from "@/queryAndMutation/queries/comments-queries";
import {
  useLikeMutation,
  useUnlikeMutation,
} from "@/queryAndMutation/mutations/post-mutation";
import { formatDateDetailed } from "@/utils/formatDate";
import { formatCount } from "@/utils/formatCount";
import LikesModal from "./LikesModal";
import { urlPathName } from "@/utils/urlPathFromName";
import ImageSlider from "./ImageSlider";
import PostSkeleton from "./PostSkeleton";
const PostCard = ({ post }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { userId } = post;
  const postId = post.id;
  const [showMore, setShowMore] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const [isSaved, setIsSaved] = useState(post.isSaved);
  const bodyRef = useRef(null);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [likePop, setLikePop] = useState(false);
  const [showCelebrate, setShowCelebrate] = useState(false);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  useEffect(() => {
    const body = bodyRef.current;
    if (body) {
      if (body.scrollHeight > body.clientHeight) {
        setIsClamped(true);
      }
    }
  }, []);

  const { data: creator, isPending: isPendingPostUser } = usePostUserQuery(
    userId,
    postId,
  );

  const { data: liked, isPending: isPendingCheckLiked } =
    usePostLikedQuery(postId);

  const { data: isFollowing, isPending: isPendingIsFollowing } =
    useIsFollowingQuery(userId);
  const { data: likes, isPending: isPendingLikes } = useGetLikesQuery(postId);
  const { data: relevantLiker, isPending: isPendingRelevantLiker } =
    useGetRelevantLikerQuery(postId);
  const { data: commentsCount, isPending: isPendingCommentsCount } =
    useGetPostCommentsCount(postId);
  const likeMutation = useLikeMutation(postId);
  const unlikeMutation = useUnlikeMutation(postId);
  const { mutate: savePostMutation } = useSavePostMutation(postId, user.id);
  const followMutation = useFollowMutation(userId, user.id);
  const unfollowMutation = useUnfollowMutation(userId, user.id);
  const { mutate: unsavePostMutation } = useUnsavePostMutation(
    postId,
    user.id,
  );

  const [showSaveOption, setShowSaveOption] = useState(false);
  const postTime = formatDateDetailed(post.createdAt.toString());
  const handleLike = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const prevLikes =
      queryClient.getQueryData(["likes", postId]) ?? post.likes.length;
    const prevLiked =
      queryClient.getQueryData(["userLiked", postId]) ?? !!liked;

    queryClient.setQueryData(
      ["likes", postId],
      (old) =>
        (typeof old === "number" ? old : prevLikes) + (prevLiked ? -1 : 1),
    );
    queryClient.setQueryData(["userLiked", postId], !prevLiked);

    if (!prevLiked) {
      setLikePop(true);
      setShowCelebrate(true);
      setShowHeartBurst(true);
    }

    const rollback = () => {
      queryClient.setQueryData(["likes", postId], prevLikes);
      queryClient.setQueryData(["userLiked", postId], prevLiked);
    };

    if (!prevLiked) {
      likeMutation.mutate(undefined, { onError: rollback });
    } else {
      unlikeMutation.mutate(undefined, { onError: rollback });
    }
  };
  const fullName = urlPathName(creator);
  const handleProfileClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (userId !== user.id) {
      navigate(`/users/${fullName}`);
    } else {
      navigate("/profile");
    }
  };

  const handleFollowClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    followMutation.mutate(userId);
  };

  const handleUnfollowClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    unfollowMutation.mutate(userId);
  };

  const handleSaveClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSaved(true);
    savePostMutation(undefined, {
      onError: () => {
        setIsSaved(false);
      },
    });
  };

  const handleSeeMoreClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMore(!showMore);
  };
  const handleSeeRelated = (e, tag) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/related-posts/${tag}`);
  };
  const handleSeeLikesModal = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowLikesModal(true);
  };
  const handleUnSavePostClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSaved(false);
    unsavePostMutation(undefined, {
      onError: () => {
        setIsSaved(true);
      },
    });
  };
  if (
    isPendingCheckLiked ||
    isPendingIsFollowing ||
    isPendingPostUser ||
    isPendingLikes ||
    isPendingRelevantLiker ||
    isPendingCommentsCount
  )
    return <PostSkeleton/>;
  if (!creator) return null;
  const { firstName, name, lastName, profilePicture } = creator;
  const hasImages = !!post.imagesUrls?.length;
  const captionBlock = (
    <div className="px-4 pt-2">
      {post?.title && (
        <span className="mr-1.5 text-sm font-semibold">{post.title}</span>
      )}
      {post?.body && (
        <span
          className={`text-sm wrap-break-word ${!showMore && "line-clamp-3"}`}
          ref={bodyRef}
        >
          {post.body}
        </span>
      )}
      {isClamped && (
        <button
          className="block text-xs text-muted-foreground hover:text-foreground"
          onClick={handleSeeMoreClick}
        >
          {showMore ? "See less" : "See more"}
        </button>
      )}
    </div>
  );
  return (
    <Link
      to={`/post/${postId}`}
      state={{ backgroundLocation: location }}
      className="flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow duration-200 hover:shadow-sm"
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {(profilePicture && (
          <img
            src={profilePicture}
            alt="profile picture"
            className="size-9 rounded-full object-cover cursor-pointer"
            onClick={handleProfileClick}
          />
        )) || (
          <FaUserCircle
            className="size-9 text-muted-foreground cursor-pointer"
            onClick={handleProfileClick}
          />
        )}
        <div className="flex w-full items-center justify-between">
          <div>
            <p className="text-sm font-semibold leading-tight">
              {firstName || name} {lastName}
            </p>
            <p className="text-xs text-muted-foreground">
              {postTime}
              {post?.location && " · " + post.location}
            </p>
          </div>

          {(!isFollowing && userId !== user.id && (
            <button
              className="rounded-full px-2 py-1 text-xs font-semibold text-primary transition-transform duration-200 ease-in hover:scale-105"
              onClick={handleFollowClick}
            >
              Follow
            </button>
          )) ||
            (userId !== user.id && isFollowing && (
              <button
                className="rounded-full px-2 py-1 text-xs text-muted-foreground transition-transform duration-200 ease-in hover:scale-105"
                onClick={handleUnfollowClick}
              >
                Following
              </button>
            ))}
        </div>
      </div>

      {!hasImages && captionBlock}

      {hasImages && (
        <div className="relative">
          {post.imagesUrls?.length === 1 && (
            <img
              src={post.imagesUrls[0]}
              alt="post image"
              className="aspect-square w-full self-center object-cover"
            />
          )}
          {post.imagesUrls?.length > 1 && (
            <ImageSlider images={post.imagesUrls} />
          )}
          {showHeartBurst && (
            <Heart
              className="pointer-events-none absolute inset-0 m-auto size-24 animate-heart-burst text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)]"
              fill="currentColor"
              onAnimationEnd={() => setShowHeartBurst(false)}
            />
          )}
        </div>
      )}

      <div className="flex items-center gap-4 px-4 pt-3">
        <button
          className="relative inline-flex items-center justify-center transition-transform duration-150 hover:scale-110"
          onClick={(e) => handleLike(e)}
          aria-label={liked ? "Unlike post" : "Like post"}
        >
          <Heart
            className={`size-6.5 transition-colors ${
              liked ? "text-like" : "text-foreground/80 hover:text-foreground"
            } ${likePop ? "animate-like-pop" : ""}`}
            fill={liked ? "currentColor" : "none"}
            onAnimationEnd={() => setLikePop(false)}
          />
          {showCelebrate && (
            <svg
              className="animate-like-celebrate pointer-events-none absolute inset-0 m-auto size-14 text-like"
              viewBox="0 0 100 100"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
              onAnimationEnd={() => setShowCelebrate(false)}
            >
              <line x1="94" y1="50" x2="82" y2="50" />
              <line x1="81" y1="81" x2="73" y2="73" />
              <line x1="50" y1="94" x2="50" y2="82" />
              <line x1="19" y1="81" x2="27" y2="73" />
              <line x1="6" y1="50" x2="18" y2="50" />
              <line x1="19" y1="19" x2="27" y2="27" />
              <line x1="50" y1="6" x2="50" y2="18" />
              <line x1="81" y1="19" x2="73" y2="27" />
            </svg>
          )}
        </button>
        <button aria-label="Comments">
          <MessageCircle className="size-6 text-foreground/80 hover:text-foreground" />
        </button>
        <div className="relative ml-auto">
          {userId !== user.id && !isSaved && (
            <Bookmark
              className="size-6 text-foreground/80 hover:scale-110 hover:text-foreground cursor-pointer transition-transform duration-150"
              onClick={handleSaveClick}
              onMouseEnter={() => setShowSaveOption("Save post")}
              onMouseLeave={() => setShowSaveOption(false)}
              aria-label="Save post"
            />
          )}
          {userId !== user.id && isSaved && (
            <BookmarkCheck
              className="size-6 text-foreground hover:scale-110 cursor-pointer transition-transform duration-150"
              fill="currentColor"
              onClick={handleUnSavePostClick}
              onMouseEnter={() => setShowSaveOption("Unsave post")}
              onMouseLeave={() => setShowSaveOption(false)}
              aria-label="Unsave post"
            />
          )}
          {showSaveOption && (
            <span className="absolute right-0 top-8 whitespace-nowrap rounded-md bg-foreground/90 px-2 py-1 text-[10px] font-medium text-background shadow-sm">
              {showSaveOption}
            </span>
          )}
        </div>
      </div>

      <div className="px-4 pt-2">
        {relevantLiker ? (
          <div
            className="flex cursor-pointer items-center gap-1.5 text-sm"
            onClick={handleSeeLikesModal}
          >
            {relevantLiker.profilePicture ? (
              <img
                src={relevantLiker.profilePicture}
                alt=""
                className="size-4 shrink-0 rounded-full object-cover"
              />
            ) : (
              <FaUserCircle className="size-4 shrink-0 text-muted-foreground" />
            )}
            <span className="min-w-0 truncate">
              Liked by{" "}
              <span className="font-semibold">
                {relevantLiker.firstName || relevantLiker.name}
              </span>
              {likes > 1 &&
                ` and ${formatCount(likes - 1)} other${likes - 1 === 1 ? "" : "s"}`}
            </span>
          </div>
        ) : (
          <span
            className="cursor-pointer text-sm font-semibold"
            onClick={handleSeeLikesModal}
          >
            {formatCount(likes)} {likes === 1 ? "like" : "likes"}
          </span>
        )}
        {commentsCount > 0 && (
          <span className="ml-3 text-sm text-muted-foreground">
            {formatCount(commentsCount)}{" "}
            {commentsCount === 1 ? "comment" : "comments"}
          </span>
        )}
      </div>

      {showLikesModal && likes > 0 && (
        <LikesModal
          open={showLikesModal}
          onClose={() => setShowLikesModal(false)}
          postId={postId}
        />
      )}

      {hasImages && captionBlock}

      {post.tags?.length > 0 && (
        <ul className="flex flex-wrap gap-2 px-4 pt-2 pb-4">
          {post.tags.map((tag) => (
            <li
              key={tag + userId}
              className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              onClick={(e) => handleSeeRelated(e, tag)}
            >
              #{tag}
            </li>
          ))}
        </ul>
      )}
      {!post.tags?.length && <div className="pb-2" />}
    </Link>
  );
};

export default PostCard;
