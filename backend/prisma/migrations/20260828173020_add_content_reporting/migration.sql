-- CreateEnum
CREATE TYPE "ReportTargetType" AS ENUM ('user_profile', 'post', 'comment');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('spam', 'harassment_or_bullying', 'hate_speech', 'nudity_or_sexual_content', 'violence_or_dangerous_content', 'misinformation', 'impersonation', 'self_harm_or_suicide', 'intellectual_property', 'other');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('pending', 'resolved', 'dismissed');

-- CreateEnum
CREATE TYPE "ReportAction" AS ENUM ('none', 'content_removed', 'user_blocked');

-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "removedAt" TIMESTAMP(3),
ADD COLUMN     "removedByUserId" TEXT,
ADD COLUMN     "removedReason" TEXT;

-- AlterTable
ALTER TABLE "comments" ADD COLUMN     "removedAt" TIMESTAMP(3),
ADD COLUMN     "removedByUserId" TEXT,
ADD COLUMN     "removedReason" TEXT;

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT,
    "reporterUsername" TEXT NOT NULL,
    "reportedUserId" TEXT NOT NULL,
    "targetType" "ReportTargetType" NOT NULL,
    "postId" TEXT,
    "commentId" TEXT,
    "targetSnapshot" JSONB,
    "reason" "ReportReason" NOT NULL,
    "details" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'pending',
    "action" "ReportAction" NOT NULL DEFAULT 'none',
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "resolutionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reports_status_createdAt_idx" ON "reports"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "reports_reportedUserId_status_idx" ON "reports"("reportedUserId", "status");

-- CreateIndex
CREATE INDEX "reports_reporterId_idx" ON "reports"("reporterId");

-- CreateIndex
CREATE INDEX "posts_removedAt_idx" ON "posts"("removedAt");

-- CreateIndex
CREATE INDEX "comments_removedAt_idx" ON "comments"("removedAt");

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_removedByUserId_fkey" FOREIGN KEY ("removedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_removedByUserId_fkey" FOREIGN KEY ("removedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

