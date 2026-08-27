import { prisma } from "../database/prisma.js";

export const findUserAccountStatus = (userId: string) =>
  prisma.userAccountStatus.findUnique({ where: { userId } });
