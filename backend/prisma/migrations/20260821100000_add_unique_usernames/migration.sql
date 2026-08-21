-- Stage 1: make room for existing rows. The column is nullable only while the
-- deterministic, ID-suffixed backfill runs.
ALTER TABLE "users" ADD COLUMN "username" TEXT;

-- Names are advisory input only. The UUID-derived suffix makes each generated
-- handle unique without exposing the user's email address.
UPDATE "users"
SET "username" = CONCAT(
  LEFT(
    CASE
      WHEN LENGTH(REGEXP_REPLACE(LOWER(COALESCE(NULLIF(CONCAT_WS('_', "firstName", "lastName"), ''), NULLIF("name", ''), 'user')), '[^a-z0-9]+', '_', 'g')) >= 3
        THEN TRIM(BOTH '_' FROM REGEXP_REPLACE(LOWER(COALESCE(NULLIF(CONCAT_WS('_', "firstName", "lastName"), ''), NULLIF("name", ''), 'user')), '[^a-z0-9]+', '_', 'g'))
      ELSE 'user'
    END,
    21
  ),
  '_',
  LEFT(REPLACE("id", '-', ''), 8)
);

-- Stage 2: all records now have a valid, unique canonical username.
ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL;
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
