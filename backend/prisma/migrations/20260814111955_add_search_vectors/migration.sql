-- Enable trigram similarity functions, used as a typo-tolerant fallback
-- alongside full-text search below.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Users: name fields outrank university/major, which outrank bio.
ALTER TABLE "users" ADD COLUMN "searchVector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce("name", '') || ' ' || coalesce("firstName", '') || ' ' || coalesce("lastName", '')), 'A') ||
    setweight(to_tsvector('simple', coalesce("university", '')), 'B') ||
    setweight(to_tsvector('simple', coalesce("major", '') || ' ' || coalesce("bio", '')), 'C')
  ) STORED;

CREATE INDEX "users_search_vector_idx" ON "users" USING GIN ("searchVector");
CREATE INDEX "users_name_trgm_idx" ON "users" USING GIN ("name" gin_trgm_ops);

-- Posts: title outranks body, which outranks location.
ALTER TABLE "posts" ADD COLUMN "searchVector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce("title", '')), 'A') ||
    setweight(to_tsvector('simple', coalesce("body", '')), 'B') ||
    setweight(to_tsvector('simple', coalesce("location", '')), 'C')
  ) STORED;

CREATE INDEX "posts_search_vector_idx" ON "posts" USING GIN ("searchVector");
CREATE INDEX "posts_title_trgm_idx" ON "posts" USING GIN ("title" gin_trgm_ops);

-- Groups: name outranks description.
ALTER TABLE "groups" ADD COLUMN "searchVector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce("name", '')), 'A') ||
    setweight(to_tsvector('simple', coalesce("description", '')), 'B')
  ) STORED;

CREATE INDEX "groups_search_vector_idx" ON "groups" USING GIN ("searchVector");
CREATE INDEX "groups_name_trgm_idx" ON "groups" USING GIN ("name" gin_trgm_ops);
