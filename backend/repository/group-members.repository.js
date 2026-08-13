import { GroupMembers } from "../models/group-members.model.js";

export const createGroupMember = async (memberData) => {
  const { groupId, userId, role } = memberData;
  const newMember = await GroupMembers.create({
    groupId: groupId,
    memberId: userId,
    role: role,
  });
  return newMember;
};

export const findGroupMembers = async (groupId) => {
  const members = await GroupMembers.find({ groupId: groupId });
  return members;
};

export const findGroupMembershipsForUser = async (userId) => {
  const memberships = await GroupMembers.find({ memberId: userId });
  return memberships;
};


export const findGroupMember=async(groupId,memberId)=>{
    const member=await GroupMembers.findOne({groupId,memberId});
    return member;
}