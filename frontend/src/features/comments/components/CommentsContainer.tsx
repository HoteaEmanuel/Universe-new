import { useCallback, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useGetPostCommentsInfinite } from "@/queryAndMutation/queries/comments-queries";
import { Skeleton } from "@/components/ui/skeleton";
import Comment from "./Comment";
import { findScrollableAncestor } from "../utils/scroll";

const SCROLL_FETCH_THRESHOLD = 150;
// Comment rows vary with wrapped text and expanded reply threads — this is
// just the initial guess react-virtual uses before `measureElement`
// corrects it to the row's real rendered height.
const ESTIMATED_COMMENT_HEIGHT = 64;

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

const CommentsContainer = () => {
  const { id: postId } = useParams();
  const {
    data,
    isPending: isPendingComments,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetPostCommentsInfinite(postId);
  // Shared with each top-level Comment so its expanded replies list can
  // attach its own scroll-distance listener to this same container instead
  // of re-walking the DOM per reply thread.
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  // A callback ref (rather than a one-shot effect) so the ancestor lookup
  // reruns whenever the list actually mounts — on a cold load the first
  // render shows CommentsSkeleton, not this <ul>, so an effect with an
  // empty dep array would capture `null` and never retry.
  const listRef = useCallback((node: HTMLUListElement | null) => {
    scrollContainerRef.current = findScrollableAncestor(node);
  }, []);

  const comments = data?.pages.flatMap((page) => page.comments) ?? [];

  const virtualizer = useVirtualizer({
    count: comments.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => ESTIMATED_COMMENT_HEIGHT,
    overscan: 10,
    getItemKey: (index) => comments[index].id,
  });

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
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, comments.length]);

  if (isPendingComments) return <CommentsSkeleton />;

  if (!comments.length) {
    return (
      <p className="pt-8 text-center text-sm text-muted-foreground">
        No comments yet — start the conversation.
      </p>
    );
  }

  return (
    <>
      <ul
        ref={listRef}
        className="relative"
        style={{ height: virtualizer.getTotalSize() }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const comment = comments[virtualItem.index];
          return (
            <li
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              className="absolute top-0 left-0 w-full"
              style={{ transform: `translateY(${virtualItem.start}px)` }}
            >
              <Comment comment={comment} scrollContainerRef={scrollContainerRef} />
            </li>
          );
        })}
      </ul>
      {isFetchingNextPage && (
        <ul>
          <CommentSkeletonRow />
        </ul>
      )}
    </>
  );
};

export default CommentsContainer;
