import crypto from "crypto";

export const generateVerificationToken = (): string => {
  return crypto.randomInt(100_000, 1_000_000).toString();
};
