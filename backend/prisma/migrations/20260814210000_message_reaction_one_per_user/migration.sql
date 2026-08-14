-- DropIndex
DROP INDEX "message_reactions_messageId_userId_emoji_key";

-- DropIndex
DROP INDEX "group_message_reactions_groupMessageId_userId_emoji_key";

-- CreateIndex
CREATE UNIQUE INDEX "message_reactions_messageId_userId_key" ON "message_reactions"("messageId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "group_message_reactions_groupMessageId_userId_key" ON "group_message_reactions"("groupMessageId", "userId");
