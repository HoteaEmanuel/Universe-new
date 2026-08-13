import type { Request, Response } from "express";
import type {} from "multer";
import { prisma } from "../database/prisma.js";
import {
  createGroupService,
  deleteMessage,
  editMessage,
  giveAdminRole,
  sendMessage,
  updateGroupImage,
  addMemberToGroup,
  getDiscoverablePublicGroups,
} from "../services/group.service.js";
import { findGroupMembershipsForUser } from "../repository/group-members.repository.js";
import { getActiveConversationUsers } from "../lib/socket.js";

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong";

const MEMBER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  profilePicture: true,
  accountType: true,
  name: true,
  university: true,
} as const;

export const createGroupController = async (req: Request, res: Response) => {
  try {
    const { name, description, visibility } = req.body;
    const newGroup = await createGroupService({
      name,
      description,
      visibility,
      userId: req.userId as string,
    });
    return res
      .status(201)
      .json({ message: "Group created successfully", group: newGroup });
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const addMemberToGroupController = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const groupId = req.params.id as string;

    const groupMember = await addMemberToGroup({
      userId,
      groupId,
      requesterId: req.userId as string,
    });
    return res.status(201).json({
      message: "User added to the group succesfully",
      data: groupMember,
    });
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const getDiscoverableGroupsController = async (req: Request, res: Response) => {
  try {
    const groups = await getDiscoverablePublicGroups(req.userId as string);
    return res.status(200).json({ groups });
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const deleteGroup = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.group.delete({ where: { id } });
    return res.status(200).json({ message: "Group deleted successfully" });
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const getUserGroups = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const memberships = await findGroupMembershipsForUser(userId);
    const groupIds = memberships.map((membership) => membership.groupId);
    const groups = await prisma.group.findMany({
      where: { id: { in: groupIds } },
      include: { lastMessage: true },
      orderBy: { updatedAt: "desc" },
    });

    return res.status(200).json({ groups });
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const getGroupById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const group = await prisma.group.findUnique({ where: { id } });
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    return res.status(200).json({ group });
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const getGroupMessages = async (req: Request, res: Response) => {
  try {
    const groupId = req.params.id as string;
    const groupMessages = await prisma.groupMessage.findMany({
      where: { groupId },
      orderBy: { createdAt: "asc" },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
            accountType: true,
            name: true,
          },
        },
      },
    });
    return res.status(200).json({ groupMessages });
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const sendMessageToGroupController = async (req: Request, res: Response) => {
  try {
    const groupId = req.params.id as string;
    const authUserId = req.userId as string;
    const { messageText } = req.body;
    const images = req.files as Express.Multer.File[] | undefined;

    const message = await sendMessage({ groupId, images, authUserId, messageText });
    return res.status(201).json(message);
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const editMessageController = async (req: Request, res: Response) => {
  try {
    const messageId = req.params.messageId as string;
    const authUserId = req.userId as string;
    const { content } = req.body;
    const editedMessage = await editMessage({ authUserId, content, messageId });
    return res.status(200).json({ editedMessage });
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const deleteMessageController = async (req: Request, res: Response) => {
  try {
    const messageId = req.params.messageId as string;
    const authUserId = req.userId as string;
    await deleteMessage({ messageId, authUserId });
    return res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const getGroupMembers = async (req: Request, res: Response) => {
  try {
    const groupId = req.params.id as string;
    const groupMembers = await prisma.groupMembers.findMany({
      where: { groupId },
      include: { member: { select: MEMBER_SELECT } },
    });
    return res.status(200).json({ members: groupMembers });
  } catch (error) {
    return res.status(400).json({ message: "Could not retrieve group members" });
  }
};

export const getGroupMemberById = async (req: Request, res: Response) => {
  try {
    const groupId = req.params.id as string;
    const member = await prisma.groupMembers.findUnique({
      where: { groupId_memberId: { groupId, memberId: req.userId as string } },
    });
    if (!member) {
      return res.status(404).json({ message: "Member not found in group" });
    }
    return res.status(200).json({ member });
  } catch (error) {
    return res.status(400).json({ message: "Could not retrieve group member" });
  }
};

export const getUsersFromSameUniversityNotInGroup = async (req: Request, res: Response) => {
  try {
    const groupId = req.params.id as string;
    const groupMembers = await prisma.groupMembers.findMany({ where: { groupId } });
    const memberIds = groupMembers.map((member) => member.memberId);
    const authUser = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!authUser) {
      return res.status(404).json({ message: "Authenticated user not found" });
    }
    const usersFromSameUniversity = await prisma.user.findMany({
      where: {
        university: authUser.university,
        id: { not: req.userId, notIn: memberIds },
      },
      select: MEMBER_SELECT,
    });
    return res.status(200).json({
      message: "Fetched users from same university not in group",
      users: usersFromSameUniversity,
    });
  } catch (error) {
    return res.status(400).json({ error });
  }
};

export const leaveGroup = async (req: Request, res: Response) => {
  try {
    const groupId = req.params.id as string;
    await prisma.groupMembers.deleteMany({
      where: { groupId, memberId: req.userId },
    });
    return res.status(200).json({ message: "Left the group successfully" });
  } catch (error) {
    return res.status(400).json({ message: "Could not leave the group" });
  }
};

export const kickMemberFromGroup = async (req: Request, res: Response) => {
  try {
    const groupId = req.params.id as string;
    const userId = req.params.userId as string;
    await prisma.groupMembers.deleteMany({ where: { groupId, memberId: userId } });
    return res
      .status(200)
      .json({ message: "Member kicked from the group successfully" });
  } catch (error) {
    return res.status(400).json({ message: "Could not kick member from group" });
  }
};

export const checkUserIsAdmin = async (req: Request, res: Response) => {
  try {
    const groupId = req.params.id as string;
    const userId = req.params.userId as string;
    const member = await prisma.groupMembers.findUnique({
      where: { groupId_memberId: { groupId, memberId: userId } },
    });
    if (!member) {
      return res.status(404).json({ message: "Member not found in group" });
    }
    const isAdmin = member.role === "admin";
    return res.status(200).json({ isAdmin });
  } catch (error) {
    return res.status(400).json({ message: "Could not verify if member is admin" });
  }
};

export const makeUserAdminController = async (req: Request, res: Response) => {
  try {
    const groupId = req.params.id as string;
    const userId = req.params.userId as string;
    await giveAdminRole({ groupId, memberId: userId });
    return res.status(200).json({ message: "Member promoted to admin successfully" });
  } catch (error) {
    return res.status(400).json({ message: "Could not promote member to admin" });
  }
};

export const updateGroupCoverImageController = async (req: Request, res: Response) => {
  try {
    const groupId = req.params.id as string;
    const image = req.file;
    await updateGroupImage({ image, groupId });
    return res
      .status(200)
      .json({ message: "Updated the group cover image successfully" });
  } catch (error) {
    return res.status(400).json({
      message: "Updating the group cover image went wrong",
      error: errorMessage(error),
    });
  }
};

export const getActiveGroupUsersOnConversation = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const activeUsersOnConversation = getActiveConversationUsers(id);
    return res.status(200).json({ activeUsers: [...(activeUsersOnConversation ?? [])] });
  } catch (error) {
    return res.status(400).json({ error: errorMessage(error) });
  }
};
