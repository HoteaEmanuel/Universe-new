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
import { uploadImageAndCleanup } from "../lib/cloudinary.js";
import type { GroupVisibility } from "../generated/prisma/client.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

interface UploadedImage {
  path: string;
}

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

  let result: { secure_url: string; public_id: string }[] | undefined;
  if (images && images.length > 0) {
    result = await Promise.all(
      images.map((image) =>
        uploadImageAndCleanup(image.path, {
          folder: "message_images",
          resource_type: "image",
        }),
      ),
    );
  }

  const imageSecureUrls = result?.map((r) => r.secure_url);
  const imagePublicIds = result?.map((r) => r.public_id);

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
  let result: { secure_url: string; public_id: string } | undefined;
  if (image?.path) {
    result = await uploadImageAndCleanup(image.path, {
      folder: "group_covers",
      resource_type: "image",
    });
  }
  const group = await findGroupById(groupId);
  if (!group) {
    throw new Error("Group not found");
  }
  await prisma.group.update({
    where: { id: groupId },
    data: {
      coverImageUrl: result?.secure_url || group.coverImageUrl,
      coverImagePublicId: result?.public_id || group.coverImagePublicId,
    },
  });
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
