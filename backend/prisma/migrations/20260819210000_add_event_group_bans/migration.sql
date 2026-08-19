-- CreateTable
CREATE TABLE "event_bans" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bannedByUserId" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_bans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_bans" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bannedByUserId" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_bans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_bans_userId_idx" ON "event_bans"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "event_bans_eventId_userId_key" ON "event_bans"("eventId", "userId");

-- CreateIndex
CREATE INDEX "group_bans_userId_idx" ON "group_bans"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "group_bans_groupId_userId_key" ON "group_bans"("groupId", "userId");

-- AddForeignKey
ALTER TABLE "event_bans" ADD CONSTRAINT "event_bans_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_bans" ADD CONSTRAINT "event_bans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_bans" ADD CONSTRAINT "event_bans_bannedByUserId_fkey" FOREIGN KEY ("bannedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_bans" ADD CONSTRAINT "group_bans_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_bans" ADD CONSTRAINT "group_bans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_bans" ADD CONSTRAINT "group_bans_bannedByUserId_fkey" FOREIGN KEY ("bannedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
