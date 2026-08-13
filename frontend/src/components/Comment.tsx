import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import { Heart, Trash2 } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useGetUserByIdQuery } from "../queryAndMutation/queries/user-queries";
import {
  useDeleteCommentMutation,
  useLikeCommentMutation,
  useRemoveLikeCommentMutation,
} from "../queryAndMutation/mutations/comment-mutation";
import { formatDateDetailed } from "../utils/formatDate";
import { urlPathName } from "../utils/urlPathFromName";
import { getFullName } from "../utils/fullName";
import type { PostComment } from "../queryAndMutation/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

type CommentProps = {
  comment: PostComment;
};

const Comment = ({ comment }: CommentProps) => {
  const { id: postId } = useParams();
  const { user: authUser } = useAuthStore();
  const { data: user, isPending: isPendingUser } = useGetUserByIdQuery(
    comment.userId,
  );
  const [liked, setLiked] = useState(comment.isLiked);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const deleteComment = useDeleteCommentMutation(postId);
  const likeComment = useLikeCommentMutation(postId);
  const removeLikeComment = useRemoveLikeCommentMutation(postId);

  if (isPendingUser || !user) return null;

  const isOwnComment = authUser._id === user._id;
  const fullName = urlPathName(user);

  const handleToggleLike = () => {
    const nextLiked = !liked;
    setLiked(nextLiked);
    if (nextLiked) {
      likeComment.mutate(comment._id, { onError: () => setLiked(false) });
    } else {
      removeLikeComment.mutate(comment._id, { onError: () => setLiked(true) });
    }
  };

  return (
    <div className="group/comment flex items-start gap-2.5 py-1.5">
      <Link to={isOwnComment ? "/profile" : `/users/${fullName}`}>
        {user.profilePicture ? (
          <img
            src={user.profilePicture}
            alt={getFullName(user)}
            className="size-8 shrink-0 rounded-full object-cover"
          />
        ) : (
          <FaUserCircle className="size-8 shrink-0 text-muted-foreground" />
        )}
      </Link>

      <div className="min-w-0 flex-1 text-sm">
        <p className="wrap-break-word">
          <Link
            to={isOwnComment ? "/profile" : `/users/${fullName}`}
            className="font-semibold"
          >
            {isOwnComment ? "You" : getFullName(user)}
          </Link>{" "}
          <span>{comment.text}</span>
        </p>
        <div className="flex items-center gap-3 pt-0.5 text-xs text-muted-foreground">
          <span>{formatDateDetailed(comment.createdAt)}</span>
          {isOwnComment && (
            <button
              type="button"
              className="opacity-0 transition-opacity hover:text-destructive group-hover/comment:opacity-100"
              onClick={() => setConfirmDeleteOpen(true)}
              aria-label="Delete comment"
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {!isOwnComment && (
        <button
          type="button"
          className="mt-1 shrink-0"
          onClick={handleToggleLike}
          aria-label={liked ? "Unlike comment" : "Like comment"}
        >
          <Heart
            className={`size-3.5 transition-colors ${
              liked ? "text-like" : "text-muted-foreground hover:text-foreground"
            }`}
            fill={liked ? "currentColor" : "none"}
          />
        </button>
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
            <AlertDialogAction
              variant="destructive"
              onClick={() => deleteComment.mutate(comment._id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Comment;
