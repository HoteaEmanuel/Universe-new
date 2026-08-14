import { useEffect, type RefObject } from "react";
import { useParams } from "react-router-dom";
import { useGetCommentRepliesInfinite } from "@/queryAndMutation/queries/comments-queries";
import { Skeleton } from "@/components/ui/skeleton";
import Comment from "./Comment";

const SCROLL_FETCH_THRESHOLD = 150;

const ReplySkeletonRow = () => (
  <li className="flex items-start gap-2 py-1">
    <Skeleton className="size-6 shrink-0 rounded-full" />
    <div className="flex-1 space-y-1">
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="h-2.5 w-1/5" />
    </div>
  </li>
);

type CommentRepliesProps = {
  parentId: string;
  scrollContainerRef: RefObject<HTMLElement | null>;
  onCountChange: (delta: number) => void;
};

const CommentReplies = ({
  parentId,
  scrollContainerRef,
  onCountChange,
}: CommentRepliesProps) => {
  const { id: postId } = useParams();
  const {
    data,
    isPending,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetCommentRepliesInfinite(postId, parentId);

  useEffect(() => {
    const scrollEl = scrollContainerRef.current;
    if (!scrollEl) return;

    const handleScroll = () => {
      const distanceFromBottom =
        scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight;
      if (
        hasNextPage &&
        !isFetchingNextPage &&
        distanceFromBottom < SCROLL_FETCH_THRESHOLD
      ) {
        fetchNextPage();
      }
    };
    scrollEl.addEventListener("scroll", handleScroll);
    return () => scrollEl.removeEventListener("scroll", handleScroll);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, scrollContainerRef]);

  if (isPending) {
    return (
      <ul className="mt-1.5 flex flex-col border-l border-border pl-3">
        <ReplySkeletonRow />
      </ul>
    );
  }

  const replies = data?.pages.flatMap((page) => page.comments) ?? [];

  return (
    <ul className="mt-1.5 flex flex-col border-l border-border pl-3">
      {replies.map((reply) => (
        <li key={reply.id}>
          <Comment comment={reply} onDeleted={() => onCountChange(-1)} />
        </li>
      ))}
      {isFetchingNextPage && <ReplySkeletonRow />}
    </ul>
  );
};

export default CommentReplies;
