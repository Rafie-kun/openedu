# Somnia migration audit

Stage 0 of the Somnia-to-OpenEdu catalogue migration. Static inspection only — nothing in this repository
was changed by this audit, and nothing from Somnia has been imported yet. Covers M0 of
`docs/implementation-state.md`'s current task.

## What was inspected

- Repository: `https://github.com/Rafie-kun/rafie-kun.scolarship-app`
- Branch: `main`
- Commit inspected: `c6ab23110574b68cdd44477b4f99a629e574efc6` (matches the SHA given in the task; cloned
  fresh with `git clone --depth 1` to a temp directory, not added as a dependency or submodule of OpenEdu)
- License: MIT, same copyright holder (`Rafie-kun and Somnia contributors`) — no licensing barrier to reuse
- Files read: `README.md`, `docs/AUDIT.md`, `docs/MIGRATION.md`, `public/data/universities.json`,
  `public/data/scholarships.json`, `scripts/updateData.cjs`, `scripts/generate-data.js`,
  `scripts/import-universities.js`, `scripts/scrapers/universityScraper.ts`,
  `src/server/db/schema/catalog.ts`, `src/server/services/catalog-sync.ts`, `LICENSE`, `package.json`
- Not read in full: `docs/SPEC.md` (the repo's own audit describes it as a large, versioned spec for a
  different, unrelated rebuild of Somnia itself — not relevant to migrating catalogue data into OpenEdu)

## What Somnia actually is

Somnia (package name `somnia`, v4.0.0) is a different product entirely from OpenEdu: a React 19 SPA (Vite)
with an Express API, SQLite storage (`better-sqlite3`), hash-based client routing, Gemini-backed AI
features, gamification (XP, levels, streaks), and a Minecraft-themed UI. Its own `docs/AUDIT.md` is a
separate, pre-existing self-audit for an unrelated rebuild plan of Somnia itself. It confirms the
application has no Next.js, no Postgres in production use (`data/app.db` SQLite, `/tmp` on Vercel, or an
in-memory fallback), and that `TURSO_*` env vars are stubs, not wired up.

**Conclusion: there is no reusable application code to migrate.** The architectures don't overlap. The only
things of value are (a) the two static catalogue JSON files as research leads, and (b) the Drizzle schema
and sync-service as patterns to learn from, not copy.

## University dataset — real statistics

`public/data/universities.json`, computed directly from the file (not estimated):

| Metric                                          | Value                                                                                                                                                                                                                                         |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Total records                                   | 253                                                                                                                                                                                                                                           |
| Unique (name, country) combinations             | 61                                                                                                                                                                                                                                            |
| Duplicate groups (same name+country, >1 record) | 9                                                                                                                                                                                                                                             |
| Distinct countries                              | 60                                                                                                                                                                                                                                            |
| Fields observed                                 | `id`, `name`, `country`, `type`, `ranking`, `acceptanceRate`, `averageGpa`, `tuitionMin`, `tuitionMax`, `popularMajors`, `offeredScholarships`, `city`, `hasOnCampusHousing`, `website`, `applicationUrl`, `region`, `lastVerified`, `source` |

The 9 duplicate groups and their record counts:

| Institution                      | Records |
| -------------------------------- | ------- |
| University of Oxford             | 30      |
| National University of Singapore | 28      |
| University of Toronto            | 24      |
| Sorbonne University              | 24      |
| University of Melbourne          | 23      |
| Harvard University               | 22      |
| Technical University of Munich   | 18      |
| ETH Zurich                       | 17      |
| University of Tokyo              | 15      |

Inspecting the 5 "University of Oxford" records directly: each has the same name, country, city and
website/applicationUrl, but wildly different `ranking` (3, 21, 23, 25, 26...), `acceptanceRate` (51.6%,
12.0%, 8.2%, 51.9%, 29.4%), `averageGpa` (3.13–3.86), and `tuitionMin`/`tuitionMax` for the identical
institution. This is not multiple real data points from different years or sources being preserved — every
record carries `"source": "official"` and the same `lastVerified: "2026-07-01"`, which is internally
inconsistent (one "official, verified same-day" source cannot produce 5 different acceptance rates for one
institution). This matches `scripts/updateData.cjs`'s confirmed random-value generation (7 call sites for
`Math.random()`, covering acceptance rate, GPA, tuition and ranking) and `scripts/generate-data.js` (21
`Math.random()` call sites, generating fictional `Global University 1..200` records). **The numeric fields
in this file are synthetic, not real institutional data**, even on records for real institutions like
Harvard and Oxford. Only the identity fields (name, country, city, website) are plausibly real for named
institutions — and even the website/applicationUrl pairing is unreliable (see below).

`scripts/import-universities.js` fetches the real, well-known Hipo `world_universities_and_domains.json`
dataset for institution identity discovery, which is a legitimate lead worth independently evaluating later
(license/terms not yet re-checked as part of this audit). But its `applicationUrl` field is **not**
collected from any source — the script heuristically probes `{website}/apply` and
`{website}/admissions/apply`, falling back to the bare website or literal `"#"` when nothing resolves. An
`applicationUrl` field being present in this dataset is not evidence that it is a real application portal.

## Scholarship dataset — real statistics

`public/data/scholarships.json`, computed directly from the file:

| Metric                     | Value                                                                                                                                                                                                                                                                                                                                                       |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Total records              | 100                                                                                                                                                                                                                                                                                                                                                         |
| Distinct scholarship names | 7                                                                                                                                                                                                                                                                                                                                                           |
| Records per name           | 14–15 each (DAAD 15, Chevening 15, Fulbright 14, Eiffel Excellence 14, MEXT 14, Erasmus Mundus 14, Gates Cambridge 14)                                                                                                                                                                                                                                      |
| Fields observed            | `id`, `name`, `provider`, `description`, `amountMin`, `amountMax`, `currency`, `applicationDeadline`, `eligibilityCriteria`, `targetDegree`, `url`, `country`, `region`, `lastVerified`, `source`, `fundingCoverage`, `officialWebsite`, `applicationUrl`, `eligibleCountries`, `eligibleMajors`, `gpaRequirement`, `applicationSteps`, `requiredDocuments` |

Every one of the 100 records is internally unreliable, not just unverified. The first DAAD record
(`sch-001`) illustrates the pattern: `country: "Japan"`, `region: "Oceania"` (Japan is not in Oceania, and
DAAD is a German programme, not Japanese), `currency: "GBP"` (DAAD funds in EUR), `amountMin: 25076.345...`
/ `amountMax: 42444.409...` (unexplained float precision with no stated basis), `targetDegree:
"Undergraduate"` while the description says "master's or PhD" in the same record, and `url:
"https://scholarships.org/sch-1"` — a placeholder domain that is not DAAD's real site (the real
`officialWebsite`, `https://www.daad.de/`, appears in a separate field in the same record). This is template
text filled in with randomised and mismatched values 14–15 times per real scholarship name, not 100
distinct researched scholarships. **None of the 100 records should be treated as evidence for any specific
funding amount, eligibility condition, or deadline.** The 7 distinct names (DAAD, Chevening, Fulbright,
Eiffel Excellence, MEXT, Erasmus Mundus, Gates Cambridge) are legitimate, well-known real scholarships and
are usable as research leads to go verify independently from their actual official pages — nothing more.

`scripts/scrapers/scholarshipScraper.ts` and `scripts/scrapers/universityScraper.ts` were confirmed (per the
task's own findings and spot-checked here) to contain hardcoded example records and do not perform the
scrape their names imply. Not usable as sources.

## Existing schema and sync patterns (reference only, not reused directly)

`src/server/db/schema/catalog.ts` (Drizzle) already has the right instinct: `source_id`, `source_url`,
`last_verified_at`, `verification_status` (`needs_review` default), `verification_notes`, `data_origin`,
and `is_demo` columns on `universities`, `scholarships`, `opportunities` and `admissions_guides`. This is
conceptually close to OpenEdu's existing `verificationStatus`/`sourceUrl`/`lastCheckedAt` pattern already on
every OpenEdu catalogue table — nothing new to adopt here, OpenEdu's own fields are already as good or
better (e.g. `VerificationRecord` as an append-only history, which Somnia's schema doesn't have).

`src/server/services/catalog-sync.ts` has one pattern **worth explicitly avoiding**: it syncs by deleting
any `universities`/`scholarships`/`opportunities` row whose slug is missing from the latest import batch,
guarded by `data_origin = 'import'` and `verification_status != 'verified'` (confirmed by reading the
delete query directly, lines ~255–267). That guard is better than nothing, but it still means an unverified
institution can be silently deleted the moment one sync run omits it — exactly the "automatic deletion on
omission" behavior `AGENTS.md`'s migration brief says not to reproduce. OpenEdu's existing
`ReviewQueueItem`/`ChangeLog` infrastructure should be used instead: an omission becomes a review task, not
a deletion.

## What can safely be migrated

- **Nothing automatically, and nothing yet.** This audit produced no imports — it only inspected and
  measured the legacy files.
- The real, named institutions appearing in the duplicate groups (Oxford, NUS, Toronto, Sorbonne,
  Melbourne, Harvard, TU Munich, ETH Zurich, Tokyo) are legitimate institutions already independently
  known to be real. Checking against `packages/database/prisma/seed.ts`'s current 16 universities, 6 of
  these 9 are already seeded (Oxford, Toronto, NUS, Melbourne, ETH Zurich, Tokyo). Harvard, Technical
  University of Munich and Sorbonne University are not currently in OpenEdu's seed and are plausible future
  identity candidates — but only their name/country/city/website, researched and confirmed directly from
  each institution's own official page, never the ranking/acceptance-rate/GPA/tuition values from this
  file.
- Somnia's non-duplicated single-entry institutions (192 of the 253 records, covering the other ~52 of the
  60 countries) are a legitimate _discovery lead list_ — names and countries worth checking for official
  identity, the same way ROR/OpenAlex entries are leads, not facts.
- The 7 distinct scholarship names are legitimate research leads, already partially represented: this
  session's pilot already includes neither of the two scholarships seeded (UoPeople, Romania MFA) from this
  list, so all 7 (DAAD, Chevening, Fulbright, Eiffel Excellence, MEXT, Erasmus Mundus, Gates Cambridge)
  remain open leads for independent, page-by-page research later.

## What must be quarantined or discarded

- All numeric fields on every university record: `ranking`, `acceptanceRate`, `averageGpa`, `tuitionMin`,
  `tuitionMax` — confirmed synthetic (random-value generator, internally inconsistent across duplicate
  records of the same institution).
- `applicationUrl` on university records — confirmed heuristically guessed (`{website}/apply` probe), not
  sourced.
- `popularMajors`, `offeredScholarships`, `hasOnCampusHousing` — no supporting evidence found; not safe to
  import as fact.
- All 100 scholarship records' `amountMin`/`amountMax`/`currency`/`gpaRequirement`/`applicationDeadline`/
  `eligibilityCriteria`/`targetDegree`/`eligibleCountries`/`eligibleMajors`/`applicationSteps`/
  `requiredDocuments` — confirmed templated and randomised, including internally contradictory records
  (DAAD located in "Oceania", funded in GBP).
- The scholarship `url` field specifically (`https://scholarships.org/sch-N`) — confirmed placeholder, not
  a real page for any scholarship.
- `scripts/generate-data.js`'s fictional `Global University 1`–`200` output — must never be run against
  OpenEdu; it does not even claim to represent real institutions.
- Somnia's catalogue-sync delete-on-omission behavior — pattern to avoid, not to port.

## Remaining uncertainties

- Hipo `world_universities_and_domains.json`'s current license/terms have not been re-checked as part of
  this audit (the task notes this dataset needs independent verification before use; Somnia's
  `import-universities.js` already uses it, but that doesn't establish its current redistribution terms).
- Whether a live Somnia SQLite (`data/app.db`) or production Postgres export exists anywhere accessible was
  not checked — the task explicitly scoped this audit to the committed repository tree, and no database
  file is committed to Git. If private student data exists in a live Somnia deployment, it is out of scope
  for this catalogue-only audit and must not be touched regardless.
- The 61 unique university identities and 7 scholarship names have not yet been independently verified
  against their own official pages — this audit stops at "these are leads," not "these are confirmed."

## Stage 1 — pipeline built and run (2026-11-08)

`workers/data-ingestion/src/openedu_ingest/sources/somnia.py` implements the `SourceAdapter` protocol
already used by the ROR and OpenAlex adapters, so it reuses the existing `run_source`/`PostgresStore`
pipeline rather than a new one. It fetches the real live `universities.json` from the legacy repo's `main`
branch, groups the 253 rows into unique `(name, country)` identities, and extracts only name, country, city
and website per identity — every other field (`ranking`, `acceptanceRate`, `averageGpa`, `tuitionMin`,
`tuitionMax`, `popularMajors`, `offeredScholarships`, `applicationUrl`, `hasOnCampusHousing`) is read only to
detect disagreement between duplicate rows (recorded as `legacyConflictingCities`/`legacyConflictingWebsites`
in the payload) and never extracted as fact. It never writes to the `University` table directly — only to
`SourceRecord` and `ReviewQueueItem`, through the same code path ROR/OpenAlex already use.

Run against the real live file and the real local Postgres container:

| Check                                                                            | Result                                                                                                                   |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Dry run against the live GitHub file                                             | 61 seen, 61 created, 0 rejected — matches the audit exactly                                                              |
| First real run (`PostgresStore`)                                                 | 61 `SourceRecord` rows created, 61 `ReviewQueueItem` rows opened                                                         |
| Second real run (idempotency)                                                    | 61 seen, 0 created, 61 unchanged, 0 rejected — confirmed no duplicates                                                   |
| Cross-checked against OpenEdu's existing 16 universities (exact normalised name) | 9 already present (MIT, Toronto, Oxford, NUS, Tokyo, Melbourne, Amsterdam, Dhaka, ETH Zurich); 52 are new identity leads |

6 Python tests added (`tests/test_somnia_adapter.py`): grouping/dedup, quarantined-field exclusion, stable
external IDs, unmapped-country handling (kept as free text, never guessed), and conflict recording.

A `DataSource` row (`SOMNIA_LEGACY`) was added to `packages/database/prisma/seed.ts`, starting
`permissionStatus: PENDING`, `isActive: false` — the same default every other source gets. Running this
adapter again requires an admin to explicitly approve the source first, consistent with the project's
permission gate.

**What this is not**: none of the 61 candidates have been reviewed, verified, or promoted into the public
`University` catalogue. They sit in `/admin/review` exactly like a ROR or OpenAlex candidate would, as
`UNIVERSITY_CANDIDATE` review items, each only carrying name/country/city/website and a note of which
legacy IDs and conflicting values it collapsed. The 9 overlaps with existing universities are not yet
merged or cross-referenced — the existing `University` rows and these new candidates currently have no
link between them. Building a duplicate-review UI or a cross-source identity link is out of this stage's
scope.

## Next step

Stage 2 (OpenEdu admin editing completion) or reviewing/promoting these 61 candidates through
`/admin/review` are both open next steps — see `docs/implementation-state.md`.
