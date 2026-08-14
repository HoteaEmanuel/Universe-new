-- Normalize legacy pre-rename value ("like" -> "post-like")
UPDATE "notifications" SET "type" = 'post-like' WHERE "type" = 'like';

-- CreateIndex
CREATE INDEX "notifications_userId_read_createdAt_idx" ON "notifications"("userId", "read", "createdAt" DESC);
