import type { Request, Response } from "express";
import type {} from "multer";
import { prisma } from "../database/prisma.js";
import {
  createGroupService,
  deleteMessage,
  editMessage,
  giveAdminRole,
  sendMessage,
  sendFilesMessage,
  sendVoiceMessage,
  sendPollMessage,
  withGroupMessagePollDTO,
  setGroupMessageReaction,
  updateGroupImage,
  addMemberToGroup,
  getDiscoverablePublicGroups,
  getCourseCatalogForUser,
  setGroupCourseTagService,
  banGroupMemberService,
  unbanGroupMemberService,
  getGroupBansService,
  GroupBannedError,
  searchGroupMentionUsers,
} from "../services/group.service.js";
import {
  findUserGroupsPage,
  findGroupMembersPage,
} from "../repository/group-members.repository.js";
import {
  getGroupFilesPage,
  getGroupMediaPage,
  getGroupMessagesPage,
} from "../repository/message.repository.js";
import { getActiveConversationUsers } from "../lib/socket.js";
import type {
  BanGroupMemberInput,
  DiscoverGroupsQueryInput,
  GroupBansQueryInput,
  GroupMembersQueryInput,
  GroupsListQueryInput,
} from "../schemas/group.schema.js";

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong";

const MEMBER_SELECT = {
  id: true,
  username: true,
  firstName: true,
  lastName: true,
  profilePicture: true,
  accountType: true,
  name: true,
  university: true,
} as const;

export const createGroupController = async (req: Request, res: Response) => {
  try {
    const { name, description, visibility, courseTag } = req.body;
    const newGroup = await createGroupService({
      name,
      description,
      visibility,
      courseTag,
      userId: req.userId as string,
    });
    return res
      .status(201)
      .json({ message: "Group created successfully", group: newGroup });
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const getCourseCatalogController = async (req: Request, res: Response) => {
  try {
    const groupId = req.query.groupId as string | undefined;
    const courses = await getCourseCatalogForUser(req.userId as string, groupId);
    return res.status(200).json({ courses });
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const setGroupCourseTagController = async (req: Request, res: Response) => {
  try {
    const groupId = req.params.id as string;
    const { courseTag } = req.body;
    const group = await setGroupCourseTagService({
      groupId,
      courseTag: courseTag ?? null,
    });
    return res
      .status(200)
      .json({ message: "Course tag updated successfully", group });
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
    if (error instanceof GroupBannedError) {
      return res.status(403).json({ message: errorMessage(error) });
    }
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const getDiscoverableGroupsController = async (req: Request, res: Response) => {
  try {
    const { courseTag, universityOnly, limit } =
      req.query as unknown as DiscoverGroupsQueryInput;
    const groups = await getDiscoverablePublicGroups(
      req.userId as string,
      courseTag,
      universityOnly,
      limit,
    );
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
    const { cursor, search, limit } = req.query as unknown as GroupsListQueryInput;
    const { groups, nextCursor, hasMore } = await findUserGroupsPage({
      userId,
      cursor,
      search,
      limit,
    });

    return res.status(200).json({ groups, nextCursor, hasMore });
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

export const searchGroupMentionUsersController = async (
  req: Request,
  res: Response,
) => {
  try {
    const groupId = req.params.id as string;
    const q = req.query.q as string;
    const users = await searchGroupMentionUsers(groupId, q);
    return res.status(200).json({ users });
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const getGroupMessages = async (req: Request, res: Response) => {
  try {
    const groupId = req.params.id as string;
    const cursor = req.query.cursor as string | undefined;
    const limit = req.query.limit as unknown as number;
    const { messages, nextCursor, hasMore } = await getGroupMessagesPage(
      groupId,
      cursor,
      limit,
    );
    return res.status(200).json({
      groupMessages: messages.map(withGroupMessagePollDTO),
      nextCursor,
      hasMore,
    });
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const getGroupMediaController = async (req: Request, res: Response) => {
  try {
    const groupId = req.params.id as string;
    const type = req.query.type as "images" | "files";
    const before = req.query.before as string | undefined;
    const page =
      type === "files"
        ? await getGroupFilesPage(groupId, before)
        : await getGroupMediaPage(groupId, before);
    return res.status(200).json({ message: "Fetched the group media", ...page });
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

export const sendFilesMessageToGroupController = async (req: Request, res: Response) => {
  try {
    const groupId = req.params.id as string;
    const authUserId = req.userId as string;
    const { messageText } = req.body;
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) throw new Error("No files provided");
    const message = await sendFilesMessage({ groupId, files, authUserId, messageText });
    return res.status(201).json(message);
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const sendVoiceMessageToGroupController = async (req: Request, res: Response) => {
  try {
    const groupId = req.params.id as string;
    const authUserId = req.userId as string;
    const { durationSec } = req.body;
    const audio = req.file as Express.Multer.File | undefined;
    if (!audio) throw new Error("No audio file provided");
    const message = await sendVoiceMessage({ groupId, authUserId, audio, durationSec });
    return res.status(201).json(message);
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const sendPollMessageToGroupController = async (req: Request, res: Response) => {
  try {
    const groupId = req.params.id as string;
    const authUserId = req.userId as string;
    const { question, options, closesAt } = req.body;
    const message = await sendPollMessage({
      groupId,
      authUserId,
      question,
      options,
      closesAt,
    });
    return res.status(201).json(message);
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const editMessageController = async (req: Request, res: Response) => {
  try {
    const messageId = req.params.messageId as string;
    const { content } = req.body;
    const editedMessage = await editMessage({ content, messageId });
    return res.status(200).json({ editedMessage });
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const deleteMessageController = async (req: Request, res: Response) => {
  try {
    const messageId = req.params.messageId as string;
    await deleteMessage({ messageId });
    return res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const reactToGroupMessageController = async (req: Request, res: Response) => {
  try {
    const messageId = req.params.messageId as string;
    const userId = req.userId as string;
    const { emoji } = req.body;
    const result = await setGroupMessageReaction({ messageId, userId, emoji });
    return res.status(200).json(result);
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

export const getGroupMembersPage = async (req: Request, res: Response) => {
  try {
    const groupId = req.params.id as string;
    const { cursor, limit, search } =
      req.query as unknown as GroupMembersQueryInput;
    const page = await findGroupMembersPage({ groupId, cursor, limit, search });
    return res.status(200).json(page);
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

export const banGroupMemberController = async (req: Request, res: Response) => {
  try {
    const { reason } = req.body as BanGroupMemberInput;
    await banGroupMemberService(
      req.params.id as string,
      req.params.userId as string,
      req.userId as string,
      reason,
    );
    return res.status(200).json({ message: "Member removed and banned" });
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const unbanGroupMemberController = async (req: Request, res: Response) => {
  try {
    await unbanGroupMemberService(req.params.id as string, req.params.userId as string);
    return res.status(200).json({ message: "Member unbanned" });
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const getGroupBansController = async (req: Request, res: Response) => {
  try {
    const { cursor, limit } = req.query as unknown as GroupBansQueryInput;
    const page = await getGroupBansService(req.params.id as string, cursor, limit);
    return res.status(200).json(page);
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
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
