import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useGetPostCommentsInfinite } from "../queryAndMutation/queries/comments-queries";
import { Skeleton } from "./ui/skeleton";
import Comment from "./Comment";

const SCROLL_FETCH_THRESHOLD = 150;

const CommentSkeletonRow = () => (
  <li className="flex items-start gap-2.5 py-1.5">
    <Skeleton className="size-8 shrink-0 rounded-full" />
    <div className="flex-1 space-y-1.5">
      <Skeleton className="h-3.5 w-3/4" />
      <Skeleton className="h-3 w-1/4" />
    </div>
  </li>
);

const CommentsSkeleton = () => (
  <ul className="flex flex-col gap-3 pt-1">
    {Array.from({ length: 3 }).map((_, i) => (
      <CommentSkeletonRow key={i} />
    ))}
  </ul>
);

// CommentsContainer doesn't own the scroll container — PostDetails' shared
// scroll region (post body + tags + comments) does — so find it at runtime
// instead of coupling to that ancestor's specific class name.
const findScrollableAncestor = (el: HTMLElement | null): HTMLElement | null => {
  let node = el?.parentElement ?? null;
  while (node && node !== document.body) {
    const { overflowY } = getComputedStyle(node);
    if (overflowY === "auto" || overflowY === "scroll") return node;
    node = node.parentElement;
  }
  return null;
};

const CommentsContainer = () => {
  const { id: postId } = useParams();
  const {
    data,
    isPending: isPendingComments,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetPostCommentsInfinite(postId);
  const listRef = useRef<HTMLUListElement>(null);
  // Shared with each top-level Comment so its expanded replies list can
  // attach its own scroll-distance listener to this same container instead
  // of re-walking the DOM per reply thread.
  const scrollContainerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    scrollContainerRef.current = findScrollableAncestor(listRef.current);
  }, []);

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
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isPendingComments) return <CommentsSkeleton />;

  const comments = data?.pages.flatMap((page) => page.comments) ?? [];

  if (!comments.length) {
    return (
      <p className="pt-8 text-center text-sm text-muted-foreground">
        No comments yet — start the conversation.
      </p>
    );
  }

  return (
    <ul ref={listRef} className="flex flex-col">
      {comments.map((comment) => (
        <li key={comment.id}>
          <Comment comment={comment} scrollContainerRef={scrollContainerRef} />
        </li>
      ))}
      {isFetchingNextPage && <CommentSkeletonRow />}
    </ul>
  );
};

export default CommentsContainer;
