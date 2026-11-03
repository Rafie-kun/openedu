-- Full-text search over institution names. The expression has to match the one in
-- apps/web/lib/search.ts exactly or Postgres will not use the index.
CREATE INDEX "University_search_idx" ON "University" USING GIN (
  to_tsvector(
    'simple',
    coalesce(name, '') || ' ' || coalesce("officialName", '') || ' ' || coalesce(city, '')
  )
);
