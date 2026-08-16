import {
  createGroupMember,
  findGroupMember,
  findGroupMembers,
  findGroupMembershipsForUser,
} from "../repository/group-members.repository.js";
import {
  createGroup,
  findGroupById,
  findPublicGroupsNotJoined,
} from "../repository/group.repository.js";
import {
  createGroupMessage,
  findGroupMessageById,
} from "../repository/message.repository.js";
import {
  createGroupMessageNotification,
  emitNewNotification,
} from "../repository/notification.repository.js";
import { findUserById } from "../repository/user.repository.js";
import { prisma } from "../database/prisma.js";
import { uploadImage, deleteImages } from "../lib/storage.js";
import type { GroupVisibility } from "../generated/prisma/client.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

type UploadedImage = Express.Multer.File;

export const createGroupService = async (data: {
  name: string;
  description?: string;
  userId: string;
  visibility?: GroupVisibility;
}) => {
  const { name, description, userId, visibility } = data;

  const newGroup = await createGroup({ name, description, visibility });
  // When new group is created, the user that created that group is the admin
  await createGroupMember({ userId, groupId: newGroup.id, role: "admin" });
  return newGroup;
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

  return createGroupMember({ groupId, userId, role: "member" });
};

export const getDiscoverablePublicGroups = async (userId: string) => {
  const memberships = await findGroupMembershipsForUser(userId);
  const joinedGroupIds = memberships.map((membership) => membership.groupId);
  return findPublicGroupsNotJoined(joinedGroupIds);
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

  const groupMessage = await createGroupMessage({
    senderId: authUserId,
    groupId,
    messageText,
    imageUrls: imageSecureUrls,
    imagePublicIds,
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

  return groupMessage;
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

  return groupMessage;
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

  const keysToDelete = message.audioKey
    ? [...message.imagePublicIds, message.audioKey]
    : message.imagePublicIds;
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
