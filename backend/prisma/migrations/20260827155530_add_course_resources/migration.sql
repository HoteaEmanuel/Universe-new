-- CreateEnum
CREATE TYPE "ResourceCategory" AS ENUM ('lecture_notes', 'assignment', 'exam_prep', 'link', 'recording', 'other');

-- CreateTable
CREATE TABLE "course_resources" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "uploaderId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "ResourceCategory" NOT NULL,
    "week" TEXT,
    "linkUrl" TEXT,
    "fileUrl" TEXT,
    "fileKey" TEXT,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_helpful_votes" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resource_helpful_votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "course_resources_groupId_pinned_createdAt_idx" ON "course_resources"("groupId", "pinned", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "course_resources_groupId_category_idx" ON "course_resources"("groupId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "resource_helpful_votes_resourceId_userId_key" ON "resource_helpful_votes"("resourceId", "userId");

-- AddForeignKey
ALTER TABLE "course_resources" ADD CONSTRAINT "course_resources_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_resources" ADD CONSTRAINT "course_resources_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_helpful_votes" ADD CONSTRAINT "resource_helpful_votes_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "course_resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_helpful_votes" ADD CONSTRAINT "resource_helpful_votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

