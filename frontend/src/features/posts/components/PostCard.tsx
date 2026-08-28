import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import {
  Heart,
  MessageCircle,
  Bookmark,
  BookmarkCheck,
  Send,
  Flag,
  MoreVertical,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
import SharePostModal from "./SharePostModal";
import { urlPathName } from "@/utils/urlPathFromName";
import ImageSlider from "./ImageSlider";
import PostSkeleton from "./PostSkeleton";
import EventCard from "@/features/events/components/EventCard";
import PollBlock from "@/features/polls/components/PollBlock";
import type { Post } from "@/queryAndMutation/types";
import MentionText from "@/components/MentionText";
import UserAvatar from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ReportDialog from "@/features/moderation/components/ReportDialog";
import OpportunitySummary from "@/features/opportunities/components/OpportunitySummary";

type PostCardProps = {
  post: Post;
};

const PostCard = ({ post }: PostCardProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const user_ = user!;
  const { userId } = post;
  const postId = post.id;
  const [showMore, setShowMore] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const [isSaved, setIsSaved] = useState(post.isSaved);
  const bodyRef = useRef<HTMLSpanElement>(null);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
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
  const { mutate: savePostMutation } = useSavePostMutation(postId, user_.id);
  const followMutation = useFollowMutation(userId, user_.id);
  const unfollowMutation = useUnfollowMutation(userId, user_.id);
  const { mutate: unsavePostMutation } = useUnsavePostMutation(
    postId,
    user_.id,
  );

  const [showSaveOption, setShowSaveOption] = useState<string | false>(false);
  const postTime = formatDateDetailed(post.createdAt.toString());
  const handleLike = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const prevLikes =
      queryClient.getQueryData<number>(["likes", postId]) ?? post.likes.length;
    const prevLiked =
      queryClient.getQueryData<boolean>(["userLiked", postId]) ?? !!liked;

    queryClient.setQueryData<number>(
      ["likes", postId],
      (old) => (old ?? prevLikes) + (prevLiked ? -1 : 1),
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
  const handleProfileClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (userId !== user_.id) {
      navigate(`/u/${fullName}`);
    } else {
      navigate("/profile");
    }
  };

  const handleFollowClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    followMutation.mutate();
  };

  const handleUnfollowClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    unfollowMutation.mutate();
  };

  const handleSaveClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSaved(true);
    savePostMutation(undefined, {
      onError: () => {
        setIsSaved(false);
      },
    });
  };

  const handleSeeMoreClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMore(!showMore);
  };
  const handleSeeRelated = (e: MouseEvent, tag: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/related-posts/${tag}`);
  };
  const handleSeeLikesModal = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowLikesModal(true);
  };
  const handleShareClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowShareModal(true);
  };
  const handleUnSavePostClick = (e: MouseEvent) => {
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
    return <PostSkeleton />;
  if (!creator) return null;
  const { firstName, name, lastName } = creator;
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
          <MentionText
            text={post.body}
            mentionedUsers={post.mentionedUsers ?? []}
          />
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
      className="card-shell"
      onClick={(e: MouseEvent) => {
        /* Blocking the propagation, showing the report modal not navigating to the details page */
        if (showReportDialog) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <UserAvatar
          user={creator}
          className="size-9"
          onClick={handleProfileClick}
        />
        <div className="flex min-w-0 flex-1 items-center justify-between">
          <div>
            <p className="text-sm font-semibold leading-tight">
              {firstName || name} {lastName}
            </p>
            <p className="text-xs text-muted-foreground">
              {postTime}
              {post?.location && " · " + post.location}
            </p>
          </div>

          {(!isFollowing && userId !== user_.id && (
            <Button
              variant="ghost"
              size="sm"
              className="pill-follow"
              onClick={handleFollowClick}
            >
              Follow
            </Button>
          )) ||
            (userId !== user_.id && isFollowing && (
              <Button
                variant="ghost"
                size="sm"
                className="pill-following"
                onClick={handleUnfollowClick}
              >
                Following
              </Button>
            ))}
        </div>

        {userId !== user_.id && (
          <div
            onClick={(e: MouseEvent) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="icon-hover-btn shrink-0"
                    aria-label="Post options"
                  />
                }
              >
                <MoreVertical className="size-5 text-foreground/80" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setShowReportDialog(true)}
                >
                  <Flag />
                  Report post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {post.type === "opportunity" && (
        <OpportunitySummary post={post} isOwner={userId === user_.id} />
      )}

      {post.event && (
        <div className="px-4 pt-2">
          <EventCard
            event={post.event}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate(`/events/${post.event!.id}`);
            }}
          />
        </div>
      )}

      {post.poll && (
        <div className="px-4 pt-2">
          <PollBlock
            poll={post.poll}
            invalidateKeys={[["posts"], ["post", postId]]}
          />
        </div>
      )}

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
        <Button
          variant="ghost"
          size="icon-sm"
          className="icon-hover-btn relative"
          onClick={handleLike}
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
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="hover:bg-transparent"
          aria-label="Comments"
        >
          <MessageCircle className="size-6 text-foreground/80 hover:text-foreground" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="icon-hover-btn"
          onClick={handleShareClick}
          aria-label="Send post"
        >
          <Send className="size-6 text-foreground/80 hover:text-foreground" />
        </Button>
        <div className="relative ml-auto">
          {userId !== user_.id && !isSaved && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="icon-hover-btn"
              onClick={handleSaveClick}
              onMouseEnter={() => setShowSaveOption("Save post")}
              onMouseLeave={() => setShowSaveOption(false)}
              aria-label="Save post"
            >
              <Bookmark className="size-6 text-foreground/80 hover:text-foreground" />
            </Button>
          )}
          {userId !== user_.id && isSaved && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="icon-hover-btn"
              onClick={handleUnSavePostClick}
              onMouseEnter={() => setShowSaveOption("Unsave post")}
              onMouseLeave={() => setShowSaveOption(false)}
              aria-label="Unsave post"
            >
              <BookmarkCheck
                className="size-6 text-foreground"
                fill="currentColor"
              />
            </Button>
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
            <UserAvatar user={relevantLiker} className="size-4" />
            <span className="min-w-0 truncate">
              Liked by{" "}
              <span className="font-semibold">
                {relevantLiker.firstName || relevantLiker.name}
              </span>
              {!!likes &&
                likes > 1 &&
                ` and ${formatCount(likes - 1)} other${likes - 1 === 1 ? "" : "s"}`}
            </span>
          </div>
        ) : (
          <span
            className="cursor-pointer text-sm font-semibold"
            onClick={handleSeeLikesModal}
          >
            {formatCount(likes ?? 0)} {likes === 1 ? "like" : "likes"}
          </span>
        )}
        {!!commentsCount && commentsCount > 0 && (
          <span className="ml-3 text-sm text-muted-foreground">
            {formatCount(commentsCount)}{" "}
            {commentsCount === 1 ? "comment" : "comments"}
          </span>
        )}
      </div>

      {showLikesModal && !!likes && likes > 0 && (
        <LikesModal
          open={showLikesModal}
          onClose={() => setShowLikesModal(false)}
          postId={postId}
        />
      )}

      {showShareModal && (
        <SharePostModal
          open={showShareModal}
          onClose={() => setShowShareModal(false)}
          postId={postId}
        />
      )}

      <ReportDialog
        open={showReportDialog}
        onClose={() => setShowReportDialog(false)}
        targetType="post"
        targetId={postId}
      />

      {hasImages && captionBlock}

      {post.tags?.length > 0 && (
        <ul className="flex flex-wrap gap-2 px-4 pt-2 pb-4">
          {post.tags.map((tag) => (
            <li key={tag + userId}>
              <Badge
                variant="muted"
                className="cursor-pointer"
                onClick={(e: MouseEvent) => handleSeeRelated(e, tag)}
              >
                #{tag}
              </Badge>
            </li>
          ))}
        </ul>
      )}
      {!post.tags?.length && <div className="pb-2" />}
    </Link>
  );
};

export default PostCard;
