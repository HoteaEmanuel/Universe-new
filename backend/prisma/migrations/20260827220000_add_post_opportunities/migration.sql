CREATE TYPE "PostType" AS ENUM ('standard', 'opportunity');
CREATE TYPE "OpportunityType" AS ENUM ('internship', 'part_time', 'full_time', 'graduate_program', 'volunteering', 'campus_ambassador');
CREATE TYPE "WorkplaceType" AS ENUM ('onsite', 'hybrid', 'remote');

ALTER TABLE "posts"
ADD COLUMN "type" "PostType" NOT NULL DEFAULT 'standard',
ADD COLUMN "opportunityType" "OpportunityType",
ADD COLUMN "workplaceType" "WorkplaceType",
ADD COLUMN "companyName" TEXT,
ADD COLUMN "applyUrl" TEXT,
ADD COLUMN "deadlineAt" TIMESTAMP(3),
ADD COLUMN "expiresAt" TIMESTAMP(3),
ADD COLUMN "opportunityClosedAt" TIMESTAMP(3);

CREATE INDEX "posts_type_createdAt_idx" ON "posts"("type", "createdAt" DESC);
CREATE INDEX "posts_type_opportunityType_workplaceType_idx" ON "posts"("type", "opportunityType", "workplaceType");
CREATE INDEX "posts_type_deadlineAt_idx" ON "posts"("type", "deadlineAt");
