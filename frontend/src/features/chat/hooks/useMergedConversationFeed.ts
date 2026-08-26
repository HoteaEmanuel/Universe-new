import { useMemo } from "react";
import { useGetUserConversationsInfinite } from "@/queryAndMutation/queries/conversation-queries";
import { useGetUserGroupsInfinite } from "@/queryAndMutation/queries/group-queries";
import type { ConversationListEntry } from "../types";

// A list that still has more pages can't be trusted past its last-loaded
// row - there could be an item further back, on the other list, that
// belongs above it. An exhausted list has no such gap, so it contributes no
// cutoff at all.
const boundaryTime = (items: { updatedAt: string }[], hasNextPage: boolean) => {
  if (!hasNextPage) return -Infinity;
  const last = items[items.length - 1];
  return last ? new Date(last.updatedAt).getTime() : -Infinity;
};

export const useMergedConversationFeed = (userId: string | undefined, search: string) => {
  const dms = useGetUserConversationsInfinite(search);
  const groups = useGetUserGroupsInfinite(userId, search);

  const dmItems = useMemo(
    () => dms.data?.pages.flatMap((page) => page.conversations) ?? [],
    [dms.data],
  );
  const groupItems = useMemo(
    () => groups.data?.pages.flatMap((page) => page.groups) ?? [],
    [groups.data],
  );

  const items = useMemo<ConversationListEntry[]>(() => {
    const cutoff = Math.max(
      boundaryTime(dmItems, !!dms.hasNextPage),
      boundaryTime(groupItems, !!groups.hasNextPage),
    );
    return [...dmItems, ...groupItems]
      .filter((entry) => new Date(entry.updatedAt).getTime() >= cutoff)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [dmItems, groupItems, dms.hasNextPage, groups.hasNextPage]);

  const fetchNextPage = () => {
    dms.fetchNextPage();
    groups.fetchNextPage();
  };

  return {
    items,
    isPending: dms.isPending || groups.isPending,
    hasMore: !!dms.hasNextPage || !!groups.hasNextPage,
    isFetchingNextPage: dms.isFetchingNextPage || groups.isFetchingNextPage,
    fetchNextPage,
  };
};
