import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useGetPostComments } from "../queryAndMutation/queries/comments-queries";
import { useAuthStore } from "../store/authStore";
import { Skeleton } from "./ui/skeleton";
import Comment from "./Comment";

const CommentsSkeleton = () => (
  <ul className="flex flex-col gap-3 pt-1">
    {Array.from({ length: 3 }).map((_, i) => (
      <li key={i} className="flex items-start gap-2.5 py-1.5">
        <Skeleton className="size-8 shrink-0 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-3/4" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </li>
    ))}
  </ul>
);

const CommentsContainer = () => {
  const { id: postId } = useParams();
  const { data: comments, isPending: isPendingComments } =
    useGetPostComments(postId);
  const { socket } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) return;
    const handleNewComment = () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["comments-count", postId] });
    };
    socket.on("newComment", handleNewComment);
    return () => {
      socket.off("newComment", handleNewComment);
    };
  }, [socket, queryClient, postId]);

  if (isPendingComments) return <CommentsSkeleton />;

  if (!comments?.length) {
    return (
      <p className="pt-8 text-center text-sm text-muted-foreground">
        No comments yet — start the conversation.
      </p>
    );
  }

  return (
    <ul className="flex flex-col">
      {comments.map((comment) => (
        <li key={comment._id}>
          <Comment comment={comment} />
        </li>
      ))}
    </ul>
  );
};

export default CommentsContainer;
