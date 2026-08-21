import { findGroupMembersByUsernames } from "../repository/group-members.repository.js";
import { extractMentionedUsernames } from "../utils/mentions.js";

export const resolveGroupMentionedUsers = async (
  groupId: string,
  text: string | undefined | null,
  excludeUserId: string,
) => {
  const users = await findGroupMembersByUsernames(
    groupId,
    extractMentionedUsernames(text),
  );
  return users.filter((user) => user.id !== excludeUserId);
};
