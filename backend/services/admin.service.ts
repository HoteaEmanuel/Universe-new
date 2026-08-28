import {
  blockUser as blockUserRepo,
  unblockUser as unblockUserRepo,
} from "../repository/admin.repository.js";
import { findUserById } from "../repository/user.repository.js";
import { sendUnblockedAccountEmail } from "../mail-service/sendMail.js";

export class UserNotFoundError extends Error {}
export class SelfBlockError extends Error {}
export class CannotBlockAdminError extends Error {}

interface BlockUserServiceInput {
  userId: string;
  blockedByUserId: string;
  reason?: string;
}

export const blockUser = async ({ userId, blockedByUserId, reason }: BlockUserServiceInput) => {
  if (userId === blockedByUserId) {
    throw new SelfBlockError("You cannot block yourself");
  }
  const user = await findUserById(userId);
  if (!user) {
    throw new UserNotFoundError("User not found");
  }
  if (user.role === "admin") {
    throw new CannotBlockAdminError("Admins cannot block other admins");
  }

  await blockUserRepo({ userId, blockedByUserId, reason });
};

export const unblockUser = async (userId: string) => {
  const user = await findUserById(userId);
  if (!user) {
    throw new UserNotFoundError("User not found");
  }

  await unblockUserRepo(userId);
  await sendUnblockedAccountEmail(user);
};
