import {
  createGroupMember,
  acquireGroupMember,
  findGroupMember,
  findGroupMembers,
  searchGroupMembersByUsername,
  findGroupMembershipsForUser,
  banGroupMember,
  deleteGroupBan,
  findGroupBansPage,
  GroupBannedError,
} from "../repository/group-members.repository.js";
import {
  createGroup,
  findGroupById,
  findPublicGroupsNotJoined,
  setGroupCourseTag,
} from "../repository/group.repository.js";
import { courseCatalog } from "../utils/courseCatalog.js";
import {
  createGroupMessage,
  findGroupMessageById,
} from "../repository/message.repository.js";
import {
  createGroupMessageNotification,
  emitNewNotification,
} from "../repository/notification.repository.js";
import { findUserById } from "../repository/user.repository.js";
import { findPostById } from "../repository/post.repository.js";
import { prisma } from "../database/prisma.js";
import { uploadImage, deleteImages } from "../lib/storage.js";
import type { GroupVisibility } from "../generated/prisma/client.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import { toPollDTO } from "./poll.service.js";
import { resolveGroupMentionedUsers } from "./group-mention.service.js";

type UploadedImage = Express.Multer.File;

export const withGroupMessagePollDTO = <
  T extends { poll?: Parameters<typeof toPollDTO>[0] | null },
>(
  message: T,
) => (message.poll ? { ...message, poll: toPollDTO(message.poll) } : message);

export const searchGroupMentionUsers = (groupId: string, query: string) =>
  searchGroupMembersByUsername(groupId, query);

export const createGroupService = async (data: {
  name: string;
  description?: string;
  userId: string;
  visibility?: GroupVisibility;
  courseTag?: string;
}) => {
  const { name, description, userId, visibility, courseTag } = data;

  const creator = await findUserById(userId);
  const university = creator?.university ?? null;

  if (courseTag) {
    const availableCourses = university ? (courseCatalog[university] ?? []) : [];
    if (!availableCourses.includes(courseTag)) {
      throw new Error("Selected course is not available for your university");
    }
  }

  const newGroup = await createGroup({
    name,
    description,
    visibility,
    university,
    courseTag: courseTag ?? null,
  });
  // When new group is created, the user that created that group is the admin
  await createGroupMember({ userId, groupId: newGroup.id, role: "admin" });
  return newGroup;
};

export const setGroupCourseTagService = async (data: {
  groupId: string;
  courseTag: string | null;
}) => {
  const { groupId, courseTag } = data;

  if (courseTag) {
    const group = await findGroupById(groupId);
    const availableCourses = group?.university
      ? (courseCatalog[group.university] ?? [])
      : [];
    if (!availableCourses.includes(courseTag)) {
      throw new Error("Selected course is not available for this group's university");
    }
  }

  return setGroupCourseTag(groupId, courseTag);
};

export const addMemberToGroup = async (data: {
  groupId: string;
  userId: string;
  requesterId: string;
}) => {
  const { groupId, userId, requesterId } = data;
  const isSelfJoin = userId === requesterId;

  if (isSelfJoin) {
    const group = await findGroupById(groupId);
    if (!group) throw new Error("Group not found");
    if (group.visibility !== "public") {
      throw new Error("This group is private. Ask an admin to add you.");
    }
  } else {
    const requester = await findGroupMember(groupId, requesterId);
    if (!requester || requester.role !== "admin") {
      throw new Error("Only group admins can add members");
    }
  }

  const existingMember = await findGroupMember(groupId, userId);
  if (existingMember) {
    throw new Error("User is already a member of this group");
  }

  return acquireGroupMember({ groupId, userId, role: "member" });
};

export { GroupBannedError };

export const banGroupMemberService = async (
  groupId: string,
  targetUserId: string,
  bannedByUserId: string,
  reason: string | undefined,
) => {
  const target = await findGroupMember(groupId, targetUserId);
  if (target?.role === "admin") {
    throw new Error("Group admins can't be banned - demote them first");
  }

  const ban = await banGroupMember({ groupId, userId: targetUserId, bannedByUserId, reason });

  const group = await findGroupById(groupId);
  const notification = await createGroupMessageNotification({
    userId: targetUserId,
    actionUserId: bannedByUserId,
    type: "group-banned",
    title: "Removed from group",
    message: `You were removed from ${group?.name ?? "the group"} and can no longer rejoin.`,
    groupId,
  });
  await emitNewNotification(targetUserId, notification);

  return ban;
};

export const unbanGroupMemberService = async (groupId: string, targetUserId: string) => {
  await deleteGroupBan(groupId, targetUserId);
};

export const getGroupBansService = async (
  groupId: string,
  cursor: string | undefined,
  limit: number,
) => {
  return findGroupBansPage({ groupId, cursor, limit });
};

export const getDiscoverablePublicGroups = async (
  userId: string,
  courseTag?: string,
) => {
  const memberships = await findGroupMembershipsForUser(userId);
  const joinedGroupIds = memberships.map((membership) => membership.groupId);
  return findPublicGroupsNotJoined(joinedGroupIds, courseTag);
};

export const getCourseCatalogForUser = async (userId: string, groupId?: string) => {
  if (groupId) {
    const group = await findGroupById(groupId);
    return group?.university ? (courseCatalog[group.university] ?? []) : [];
  }
  const user = await findUserById(userId);
  return user?.university ? (courseCatalog[user.university] ?? []) : [];
};

export const sendMessage = async (data: {
  groupId: string;
  images?: UploadedImage[];
  authUserId: string;
  messageText?: string;
}) => {
  const { groupId, images, authUserId, messageText } = data;

  let uploaded: { url: string; key: string }[] | undefined;
  if (images && images.length > 0) {
    uploaded = await Promise.all(
      images.map((image) =>
        uploadImage({
          buffer: image.buffer,
          mimeType: image.mimetype,
          folder: "message_images",
        }),
      ),
    );
  }

  const imageSecureUrls = uploaded?.map((u) => u.url);
  const imagePublicIds = uploaded?.map((u) => u.key);

  const group = await findGroupById(groupId);
  if (!group) throw new Error("Group doesnt exist");
  const mentionedUsers = await resolveGroupMentionedUsers(
    groupId,
    messageText,
    authUserId,
  );

  const groupMessage = await createGroupMessage({
    senderId: authUserId,
    groupId,
    messageText,
    imageUrls: imageSecureUrls,
    imagePublicIds,
    mentionedUserIds: mentionedUsers.map((user) => user.id),
  });

  await prisma.group.update({
    where: { id: groupId },
    data: { lastMessageId: groupMessage.id },
  });

  const members = await findGroupMembers(groupId);
  members.forEach((member) => {
    io.to(getReceiverSocketId(member.memberId)).emit("newGroupMessage", groupMessage);
  });

  const sender = await findUserById(authUserId);
  const recipients = members.filter((member) => member.memberId !== authUserId);
  await Promise.all(
    recipients.map(async (member) => {
      const notification = await createGroupMessageNotification({
        actionUserId: authUserId,
        userId: member.memberId,
        title: `New message in ${group.name}`,
        type: "message",
        message: `${sender?.firstName || sender?.name}: ${groupMessage.content ? groupMessage.content : "IMAGE"}`,
        groupId,
      });
      await emitNewNotification(member.memberId, notification);
    }),
  );

  return withGroupMessagePollDTO(groupMessage);
};

export const sendFilesMessage = async (data: {
  groupId: string;
  files: UploadedImage[];
  authUserId: string;
  messageText?: string;
}) => {
  const { groupId, files, authUserId, messageText } = data;

  const uploaded = await Promise.all(
    files.map(async (file) => {
      const { url, key } = await uploadImage({
        buffer: file.buffer,
        mimeType: file.mimetype,
        folder: "message_files",
      });
      return {
        fileUrl: url,
        fileKey: key,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
      };
    }),
  );

  const group = await findGroupById(groupId);
  if (!group) throw new Error("Group doesnt exist");
  const mentionedUsers = await resolveGroupMentionedUsers(
    groupId,
    messageText,
    authUserId,
  );

  const groupMessage = await createGroupMessage({
    senderId: authUserId,
    groupId,
    messageText,
    attachments: uploaded,
    mentionedUserIds: mentionedUsers.map((user) => user.id),
  });

  await prisma.group.update({
    where: { id: groupId },
    data: { lastMessageId: groupMessage.id },
  });

  const members = await findGroupMembers(groupId);
  members.forEach((member) => {
    io.to(getReceiverSocketId(member.memberId)).emit("newGroupMessage", groupMessage);
  });

  const sender = await findUserById(authUserId);
  const recipients = members.filter((member) => member.memberId !== authUserId);
  await Promise.all(
    recipients.map(async (member) => {
      const notification = await createGroupMessageNotification({
        actionUserId: authUserId,
        userId: member.memberId,
        title: `New message in ${group.name}`,
        type: "message",
        message: `${sender?.firstName || sender?.name}: ${groupMessage.content ? groupMessage.content : "FILE"}`,
        groupId,
      });
      await emitNewNotification(member.memberId, notification);
    }),
  );

  return withGroupMessagePollDTO(groupMessage);
};

export const sendVoiceMessage = async (data: {
  groupId: string;
  authUserId: string;
  audio: UploadedImage;
  durationSec: number;
}) => {
  const { groupId, authUserId, audio, durationSec } = data;

  const group = await findGroupById(groupId);
  if (!group) throw new Error("Group doesnt exist");

  const uploaded = await uploadImage({
    buffer: audio.buffer,
    mimeType: audio.mimetype,
    folder: "message_audio",
  });

  const groupMessage = await createGroupMessage({
    senderId: authUserId,
    groupId,
    audioUrl: uploaded.url,
    audioKey: uploaded.key,
    audioDurationSec: durationSec,
  });

  await prisma.group.update({
    where: { id: groupId },
    data: { lastMessageId: groupMessage.id },
  });

  const members = await findGroupMembers(groupId);
  members.forEach((member) => {
    io.to(getReceiverSocketId(member.memberId)).emit("newGroupMessage", groupMessage);
  });

  const sender = await findUserById(authUserId);
  const recipients = members.filter((member) => member.memberId !== authUserId);
  await Promise.all(
    recipients.map(async (member) => {
      const notification = await createGroupMessageNotification({
        actionUserId: authUserId,
        userId: member.memberId,
        title: `New message in ${group.name}`,
        type: "message",
        message: `${sender?.firstName || sender?.name}: Voice message`,
        groupId,
      });
      await emitNewNotification(member.memberId, notification);
    }),
  );

  return withGroupMessagePollDTO(groupMessage);
};

export const sendPollMessage = async (data: {
  groupId: string;
  authUserId: string;
  question: string;
  options: string[];
  closesAt?: Date;
}) => {
  const { groupId, authUserId, question, options, closesAt } = data;

  const group = await findGroupById(groupId);
  if (!group) throw new Error("Group doesnt exist");

  const groupMessage = await createGroupMessage({
    senderId: authUserId,
    groupId,
    poll: { authorId: authUserId, question, options, closesAt },
  });

  await prisma.group.update({
    where: { id: groupId },
    data: { lastMessageId: groupMessage.id },
  });

  const members = await findGroupMembers(groupId);
  members.forEach((member) => {
    io.to(getReceiverSocketId(member.memberId)).emit("newGroupMessage", groupMessage);
  });

  const sender = await findUserById(authUserId);
  const recipients = members.filter((member) => member.memberId !== authUserId);
  await Promise.all(
    recipients.map(async (member) => {
      const notification = await createGroupMessageNotification({
        actionUserId: authUserId,
        userId: member.memberId,
        title: `New message in ${group.name}`,
        type: "message",
        message: `${sender?.firstName || sender?.name}: Poll · ${question}`,
        groupId,
      });
      await emitNewNotification(member.memberId, notification);
    }),
  );

  return withGroupMessagePollDTO(groupMessage);
};

export const sharePostToGroups = async (data: {
  authUserId: string;
  postId: string;
  groupIds: string[];
}) => {
  const { authUserId, postId, groupIds } = data;
  const post = await findPostById(postId);
  if (!post) throw new Error("Post not found");

  const uniqueGroupIds = Array.from(new Set(groupIds));
  if (uniqueGroupIds.length === 0) throw new Error("No groups provided");

  return Promise.all(
    uniqueGroupIds.map(async (groupId) => {
      const membership = await findGroupMember(groupId, authUserId);
      if (!membership) throw new Error("You are not a member of this group");

      const group = await findGroupById(groupId);
      if (!group) throw new Error("Group doesnt exist");

      const groupMessage = await createGroupMessage({
        senderId: authUserId,
        groupId,
        sharedPostId: postId,
      });

      await prisma.group.update({
        where: { id: groupId },
        data: { lastMessageId: groupMessage.id },
      });

      const members = await findGroupMembers(groupId);
      members.forEach((member) => {
        io.to(getReceiverSocketId(member.memberId)).emit("newGroupMessage", groupMessage);
      });

      const sender = await findUserById(authUserId);
      const recipients = members.filter((member) => member.memberId !== authUserId);
      await Promise.all(
        recipients.map(async (member) => {
          const notification = await createGroupMessageNotification({
            actionUserId: authUserId,
            userId: member.memberId,
            title: `New message in ${group.name}`,
            type: "message",
            message: `${sender?.firstName || sender?.name}: Shared a post`,
            groupId,
          });
          await emitNewNotification(member.memberId, notification);
        }),
      );

      return withGroupMessagePollDTO(groupMessage);
    }),
  );
};

export const editMessage = async (data: {
  messageId: string;
  content: string;
}) => {
  const { messageId, content } = data;
  const message = await findGroupMessageById(messageId);
  if (!message) throw new Error("Message not found");

  const updated = await prisma.groupMessage.update({
    where: { id: messageId },
    data: { content, edited: true },
  });

  const users = await findGroupMembers(updated.groupId);
  users.forEach((user) => {
    io.to(getReceiverSocketId(user.memberId)).emit("messageEdited", updated);
  });
  return updated;
};

export const deleteMessage = async (data: { messageId: string }) => {
  const { messageId } = data;
  const message = await findGroupMessageById(messageId);
  if (!message) throw new Error("Message not found");

  await prisma.groupMessage.update({
    where: { id: messageId },
    data: { deleted: true },
  });

  const keysToDelete = [
    ...message.imagePublicIds,
    ...(message.audioKey ? [message.audioKey] : []),
    ...message.attachments.map((attachment) => attachment.fileKey),
  ];
  if (keysToDelete.length > 0) {
    deleteImages(keysToDelete).catch((error: unknown) => {
      console.error(`Failed to delete storage objects for group message ${messageId}:`, error);
    });
  }

  const groupMembers = await findGroupMembers(message.groupId);
  groupMembers.forEach((member) => {
    io.to(getReceiverSocketId(member.memberId)).emit("messageDeleted", {
      messageId,
      groupId: message.groupId,
    });
  });
};

export const setGroupMessageReaction = async (data: {
  messageId: string;
  userId: string;
  emoji: string;
}) => {
  const { messageId, userId, emoji } = data;
  const message = await findGroupMessageById(messageId);
  if (!message) throw new Error("Message not found");

  const existing = await prisma.groupMessageReaction.findUnique({
    where: { groupMessageId_userId: { groupMessageId: messageId, userId } },
  });

  const members = await findGroupMembers(message.groupId);

  if (existing?.emoji === emoji) {
    await prisma.groupMessageReaction.delete({ where: { id: existing.id } });
    members.forEach((member) => {
      io.to(getReceiverSocketId(member.memberId)).emit("groupReactionRemoved", {
        messageId,
        groupId: message.groupId,
        userId,
        emoji,
      });
    });
    return { removed: true, messageId, userId, emoji };
  }

  const reaction = await prisma.groupMessageReaction.upsert({
    where: { groupMessageId_userId: { groupMessageId: messageId, userId } },
    update: { emoji },
    create: { groupMessageId: messageId, userId, emoji },
  });
  members.forEach((member) => {
    io.to(getReceiverSocketId(member.memberId)).emit("groupReactionAdded", {
      ...reaction,
      groupId: message.groupId,
    });
  });
  return { removed: false, reaction };
};

export const updateGroupImage = async (data: {
  image?: UploadedImage;
  groupId: string;
}) => {
  const { image, groupId } = data;
  let uploaded: { url: string; key: string } | undefined;
  if (image?.buffer) {
    uploaded = await uploadImage({
      buffer: image.buffer,
      mimeType: image.mimetype,
      folder: "group_covers",
    });
  }
  const group = await findGroupById(groupId);
  if (!group) {
    throw new Error("Group not found");
  }
  await prisma.group.update({
    where: { id: groupId },
    data: {
      coverImageUrl: uploaded?.url || group.coverImageUrl,
      coverImagePublicId: uploaded?.key || group.coverImagePublicId,
    },
  });

  if (uploaded && group.coverImagePublicId) {
    deleteImages([group.coverImagePublicId]).catch((error: unknown) => {
      console.error(`Failed to delete previous cover image for group ${groupId}:`, error);
    });
  }
};

export const giveAdminRole = async (data: { groupId: string; memberId: string }) => {
  const { groupId, memberId } = data;
  const member = await findGroupMember(groupId, memberId);
  if (!member) {
    throw new Error("Member not found in group");
  }
  await prisma.groupMembers.update({
    where: { groupId_memberId: { groupId, memberId } },
    data: { role: "admin" },
  });
};
