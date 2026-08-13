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
import { prisma } from "../database/prisma.js";
import { v2 as cloudinary } from "cloudinary";
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
        cloudinary.uploader.upload(image.path, {
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

  return groupMessage;
};

export const editMessage = async (data: {
  authUserId: string;
  messageId: string;
  content: string;
}) => {
  const { authUserId, messageId, content } = data;
  const message = await findGroupMessageById(messageId);
  if (!message) throw new Error("Message not found");

  if (message.senderId !== authUserId) throw new Error("Unauthorized");

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

export const deleteMessage = async (data: { messageId: string; authUserId: string }) => {
  const { messageId, authUserId } = data;
  const message = await findGroupMessageById(messageId);
  if (!message) throw new Error("Message not found");
  if (message.senderId !== authUserId) throw new Error("Unauthorized");

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

export const updateGroupImage = async (data: {
  image?: UploadedImage;
  groupId: string;
}) => {
  const { image, groupId } = data;
  let result: { secure_url: string; public_id: string } | undefined;
  if (image?.path) {
    result = await cloudinary.uploader.upload(image.path, {
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
