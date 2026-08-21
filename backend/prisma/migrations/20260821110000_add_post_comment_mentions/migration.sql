-- CreateTable
CREATE TABLE "_CommentMentions" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_PostMentions" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_CommentMentions_AB_unique" ON "_CommentMentions"("A", "B");
CREATE INDEX "_CommentMentions_B_index" ON "_CommentMentions"("B");
CREATE UNIQUE INDEX "_PostMentions_AB_unique" ON "_PostMentions"("A", "B");
CREATE INDEX "_PostMentions_B_index" ON "_PostMentions"("B");

-- Add foreign keys
ALTER TABLE "_CommentMentions" ADD CONSTRAINT "_CommentMentions_A_fkey" FOREIGN KEY ("A") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_CommentMentions" ADD CONSTRAINT "_CommentMentions_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_PostMentions" ADD CONSTRAINT "_PostMentions_A_fkey" FOREIGN KEY ("A") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_PostMentions" ADD CONSTRAINT "_PostMentions_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notifications" ADD COLUMN "postId" TEXT;
ALTER TABLE "notifications" ADD COLUMN "commentId" TEXT;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
