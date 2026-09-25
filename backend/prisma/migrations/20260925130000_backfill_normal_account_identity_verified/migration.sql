-- Login now gates on identityVerified for every account type, not just
-- "business" (see auth.service.ts login()). Before this change, normal
-- accounts were only ever created with identityVerified = 'true' (email/
-- password signup) or left at the schema default 'false' without it
-- mattering (Google OAuth signup never set it, and login() never checked
-- it for normal accounts). Backfill existing normal accounts to 'true' so
-- this new gate doesn't retroactively lock out anyone who already passed
-- the old domain check at signup.
UPDATE "users" SET "identityVerified" = 'true' WHERE "accountType" = 'normal' AND "identityVerified" != 'true';
