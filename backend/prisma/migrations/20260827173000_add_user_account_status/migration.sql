-- CreateEnum
CREATE TYPE "UserAccountStatusValue" AS ENUM ('active', 'blocked');

-- CreateTable
CREATE TABLE "user_account_statuses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "UserAccountStatusValue" NOT NULL DEFAULT 'active',
    "reason" TEXT,
    "blockedAt" TIMESTAMP(3),
    "blockedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_account_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_account_statuses_userId_key" ON "user_account_statuses"("userId");

-- CreateIndex
CREATE INDEX "user_account_statuses_status_idx" ON "user_account_statuses"("status");

-- AddForeignKey
ALTER TABLE "user_account_statuses" ADD CONSTRAINT "user_account_statuses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_account_statuses" ADD CONSTRAINT "user_account_statuses_blockedByUserId_fkey" FOREIGN KEY ("blockedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
