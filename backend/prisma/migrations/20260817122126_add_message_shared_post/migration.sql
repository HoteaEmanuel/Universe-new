-- AlterTable
ALTER TABLE "group_messages" ADD COLUMN     "sharedPostId" TEXT;

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "sharedPostId" TEXT;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sharedPostId_fkey" FOREIGN KEY ("sharedPostId") REFERENCES "posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_messages" ADD CONSTRAINT "group_messages_sharedPostId_fkey" FOREIGN KEY ("sharedPostId") REFERENCES "posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
