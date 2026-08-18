-- AlterTable
ALTER TABLE "groups" ADD COLUMN "university" TEXT,
ADD COLUMN "courseTag" TEXT;

-- CreateIndex
CREATE INDEX "groups_university_courseTag_idx" ON "groups"("university", "courseTag");
