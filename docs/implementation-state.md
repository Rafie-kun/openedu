# Implementation state

A single concise working-state snapshot, meant to be read first and updated at the end of every milestone.
For the full phase-by-phase picture see `docs/status.md`; for the backlog order see `docs/roadmap.md`.

## Current milestone

M3, Part 1 of 3 (country reference data) complete, pending commit/push. Parts 2 (real institution pilot)
and 3 (source documentation) each need separate explicit go-ahead before starting, per the user's
instruction to split M3 into three confirmed parts.

## Last completed milestone

M3 Part 1 — `packages/database/prisma/seed.ts`'s `COUNTRIES` array expanded from 72 to all 198 ISO 3166-1
countries (codes, name, region only — no education-system or visa-route claim attached to any entry, since
that would require per-country sourcing that belongs in Part 2/3, not bulk reference data).

## Last verified commit

`09e1652` — "docs: update implementation-state with M2 commit" (`master`). The Part 1 commit described
here is not yet made.

## Current blockers

- Docker Desktop's daemon is not running on this machine, so Postgres on 5432 is unreachable locally. The
  expanded `COUNTRIES` array has not been run against a live database this session — only typechecked and
  checked programmatically for duplicate ISO codes (198 rows, zero duplicates).
- M3 Part 2 (real institution/programme/scholarship pilot) needs the user's explicit go-ahead and, ideally,
  their steer on which handful of countries/institutions to prioritise for low-grade-friendly entry routes.
- Every item in `docs/legal-review-checklist.md`'s "Blocking" section remains open.
- Pre-existing, not yet fixed: `adminVerificationSchema`'s `entityType` enum still lists `University` and
  `VisaCategory`, which `applyCatalogueVerification` has no case for.
- Rate limiter trusts `X-Forwarded-For`/`X-Real-IP` with no trusted-proxy allowlist (`docs/threat-model.md`).

## Most important next task

Present the requested list — countries plus a handful of real institutions known for low/standard-grade
entry routes for international students — and get the user's go-ahead for M3 Part 2 before entering any
programme or scholarship data.

## Last successful checks

`pnpm format` / `format:check`, `pnpm turbo run typecheck test` (12/12 tasks) after the `COUNTRIES` change.
No live seed run (`pnpm db:seed`) against Postgres this session — Docker is down locally.

## Relevant files for the active task (M3 Part 2, once approved)

- `apps/web/app/admin/catalogue/page.tsx`, `apps/web/app/admin/catalogue/[kind]/[id]/page.tsx`
- `apps/web/app/actions/admin.ts` (`promoteCandidateAction`, `createProgrammeAction`, `createScholarshipAction`)
- `docs/data-sources.md`, `docs/status.md`
