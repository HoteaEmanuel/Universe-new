-- Null now means "no explicit choice" so clients can fall back to the OS
-- theme instead of every new user being forced onto the old 'light' default.
-- Existing rows keep whatever value they already have (including 'light',
-- which may or may not have been an explicit choice - that ambiguity can't
-- be resolved retroactively, so we leave existing data untouched).
ALTER TABLE "user_preferences" ALTER COLUMN "theme" DROP NOT NULL;
ALTER TABLE "user_preferences" ALTER COLUMN "theme" DROP DEFAULT;
