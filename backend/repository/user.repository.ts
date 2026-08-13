import { prisma } from "../database/prisma.js";
import type { Prisma, AccountType } from "../generated/prisma/client.js";

export const findUserById = async (id: string) => {
  return prisma.user.findUnique({ where: { id }, omit: { password: true } });
};

export const findUserByEmail = async (email: string) => {
  return prisma.user.findUnique({ where: { email } });
};

export const findUserByVerificationCode = async (code: string) => {
  return prisma.user.findFirst({ where: { verificationCode: code } });
};

export const findUserByName = async (name: string) => {
  return prisma.user.findFirst({ where: { name } });
};

export const findUserByPasswordResetToken = async (token: string) => {
  return prisma.user.findFirst({ where: { resetPasswordToken: token } });
};

export const verifyUser = async (code: string) => {
  const user = await findUserByVerificationCode(code);
  if (!user) return null;
  return prisma.user.update({
    where: { id: user.id },
    data: {
      verificationCode: null,
      verificationCodeExpiresAt: null,
      isVerified: true,
    },
  });
};

interface CreateNormalAccountInput {
  firstName?: string;
  lastName?: string;
  email: string;
  hashedPassword: string;
  accountType: AccountType;
  universityName?: string;
  verificationCode: string;
  major?: string;
}

export const createNormalAccount = async (body: CreateNormalAccountInput) => {
  const {
    firstName,
    lastName,
    email,
    hashedPassword,
    accountType,
    universityName,
    verificationCode,
    major,
  } = body;

  return prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      university: universityName,
      major: major || "",
      verificationCode,
      identityVerified: "true",
      accountType,
      verificationCodeExpiresAt: new Date(Date.now() + 1000 * 60 * 15),
    },
  });
};

interface CreateUniversityAccountInput {
  name?: string;
  email: string;
  hashedPassword: string;
  universityName?: string;
  verificationCode: string;
  accountType: AccountType;
}

export const createUniversityAccount = async (
  body: CreateUniversityAccountInput,
) => {
  const {
    name,
    email,
    hashedPassword,
    universityName,
    verificationCode,
    accountType,
  } = body;

  return prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      university: universityName,
      verificationCode,
      accountType,
      verificationCodeExpiresAt: new Date(Date.now() + 1000 * 60 * 15),
    },
  });
};

export const updateUser = async (
  id: string,
  data: Prisma.UserUpdateInput,
) => {
  return prisma.user.update({ where: { id }, data });
};
