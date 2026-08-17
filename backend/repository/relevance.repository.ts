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

interface ShareRecipientUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  name: string | null;
  profilePicture: string | null;
}

export interface ShareRecipient extends ShareRecipientUser {
  lastInteractionAt: Date;
}

const SHARE_RECIPIENT_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  name: true,
  profilePicture: true,
} as const;

// Candidate pool for the "Send post to" picker: the viewer's follow graph,
// DM partners, and group co-members - deduped, each ranked by the most
// recent of whichever of those signals applies to them.
export const getShareRecipients = async (viewerId: string): Promise<ShareRecipient[]> => {
  const myGroupIds = (
    await prisma.groupMembers.findMany({
      where: { memberId: viewerId },
      select: { groupId: true },
    })
  ).map((m) => m.groupId);

  const [followRows, conversationRows, coMemberRows] = await Promise.all([
    prisma.follow.findMany({
      where: { OR: [{ followerId: viewerId }, { followingId: viewerId }] },
      select: {
        followerId: true,
        createdAt: true,
        follower: { select: SHARE_RECIPIENT_SELECT },
        following: { select: SHARE_RECIPIENT_SELECT },
      },
    }),
    prisma.conversation.findMany({
      where: { OR: [{ participantOneId: viewerId }, { participantTwoId: viewerId }] },
      select: {
        participantOneId: true,
        updatedAt: true,
        participantOne: { select: SHARE_RECIPIENT_SELECT },
        participantTwo: { select: SHARE_RECIPIENT_SELECT },
      },
    }),
    myGroupIds.length > 0
      ? prisma.groupMembers.findMany({
          where: { groupId: { in: myGroupIds }, memberId: { not: viewerId } },
          select: {
            createdAt: true,
            member: { select: SHARE_RECIPIENT_SELECT },
          },
        })
      : Promise.resolve([]),
  ]);

  const byId = new Map<string, ShareRecipient>();
  const bump = (user: ShareRecipientUser, at: Date) => {
    const existing = byId.get(user.id);
    if (!existing || at > existing.lastInteractionAt) {
      byId.set(user.id, { ...user, lastInteractionAt: at });
    }
  };

  followRows.forEach((row) => {
    const other = row.followerId === viewerId ? row.following : row.follower;
    bump(other, row.createdAt);
  });
  conversationRows.forEach((row) => {
    const other = row.participantOneId === viewerId ? row.participantTwo : row.participantOne;
    bump(other, row.updatedAt);
  });
  coMemberRows.forEach((row) => {
    bump(row.member, row.createdAt);
  });

  byId.delete(viewerId);
  return Array.from(byId.values()).sort(
    (a, b) => b.lastInteractionAt.getTime() - a.lastInteractionAt.getTime(),
  );
};
