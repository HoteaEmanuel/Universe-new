-- AlterTable
ALTER TABLE "conversations" ADD COLUMN "lastReadAtParticipantOne" TIMESTAMP(3),
ADD COLUMN "lastReadAtParticipantTwo" TIMESTAMP(3);
