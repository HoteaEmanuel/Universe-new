import { useState, type RefObject } from "react";
import { Link, useParams } from "react-router-dom";
import { Heart, Trash2 } from "lucide-react";
import ReportDialog from "@/features/moderation/components/ReportDialog";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { useGetUserByIdQuery } from "@/queryAndMutation/queries/user-queries";
import {
  useDeleteCommentMutation,
  useLikeCommentMutation,
  useRemoveLikeCommentMutation,
} from "@/queryAndMutation/mutations/comment-mutation";
import { formatDateDetailed } from "@/utils/formatDate";
import { formatCount } from "@/utils/formatCount";
import { urlPathName } from "@/utils/urlPathFromName";
import { getFullName } from "@/utils/fullName";
import type { PostComment } from "@/queryAndMutation/types";
import MentionText from "@/components/MentionText";
import UserAvatar from "@/components/UserAvatar";
import CommentReplies from "./CommentReplies";
import ReplyInput from "./ReplyInput";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type CommentProps = {
  comment: PostComment;
  scrollContainerRef?: RefObject<HTMLElement | null>;
  onDeleted?: () => void;
};

const Comment = ({ comment, scrollContainerRef, onDeleted }: CommentProps) => {
  const { id: postId } = useParams();
  const { user: authUser } = useAuthStore();
  const { data: user, isPending: isPendingUser } = useGetUserByIdQuery(
    comment.isBlocked ? undefined : (comment.userId ?? undefined),
  );
  const isReply = !!comment.parentId;
  const [liked, setLiked] = useState(comment.isLiked);
  const [likesCount, setLikesCount] = useState(comment.likesCount);
  const [repliesCount, setRepliesCount] = useState(comment.repliesCount ?? 0);
  const [repliesExpanded, setRepliesExpanded] = useState(false);
  const [replyBoxOpen, setReplyBoxOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const deleteComment = useDeleteCommentMutation(postId, comment.parentId);
  const likeComment = useLikeCommentMutation(postId, comment.parentId);
  const removeLikeComment = useRemoveLikeCommentMutation(postId, comment.parentId);

  if (!comment.isBlocked && (isPendingUser || !user)) return null;

  const isOwnComment = !comment.isBlocked && authUser!.id === user!.id;
  const fullName = comment.isBlocked ? "" : urlPathName(user!);

  const handleToggleLike = () => {
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikesCount((count) => count + (nextLiked ? 1 : -1));
    if (nextLiked) {
      likeComment.mutate(comment.id, {
        onError: () => {
          setLiked(false);
          setLikesCount((count) => count - 1);
        },
      });
    } else {
      removeLikeComment.mutate(comment.id, {
        onError: () => {
          setLiked(true);
          setLikesCount((count) => count + 1);
        },
      });
    }
  };

  const handleConfirmDelete = () => {
    deleteComment.mutate(comment.id, { onSuccess: () => onDeleted?.() });
  };

  const avatarSize = isReply ? "size-6" : "size-8";
  const heartSize = isReply ? "size-3" : "size-3.5";

  return (
    <div
      className={`group/comment flex items-start ${
        isReply ? "gap-2 py-1 text-xs" : "gap-2.5 py-1.5 text-sm"
      }`}
    >
      {comment.isBlocked ? (
        <UserAvatar className={`${avatarSize} shrink-0`} />
      ) : (
        <Link to={isOwnComment ? "/profile" : `/u/${fullName}`}>
          <UserAvatar user={user} className={`${avatarSize} shrink-0`} />
        </Link>
      )}

      <div className="min-w-0 flex-1">
        <p className="wrap-break-word">
          {comment.isBlocked ? (
            <span className="italic text-muted-foreground">{comment.text}</span>
          ) : (
            <>
              <Link
                to={isOwnComment ? "/profile" : `/u/${fullName}`}
                className="font-semibold"
              >
                {isOwnComment ? "You" : getFullName(user!)}
              </Link>{" "}
              {comment.isRemoved ? (
                <span className="italic text-muted-foreground">{comment.text}</span>
              ) : (
                <MentionText text={comment.text} mentionedUsers={comment.mentionedUsers ?? []} />
              )}
            </>
          )}
        </p>
        <div className="flex flex-col gap-1 pt-0.5 text-xs text-muted-foreground">
          <span>{formatDateDetailed(comment.createdAt)}</span>
          <div className="flex items-center gap-3">
            {!isReply && !comment.isBlocked && !comment.isRemoved && (
              <Button
                type="button"
                variant="ghost"
                className="h-auto gap-0 rounded-none bg-transparent p-0 font-medium hover:bg-transparent hover:text-foreground"
                onClick={() => setReplyBoxOpen((open) => !open)}
              >
                Reply
              </Button>
            )}
            {!isReply && (repliesCount > 0 || repliesExpanded) && (
              <Button
                type="button"
                variant="ghost"
                className="h-auto gap-0 rounded-none bg-transparent p-0 font-medium hover:bg-transparent hover:text-foreground"
                onClick={() => setRepliesExpanded((open) => !open)}
              >
                {repliesExpanded ? "Hide replies" : "View replies"}
              </Button>
            )}
            {isOwnComment && (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="rounded-none bg-transparent p-0 opacity-0 transition-opacity hover:bg-transparent hover:text-destructive group-hover/comment:opacity-100"
                onClick={() => setConfirmDeleteOpen(true)}
                aria-label="Delete comment"
              >
                <Trash2 className="size-3.5" />
              </Button>
            )}
            {!comment.isBlocked && !comment.isRemoved && !isOwnComment && (
              <Button
                type="button"
                variant="ghost"
                className="h-auto gap-0 rounded-none bg-transparent p-0 font-medium opacity-0 transition-opacity hover:bg-transparent hover:text-destructive group-hover/comment:opacity-100"
                onClick={() => setShowReportDialog(true)}
              >
                Report
              </Button>
            )}
          </div>
        </div>

        {!isReply && replyBoxOpen && (
          <ReplyInput
            postId={postId}
            parentId={comment.id}
            onSent={() => {
              setRepliesCount((count) => count + 1);
              setRepliesExpanded(true);
              setReplyBoxOpen(false);
            }}
          />
        )}

        {!isReply && repliesExpanded && scrollContainerRef && (
          <CommentReplies
            parentId={comment.id}
            scrollContainerRef={scrollContainerRef}
            onCountChange={(delta) =>
              setRepliesCount((count) => Math.max(0, count + delta))
            }
          />
        )}
      </div>

      {comment.isBlocked || comment.isRemoved ? null : isOwnComment ? (
        <span className="mt-1 flex shrink-0 flex-col items-center gap-0.5 text-muted-foreground">
          <Heart className={heartSize} fill="none" />
          {likesCount > 0 && (
            <span className="text-[10px] leading-none">{formatCount(likesCount)}</span>
          )}
        </span>
      ) : (
        <Button
          type="button"
          variant="ghost"
          className="mt-1 h-auto flex-col gap-0.5 rounded-none bg-transparent p-0 hover:bg-transparent"
          onClick={handleToggleLike}
          aria-label={liked ? "Unlike comment" : "Like comment"}
        >
          <Heart
            className={`${heartSize} transition-colors ${
              liked ? "text-like" : "text-muted-foreground hover:text-foreground"
            }`}
            fill={liked ? "currentColor" : "none"}
          />
          {likesCount > 0 && (
            <span
              className={`text-[10px] leading-none ${
                liked ? "text-like" : "text-muted-foreground"
              }`}
            >
              {formatCount(likesCount)}
            </span>
          )}
        </Button>
      )}

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete comment?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ReportDialog
        open={showReportDialog}
        onClose={() => setShowReportDialog(false)}
        targetType="comment"
        targetId={comment.id}
      />
    </div>
  );
};

export default Comment;
