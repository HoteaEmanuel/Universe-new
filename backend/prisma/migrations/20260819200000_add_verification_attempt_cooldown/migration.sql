-- AlterTable
ALTER TABLE "users" ADD COLUMN     "verificationAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "verificationCooldownUntil" TIMESTAMP(3);
