import { Group } from "../models/group.model.js";

export const createGroup = async (data) => {
  const { name, description, visibility } = data;
  const newGroup = await Group.create({ name, description, visibility });
  return newGroup;
};

export const findGroupById = async (groupId) => {
  const group = await Group.find({ _id: groupId });
  return group;
};

export const findPublicGroupsNotJoined = async (excludedGroupIds) => {
  const groups = await Group.find({
    visibility: "public",
    _id: { $nin: excludedGroupIds },
  }).sort({ createdAt: -1 });
  return groups;
};
