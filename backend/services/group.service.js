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
import { v2 as cloudinary } from "cloudinary";
import {
  getActiveConversationUsers,
  getReceiverSocketId,
  io,
} from "../lib/socket.js";
export const createGroupService = async (data) => {
  const { name, description, userId, visibility } = data;
  const groupData = { name, description, visibility };

  const newGroup = await createGroup(groupData);
  const memberData = { userId, groupId: newGroup._id, role: "admin" };
  // When new group is created, the user that created that group is the admin
  await createGroupMember(memberData);
  return newGroup;
};

export const addMemberToGroup = async (data) => {
  const { groupId, userId, requesterId } = data;
  const isSelfJoin = userId.toString() === requesterId.toString();

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

  const groupMember = await createGroupMember({ groupId, userId, role: "member" });
  return groupMember;
};

export const getDiscoverablePublicGroups = async (userId) => {
  const memberships = await findGroupMembershipsForUser(userId);
  const joinedGroupIds = memberships.map((membership) => membership.groupId);
  const groups = await findPublicGroupsNotJoined(joinedGroupIds);
  return groups;
};

export const sendMessage = async (data) => {
  const { groupId, images, authUserId, messageText } = data;

  console.log(groupId);
  let result = undefined;
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

  const imageSecureUrls = result ? result.map((r) => r.secure_url) : null;
  const imagePublicIds = result ? result.map((r) => r.public_id) : null;

  const group = await findGroupById(groupId);
  if (!group) throw new Error("Group doesnt exist");

  const messageData = {
    senderId: authUserId,
    groupId,
    messageText,
    imageUrls: imageSecureUrls,
    imagePublicIds,
  };
  const groupMessage = await createGroupMessage(messageData);

  group.lastMessage = groupMessage;

  await group.save();

  const members = await findGroupMembers(groupId);
  if (!members) {
    return;
  }
  // Send the message to all group members
  members.forEach((member) => {
    io.to(getReceiverSocketId(member.memberId.toString())).emit(
      "newGroupMessage",
      groupMessage,
    );
  });

  const activeConversationUsers=getActiveConversationUsers(groupId);

    // const notifData = {
    //     actionUserId: authUserId,
    //     userId: userId,
    //     title:"New message",
    //     type:"message",
    //     message: `${user?.firstName || user?.name}: ${message?.content ? message.content : 'IMAGE'}`,
    //     groupId:groupId
    //   };
    // const notification=await createMessageNotification(notifData);
  return groupMessage;
};

export const editMessage = async (data) => {
  const { authUserId, messageId, content } = data;
  const message = await findGroupMessageById(messageId);
  if (!message) throw new Error("Message not found");

  if (message.senderId.toString() !== authUserId.toString())
    throw new Error("Unauthorized");
  message.content = content;
  message.edited = true;

  message.updatedAt = Date.now();
  await message.save();
  const groupId = message.groupId.toString();
  const users = await findGroupMembers(groupId);
  users.forEach((user) => {
    io.to(getReceiverSocketId(user.memberId.toString())).emit(
      "messageEdited",
      message,
    );
  });
  return message;
};

export const deleteMessage = async (data) => {
  const { messageId, authUserId } = data;
  const message = await findGroupMessageById(messageId);
  if (!message) throw new Error("Message not found");
  if (message.senderId.toString() !== authUserId.toString())
    throw new Error("Unauthorized");
  message.deleted = true;
  await message.save();
  const groupId = message.groupId.toString();
  const groupMembers = await findGroupMembers(groupId);
  groupMembers.forEach((member) => {
    io.to(getReceiverSocketId(member.memberId.toString())).emit(
      "messageDeleted",
      { messageId, groupId },
    );
  });
};

export const updateGroupImage = async (data) => {
  const { image, groupId } = data;
  let result = undefined;
  if (image?.path) {
    result = await cloudinary.uploader.upload(image.path, {
      folder: "group_covers",
      resource_type: "image",
    });
  }
  const group = await findGroupById(groupId);
  if (!group) {
    return res.status(404).json({ message: "Group not found" });
  }
  group.coverImageUrl = result?.secure_url || group.coverImageUrl;
  group.coverImagePublicId = result?.public_id || group.coverImagePublicId;
  await group.save();
};

export const giveAdminRole = async (data) => {
  const { groupId, memberId } = data;
  const member = await findGroupMember(groupId, memberId);
  if (!member) {
    return res.status(404).json({ message: "Member not found in group" });
  }
  member.role = "admin";
  await member.save();
};
