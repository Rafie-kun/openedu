# Implementation state

A single concise working-state snapshot, meant to be read first and updated at the end of every milestone.
For the full phase-by-phase picture see `docs/status.md`; for the backlog order see `docs/roadmap.md`.

## Current milestone

Milestone 3 Part 2 — a real, sourced pilot of 3 programmes and 2 scholarships is seeded. Not the full
"all countries" scope originally floated; a deliberately small, genuinely verified start. Milestone 4
(persistent eligibility) is already complete from the prior session.

## Last completed milestone

Milestone 3 Part 2 — `packages/database/prisma/seed.ts` now seeds:

- Programmes: University of Łódź "Business Management" (undergraduate), UCSI University "Foundation in
  Arts" (foundation), Ravensbourne University London "BSc (Hons) Business Management with International
  Year One" (undergraduate) — each with real admission requirements, language requirements, tuition fees
  and deadlines, sourced from their live official pages.
- Scholarships: UoPeople Scholarships, Romania Ministry of Foreign Affairs non-EU scholarships (2026-2027)
  — each with real eligibility rules, funding components and deadlines.
- Every fact carries the exact official URL it was transcribed from (a separate AI tool did the live
  browsing/research since this session's own web tools couldn't reach static content; I only entered facts
  that tool reported finding on a live page, with its URL — nothing from memory). All rows start
  `PENDING_REVIEW`, not `VERIFIED`: collecting a fact is not the same as an admin re-checking it.
- 4 real universities added to the `UNIVERSITIES` seed array to host them (Łódź, UCSI, Ravensbourne,
  University of the People).

## Last verified commit

`b62534f` — "feat(matching): persist eligibility evaluations" (`master`). The seed data described here is
not yet committed.

## Current blockers

- Docker Desktop's daemon is still not running on this machine, so the new seed data has been typechecked
  and build-verified only — never actually run against a live Postgres database. A live `pnpm db:seed` run
  is the next real verification step once Docker is available.
- Growing this pilot further needs the same per-fact live-page verification used here; this session's own
  `websearch`/`firecrawl` tools could not reliably reach live page content (search returned nothing,
  firecrawl blocked this connection as a VPN/proxy). An external research pass (as used for this batch) or
  exact URLs from the user are the two ways to keep adding real records.
- Every item in `docs/legal-review-checklist.md`'s "Blocking" section remains open.
- Pre-existing, not yet fixed: `adminVerificationSchema`'s `entityType` enum still lists `University` and
  `VisaCategory`, which `applyCatalogueVerification` has no case for.
- Rate limiter trusts `X-Forwarded-For`/`X-Real-IP` with no trusted-proxy allowlist (`docs/threat-model.md`).

## Most important next task

Run `pnpm db:seed` against a live database once Docker is available, to confirm the new programme/
scholarship rows actually write and relate correctly (foreign keys, upserts, the funding-component unique
constraint). Then have an admin move the pilot rows from `PENDING_REVIEW` to `VERIFIED` through
`/admin/catalogue`, or correct anything that's since changed on the source pages.

## Last successful checks

`pnpm db:generate`, `pnpm format`, `pnpm turbo run typecheck` (6/6), `pnpm turbo run test build` (7/7, 86
tests). No live seed run or manual DB-backed click-through this session — Docker is down locally.

## Relevant files for the active task

- `packages/database/prisma/seed.ts` (`PROGRAMMES`, `SCHOLARSHIP_PROVIDERS`, `SCHOLARSHIPS` and their
  write loops in `main()`)
- `docs/data-sources.md`, `docs/status.md`
- For verifying/extending the pilot: `apps/web/app/admin/catalogue/page.tsx`,
  `apps/web/app/admin/catalogue/[kind]/[id]/page.tsx`
