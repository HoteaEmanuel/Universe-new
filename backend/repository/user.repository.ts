import { prisma } from "../database/prisma.js";
import type { Prisma, AccountType } from "../generated/prisma/client.js";
import {
  generateDefaultUsername,
  isUsernameUniqueConstraintError,
} from "../utils/username.js";

// Allowlist, not a denylist: new sensitive columns added to the User model
// later default to excluded here instead of silently leaking to clients.
// Full detail, including PII (email, profilePictureKey, lastLogin, role,
// identityVerified). Only for trusted contexts: an admin reviewing business
// registrations. Never use this for a lookup of another user's profile.
export const PUBLIC_USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  name: true,
  username: true,
  email: true,
  lastLogin: true,
  isVerified: true,
  hasCompletedOnboarding: true,
  hasSeenAppTour: true,
  profilePicture: true,
  profilePictureKey: true,
  university: true,
  major: true,
  bio: true,
  role: true,
  accountType: true,
  identityVerified: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.UserSelect;

// Safe to return when any authenticated user looks up someone else's
// profile by id/username/name — omits email, profilePictureKey, lastLogin,
// role, and identityVerified.
export const PUBLIC_PROFILE_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  name: true,
  username: true,
  isVerified: true,
  profilePicture: true,
  university: true,
  major: true,
  bio: true,
  accountType: true,
  createdAt: true,
} as const satisfies Prisma.UserSelect;

export const findUserById = async (id: string) => {
  return prisma.user.findUnique({ where: { id }, omit: { password: true } });
};

export const findUserByEmail = async (email: string) => {
  return prisma.user.findUnique({ where: { email } });
};

export const findUserByName = async (name: string) => {
  return prisma.user.findFirst({ where: { name } });
};

export const findUserByUsername = async (username: string) =>
  prisma.user.findUnique({ where: { username } });

export const findUsersByUsernames = async (usernames: string[]) =>
  usernames.length === 0
    ? []
    : prisma.user.findMany({
        where: { username: { in: [...new Set(usernames)] } },
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          name: true,
          profilePicture: true,
        },
      });

export const createUserWithGeneratedUsername = async (
  data: Omit<Prisma.UserCreateInput, "username">,
  displayName?: string,
) => {
  // The unique index remains authoritative. A retry handles the extremely rare
  // collision without pre-checking a value that can become stale before insert.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.user.create({
        data: { ...data, username: generateDefaultUsername(displayName) },
      });
    } catch (error) {
      if (!isUsernameUniqueConstraintError(error) || attempt === 2) throw error;
    }
  }
  throw new Error("Could not allocate a username");
};

export const findUserByPasswordResetToken = async (token: string) => {
  return prisma.user.findFirst({ where: { resetPasswordToken: token } });
};

export const verifyUser = async (userId: string) => {
  return prisma.user.update({
    where: { id: userId },
    data: {
      verificationCode: null,
      verificationCodeExpiresAt: null,
      verificationAttempts: 0,
      verificationCooldownUntil: null,
      isVerified: true,
    },
  });
};

// Called on a wrong/expired verification code so an attacker can't brute-force
// the 6-digit space against a known email indefinitely — after enough wrong
// guesses, further attempts are cooled down for a short window rather than
// locking the account out entirely (a full lockout would force a resend for
// one honest typo).
export const recordFailedVerificationAttempt = async (
  userId: string,
  cooldownUntil: Date | null,
) => {
  return prisma.user.update({
    where: { id: userId },
    data: {
      verificationAttempts: { increment: 1 },
      verificationCooldownUntil: cooldownUntil,
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

  return createUserWithGeneratedUsername(
    {
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
    [firstName, lastName].filter(Boolean).join(" "),
  );
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

  return createUserWithGeneratedUsername(
    {
      name,
      email,
      password: hashedPassword,
      university: universityName,
      verificationCode,
      accountType,
      verificationCodeExpiresAt: new Date(Date.now() + 1000 * 60 * 15),
    },
    name,
  );
};

export const updateUser = async (
  id: string,
  data: Prisma.UserUpdateInput,
) => {
  return prisma.user.update({ where: { id }, data });
};
