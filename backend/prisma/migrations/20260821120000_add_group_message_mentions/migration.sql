-- CreateTable
CREATE TABLE "_GroupMessageMentions" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_GroupMessageMentions_AB_unique" ON "_GroupMessageMentions"("A", "B");
CREATE INDEX "_GroupMessageMentions_B_index" ON "_GroupMessageMentions"("B");

-- AddForeignKey
ALTER TABLE "_GroupMessageMentions" ADD CONSTRAINT "_GroupMessageMentions_A_fkey" FOREIGN KEY ("A") REFERENCES "group_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_GroupMessageMentions" ADD CONSTRAINT "_GroupMessageMentions_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
