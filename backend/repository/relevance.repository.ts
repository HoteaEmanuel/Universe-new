import { prisma } from "../database/prisma.js";

// "Relevant to the viewer" = people the viewer follows, plus anyone the
// viewer has interacted with: likes/comments exchanged on each other's
// posts, or existing DM history.
export const getViewerRelevantUserIds = async (
  viewerId: string,
): Promise<Set<string>> => {
  const [
    followingRows,
    likedMyPostsRows,
    commentedMyPostsRows,
    myLikesRows,
    myCommentsRows,
    conversationRows,
  ] = await Promise.all([
    prisma.follow.findMany({
      where: { followerId: viewerId },
      select: { followingId: true },
    }),
    prisma.like.findMany({
      where: { post: { userId: viewerId } },
      select: { userId: true },
    }),
    prisma.comment.findMany({
      where: { post: { userId: viewerId } },
      select: { userId: true },
    }),
    prisma.like.findMany({
      where: { userId: viewerId },
      select: { post: { select: { userId: true } } },
    }),
    prisma.comment.findMany({
      where: { userId: viewerId },
      select: { post: { select: { userId: true } } },
    }),
    prisma.conversation.findMany({
      where: {
        OR: [{ participantOneId: viewerId }, { participantTwoId: viewerId }],
      },
      select: { participantOneId: true, participantTwoId: true },
    }),
  ]);

  const relevantIds = new Set<string>();
  followingRows.forEach((r) => relevantIds.add(r.followingId));
  likedMyPostsRows.forEach((r) => relevantIds.add(r.userId));
  commentedMyPostsRows.forEach((r) => relevantIds.add(r.userId));
  myLikesRows.forEach((r) => relevantIds.add(r.post.userId));
  myCommentsRows.forEach((r) => relevantIds.add(r.post.userId));
  conversationRows.forEach((r) =>
    relevantIds.add(
      r.participantOneId === viewerId ? r.participantTwoId : r.participantOneId,
    ),
  );

  relevantIds.delete(viewerId);
  return relevantIds;
};

// Strictly the viewer's follow graph (they follow the user, or the user
// follows them) - narrower than getViewerRelevantUserIds, which also counts
// non-follow interactions like mutual likes/comments and DM history.
export const getFollowConnectedUserIds = async (
  viewerId: string,
): Promise<Set<string>> => {
  const rows = await prisma.follow.findMany({
    where: { OR: [{ followerId: viewerId }, { followingId: viewerId }] },
    select: { followerId: true, followingId: true },
  });

  const connectedIds = new Set<string>();
  rows.forEach((r) =>
    connectedIds.add(r.followerId === viewerId ? r.followingId : r.followerId),
  );
  return connectedIds;
};
