import { findUsersByUsernames } from "../repository/user.repository.js";
import { extractMentionedUsernames } from "../utils/mentions.js";

export const resolveMentionedUsers = async (
  text: string | undefined | null,
  excludeUserId: string,
) => {
  const users = await findUsersByUsernames(extractMentionedUsernames(text));
  return users.filter((user) => user.id !== excludeUserId);
};
