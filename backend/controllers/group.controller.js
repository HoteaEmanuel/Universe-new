import { GroupMembers } from "../models/group-members.model.js";
import { Group } from "../models/group.model.js";
import { User } from "../models/user.model.js";
import { GroupMessage } from "../models/group-message.model.js";
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
import { getActiveConversationUsers } from "../lib/socket.js";
export const createGroupController = async (req, res) => {
  try {
    const { name, description, visibility } = req.body;
    const data = { name, description, visibility, userId: req.userId };
    const newGroup = await createGroupService(data);
    return res
      .status(201)
      .json({ message: "Group created successfully", group: newGroup });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const addMemberToGroupController = async (req, res) => {
  try {
    const { userId } = req.body;
    const { id: groupId } = req.params;

    const groupData = { userId, groupId, requesterId: req.userId };
    const groupMember = await addMemberToGroup(groupData);
    return res.status(201).json({
      message: "User added to the group succesfully",
      data: groupMember,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const getDiscoverableGroupsController = async (req, res) => {
  try {
    const groups = await getDiscoverablePublicGroups(req.userId);
    return res.status(200).json({ groups });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;
    await Group.findByIdAndDelete(id);
    return res.status(200).json({ message: "Group deleted successfully" });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};


export const getUserGroups = async (req, res) => {
  try {
    const { userId } = req.params;
    const groupMemberships = await GroupMembers.find({ memberId: userId });
    const groupIds = groupMemberships.map((membership) => membership.groupId);
    const groups = await Group.find({ _id: { $in: groupIds } })
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    return res.status(200).json({ groups });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};


export const getGroupById = async (req, res) => {
  try {
    const { id } = req.params;
    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    return res.status(200).json({ group });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};


export const getGroupMessages = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const groupMessages = await GroupMessage.find({
      groupId: groupId,
    }).populate(
      "senderId",
      "firstName lastName profilePicture accountType name",
    );
    console.log("GROUP MESSAGES:", groupMessages);
    return res.status(200).json({ groupMessages });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const sendMessageToGroupController = async (req, res) => {
  console.log("ENDPOINT HIT");
  try {
    const { id: groupId } = req.params;
    const authUserId = req.userId;
    const { messageText } = req.body;
    const images = req.files;

    const data = { groupId, images, authUserId, messageText };
    const message = await sendMessage(data);
    return res.status(201).json(message);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const editMessageController = async (req, res) => {
  try {
    const { messageId } = req.params;
    const authUserId = req.userId;
    const { content } = req.body;
    const data = { authUserId, content, messageId };
    const editedMessage = await editMessage(data);
    return res.status(200).json({ editedMessage });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const deleteMessageController = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const authUserId = req.userId;
    const data = { messageId, authUserId };
    await deleteMessage(data);
    return res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const getGroupMembers = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const groupMembers = await GroupMembers.find({ groupId: groupId }).populate(
      "memberId",
      "firstName lastName profilePicture accountType _id university",
    );
    return res.status(200).json({ members: groupMembers });
  } catch (error) {
    return res
      .status(400)
      .json({ message: "Could not retrieve group members" });
  }
};


export const getGroupMemberById = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const member = await GroupMembers.findOne({
      groupId: groupId,
      memberId: req.userId,
    });
    if (!member) {
      return res.status(404).json({ message: "Member not found in group" });
    }
    return res.status(200).json({ member });
  } catch (error) {
    return res.status(400).json({ message: "Could not retrieve group member" });
  }
};

export const getUsersFromSameUniversityNotInGroup = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const groupMembers = await GroupMembers.find({ groupId: groupId });
    const memberIds = groupMembers.map((member) => member.memberId);
    const authUser = await User.findById(req.userId);
    if (!authUser) {
      return res.status(404).json({ message: "Authenticated user not found" });
    }
    const usersFromSameUniversity = await User.find({
      university: authUser.university,
      _id: { $ne: req.userId, $nin: memberIds },
    }).select(
      "firstName lastName name profilePicture accountType _id university",
    );
    return res.status(200).json({
      message: "Fetched users from same university not in group",
      users: usersFromSameUniversity,
    });
  } catch (error) {
    return res.status(400).json({ error: error });
  }
};

export const leaveGroup = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    await GroupMembers.findOneAndDelete({
      groupId: groupId,
      memberId: req.userId,
    });
    return res.status(200).json({ message: "Left the group successfully" });
  } catch (error) {
    return res.status(400).json({ message: "Could not leave the group" });
  }
};

export const kickMemberFromGroup = async (req, res) => {
  try {
    const { id: groupId, userId } = req.params;
    await GroupMembers.findOneAndDelete({
      groupId: groupId,
      memberId: userId,
    });
    return res
      .status(200)
      .json({ message: "Member kicked from the group successfully" });
  } catch (error) {
    return res
      .status(400)
      .json({ message: "Could not kick member from group" });
  }
};



export const checkUserIsAdmin = async (req, res) => {
  try {
    const { id: groupId, userId } = req.params;
    const member = await GroupMembers.findOne({
      groupId: groupId,
      memberId: userId,
    });
    if (!member) {
      return res.status(404).json({ message: "Member not found in group" });
    }
    const isAdmin = member.role === "admin";
    return res.status(200).json({ isAdmin });
  } catch (error) {
    return res
      .status(400)
      .json({ message: "Could not verify if member is admin" });
  }
};


export const makeUserAdminController = async (req, res) => {
  try {
    const { id: groupId, userId } = req.params;
    const data = { groupId, memberId: userId };
    await giveAdminRole(data);
    return res
      .status(200)
      .json({ message: "Member promoted to admin successfully" });
  } catch (error) {
    return res
      .status(400)
      .json({ message: "Could not promote member to admin" });
  }
};

export const updateGroupCoverImageController = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const image = req.file;
    const data = { image, groupId };
    await updateGroupImage(data);
    return res
      .status(200)
      .json({ message: "Updated the group cover image successfully" });
  } catch (error) {
    return res.status(400).json({
      message: "Updating the group cover image went wrong",
      error: error,
    });
  }
};


export const getActiveGroupUsersOnConversation =async (req,res)=>{
try{
  const { id } = req.params;
  const activeUsersOnConversation=getActiveConversationUsers(id);

  console.log("ACTIVE USERS HERE: ")
  console.log(activeUsersOnConversation);
  return res.status(200).json({ activeUsers: [...activeUsersOnConversation]});
}
catch(error){
  return res.status(400).json({error:error.message});
}
}