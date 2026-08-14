-- AlterTable
ALTER TABLE "comments" ADD COLUMN     "parentId" TEXT,
ADD COLUMN     "repliesCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "comments_parentId_idx" ON "comments"("parentId");

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
