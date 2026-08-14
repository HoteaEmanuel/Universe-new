import { prisma } from "../database/prisma.js";

interface PreferencesInput {
  theme?: string;
  notificationsEnabled?: boolean;
}

export const findOrCreateUserPreferences = async (userId: string) => {
  return prisma.userPreferences.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
};

export const updateUserPreferences = async (
  userId: string,
  data: PreferencesInput,
) => {
  return prisma.userPreferences.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  });
};
