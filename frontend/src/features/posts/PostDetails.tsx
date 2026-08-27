import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Heart, MessageCircle, Bookmark, BookmarkCheck, ImageOff, Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import NotFoundState from "@/components/NotFoundState";
import { useAuthStore } from "@/store/authStore";
import {
  useGetLikesQuery,
  useGetPostQuery,
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
import {
  useLikeMutation,
  useUnlikeMutation,
} from "@/queryAndMutation/mutations/post-mutation";
import CommentsContainer from "@/features/comments/components/CommentsContainer";
import CommentInput from "@/features/comments/components/CommentInput";
import MentionText from "@/components/MentionText";
import { useGetPostCommentsCount } from "@/queryAndMutation/queries/comments-queries";
import LikesModal from "./components/LikesModal";
import PollBlock from "@/features/polls/components/PollBlock";
import { formatDateDetailed } from "@/utils/formatDate";
import { formatCount } from "@/utils/formatCount";
import { getFullName } from "@/utils/fullName";
import { urlPathName } from "@/utils/urlPathFromName";
import ImageSlider from "./components/ImageSlider";
import UserAvatar from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type PostDetailsProps = {
  inModal?: boolean;
};

const PostDetails = ({ inModal = false }: PostDetailsProps) => {
  useEffect(() => {
    if (inModal) return;
    document.title = "Post Details";
  }, [inModal]);

  const { socket, user: authUser } = useAuthStore();
  const user = authUser!;
  const { id: postId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: post,
    isPending: isPendingPost,
    isError: isPostError,
  } = useGetPostQuery(postId);
  const [seeLikesModal, setSeeLikesModal] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likePop, setLikePop] = useState(false);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const userId = post?.userId;

  useEffect(() => {
    setIsSaved(!!post?.isSaved);
  }, [post?.isSaved]);

  useEffect(() => {
    const body = bodyRef.current;
    if (body && body.scrollHeight > body.clientHeight) {
      setIsClamped(true);
    }
  }, [post?.body]);

  useEffect(() => {
    if (!socket || !postId) return;
    socket.emit("view_post", postId);
    return () => {
      socket.emit("leave_post", postId);
    };
  }, [socket, postId]);

  const { data: creator, isPending: isPendingPostUser } = usePostUserQuery(
    userId ?? "",
    postId ?? "",
  );
  const { data: liked, isPending: isPendingCheckLiked } = usePostLikedQuery(
    postId ?? "",
  );
  const { data: isFollowing, isPending: isPendingIsFollowing } =
    useIsFollowingQuery(userId);
  const { data: likes, isPending: isPendingLikes } = useGetLikesQuery(
    postId ?? "",
  );
  const { data: relevantLiker } = useGetRelevantLikerQuery(postId ?? "");
  const { data: commentsCount } = useGetPostCommentsCount(postId);

  const likeMutation = useLikeMutation(postId ?? "");
  const unlikeMutation = useUnlikeMutation(postId ?? "");
  const { mutate: savePostMutation } = useSavePostMutation(
    postId ?? "",
    user.id,
  );
  const { mutate: unsavePostMutation } = useUnsavePostMutation(
    postId ?? "",
    user.id,
  );
  const followMutation = useFollowMutation(userId, user.id);
  const unfollowMutation = useUnfollowMutation(userId, user.id);

  const handleLike = () => {
    const prevLikes =
      queryClient.getQueryData<number>(["likes", postId]) ??
      post?.likes.length ??
      0;
    const prevLiked =
      queryClient.getQueryData<boolean>(["userLiked", postId]) ?? !!liked;

    queryClient.setQueryData(
      ["likes", postId],
      prevLikes + (prevLiked ? -1 : 1),
    );
    queryClient.setQueryData(["userLiked", postId], !prevLiked);

    if (!prevLiked) {
      setLikePop(true);
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
  const handleProfileClick = () => {
    if (userId !== user.id) {
      navigate(`/u/${fullName}`);
    } else {
      navigate("/profile");
    }
  };

  const handleSaveClick = () => {
    setIsSaved(true);
    savePostMutation(undefined, { onError: () => setIsSaved(false) });
  };

  const handleUnsaveClick = () => {
    setIsSaved(false);
    unsavePostMutation(undefined, { onError: () => setIsSaved(true) });
  };

  const spinner = (
    <div className="flex w-full items-center justify-center py-24">
      <Loader2 className="size-8 animate-spin text-muted-foreground" />
    </div>
  );

  const postNotFound = (
    <NotFoundState
      icon={ImageOff}
      title="Post not found"
      description="This post may have been deleted or the link might be broken."
      compact={inModal}
    />
  );

  if (isPendingPost) return spinner;

  if (isPostError || !post) return postNotFound;

  const isLoadingPostDetails =
    isPendingCheckLiked ||
    isPendingIsFollowing ||
    isPendingPostUser ||
    isPendingLikes;

  if (isLoadingPostDetails) return spinner;

  if (!creator) return postNotFound;

  const hasImages = !!post.imagesUrls?.length;

  return (
    <div
      className={
        inModal
          ? "flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden md:flex-row"
          : "mx-auto flex w-full max-w-5xl flex-col overflow-hidden border-border bg-card md:h-[80vh] md:flex-row md:rounded-2xl md:border"
      }
    >
      {/* Media column */}
      {hasImages && (
        <div className="relative flex w-full shrink-0 items-center justify-center bg-black md:h-full md:w-3/5">
          {post.imagesUrls?.length === 1 && (
            <img
              src={post.imagesUrls[0]}
              alt="post"
              className="aspect-square w-full object-cover md:h-full md:w-full"
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

      {/* Info + comments column */}
      <div
        className={
          hasImages
            ? "flex min-h-0 w-full flex-1 flex-col md:h-full md:w-2/5"
            : "flex min-h-0 w-full flex-1 flex-col md:mx-auto md:h-full md:max-w-2xl"
        }
      >
        <div className="flex shrink-0 items-center gap-2.5 border-b border-border px-4 py-3">
          <UserAvatar user={creator} className="size-9" onClick={handleProfileClick} />
          <div className="flex w-full items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold leading-tight">
                {getFullName(creator)}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDateDetailed(post.createdAt)}
                {post.location && " · " + post.location}
              </p>
            </div>
            {userId !== user.id &&
              (isFollowing ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="pill-following shrink-0"
                  onClick={() => unfollowMutation.mutate()}
                >
                  Following
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="pill-follow shrink-0"
                  onClick={() => followMutation.mutate()}
                >
                  Follow
                </Button>
              ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex items-start gap-2.5 px-4 pt-3 pb-1.5">
            <UserAvatar user={creator} className="size-8" />
            <div className="min-w-0 flex-1 text-sm">
              <p
                ref={bodyRef}
                className={`wrap-break-word ${!showMore && "line-clamp-5"}`}
              >
                <span className="font-semibold">{getFullName(creator)}</span>{" "}
                {post.title && (
                  <span className="font-semibold">{post.title} </span>
                )}
                <MentionText text={post.body} mentionedUsers={post.mentionedUsers ?? []} />
              </p>
              {isClamped && (
                <button
                  className="pt-0.5 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setShowMore((prev) => !prev)}
                >
                  {showMore ? "See less" : "See more"}
                </button>
              )}
            </div>
          </div>

          {post.tags?.length > 0 && (
            <ul className="flex flex-wrap gap-2 px-4 pb-2 pl-[46px]">
              {post.tags.map((tag) => (
                <li key={tag}>
                  <Badge
                    variant="muted"
                    className="cursor-pointer"
                    onClick={() => navigate(`/related-posts/${tag.toLowerCase()}`)}
                  >
                    #{tag}
                  </Badge>
                </li>
              ))}
            </ul>
          )}

          {post.poll && (
            <div className="px-4 pb-2 pl-[46px]">
              <PollBlock poll={post.poll} invalidateKeys={[["posts"], ["post", postId]]} />
            </div>
          )}

          <div className="px-4">
            <CommentsContainer />
          </div>
        </div>

        <div className="shrink-0 border-t border-border">
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
            </Button>
            <MessageCircle className="size-6 text-foreground/80" />
            {userId !== user.id && (
              <div className="ml-auto">
                {!isSaved ? (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="icon-hover-btn"
                    onClick={handleSaveClick}
                    aria-label="Save post"
                  >
                    <Bookmark className="size-6 text-foreground/80 hover:text-foreground" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="icon-hover-btn"
                    onClick={handleUnsaveClick}
                    aria-label="Unsave post"
                  >
                    <BookmarkCheck className="size-6 text-foreground" fill="currentColor" />
                  </Button>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 px-4 pt-1.5 text-sm">
            {relevantLiker ? (
              <button
                className="flex min-w-0 items-center gap-1.5 hover:text-muted-foreground"
                onClick={() => setSeeLikesModal(true)}
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
              </button>
            ) : (
              <button
                className="font-semibold hover:text-muted-foreground"
                onClick={() => setSeeLikesModal(true)}
              >
                {formatCount(likes ?? 0)} {likes === 1 ? "like" : "likes"}
              </button>
            )}
            {!!commentsCount && (
              <span className="shrink-0 text-muted-foreground">
                · {formatCount(commentsCount)}{" "}
                {commentsCount === 1 ? "comment" : "comments"}
              </span>
            )}
          </div>
          <CommentInput />
        </div>
      </div>

      {seeLikesModal && !!likes && (
        <LikesModal
          open={seeLikesModal}
          onClose={() => setSeeLikesModal(false)}
          postId={postId ?? ""}
        />
      )}
    </div>
  );
};

export default PostDetails;
