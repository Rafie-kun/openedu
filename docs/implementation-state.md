# Implementation state

A single concise working-state snapshot, meant to be read first and updated at the end of every milestone.
For the full phase-by-phase picture see `docs/status.md`; for the backlog order see `docs/roadmap.md`.

## 2026-11-08 verification note

Docker/Postgres came up this session (previously unreachable for several sessions). Ran, against the real
`openedu-db-1` container: `prisma migrate deploy` (applied the hand-written
`20261107000000_scholarship_funding_evidence` migration cleanly), `pnpm db:seed` twice (identical counts
both times — confirmed idempotent, 16 universities / 3 programmes / 2 scholarships / their child rows), and
a real `evaluateProgrammeForProfile` call against a seeded programme, which returned a genuine evaluation
and wrote an actual `MatchResult` row. Everything reported as "typecheck/build-verified only" in prior
sessions (the pilot seed, the persistence code, the funding-evidence migration) is now confirmed to
actually work against a live database, not just compile. No seed/migration bugs found.

## Current milestone

M0–M2 of the catalogue-expansion plan, scoped down to what's actually doable in one session rather than the
full M0–M11 programme requested. M0 (reconcile) confirmed accurate. M1 done for its one explicitly-flagged
gap (`ScholarshipFundingComponent` evidence). M2 done for its one explicitly-flagged gap (the funding
component correction/verification path) — not the full edit/correction UI across all seven child types and
universities/programmes/scholarships, which remains undone. M3 (structured import system), M4 (research
agent rework) and M5 (catalogue growth beyond the 5-record pilot) were not started this session.

## Last completed milestone

- **M1 (partial)**: `ScholarshipFundingComponent` gained `sourceUrl`, `verificationStatus`, `lastCheckedAt`,
  `createdAt` (migration `20261107000000_scholarship_funding_evidence`), matching every other child record
  type. Wired through `scholarshipFundingComponentSchema`, `createScholarshipFundingComponentAction`, the
  admin form, and the public scholarship page (archived components now drop from public view, same as
  other child rows). The 2 seeded scholarships' funding components got real `sourceUrl` values from the
  same pages their descriptions were transcribed from.
- **M2 (partial)**: `ScholarshipFundingComponent` added to `applyCatalogueVerification`'s allowlist and to
  the admin UI's verification buttons — it previously had no correction/verification path at all. While
  touching that allowlist, removed `University`/`VisaCategory` from `adminVerificationSchema`'s enum, which
  had no matching case in `applyCatalogueVerification` (a gap flagged in an earlier session, now fixed).
- Universal edit/correction UI for universities, programmes, scholarships, and the other six child types is
  still just create + verify + archive — no "edit the label/amount/date after creation" flow exists yet.
  That's the bulk of M2 still undone.

## Last verified commit

`35490f9` — "feat(catalogue): seed a real sourced programme and scholarship pilot" (`master`). The work
described here is not yet committed.

## Current blockers

- Resolved 2026-11-08: Docker is now running and the migration/seed/persistence code is confirmed against
  a real database (see the verification note above). No drift found between the hand-written migration and
  the schema.
- M3 (structured JSON catalogue import format), M4 (research-agent rework), M5 (catalogue growth target of
  ~20 universities/30 programmes/15 scholarships) are entirely unstarted — this session's scope was capped
  at M0–M2 by explicit instruction.
- A separate, much larger request (global university directory via ROR/OpenAlex bulk ingestion, legacy
  Somnia repository migration, official-page monitoring, Redis scheduling) is pending user direction on
  scope — it is a multi-week programme, not completable in one session. Nothing from it has been started.
- Every item in `docs/legal-review-checklist.md`'s "Blocking" section remains open.
- Rate limiter trusts `X-Forwarded-For`/`X-Real-IP` with no trusted-proxy allowlist (`docs/threat-model.md`).

## Most important next task

Get this migration run against a real database once Docker/Postgres is available, to confirm the hand-written
SQL actually matches what `prisma migrate dev` would generate from the schema. After that, M2's remaining
scope (a real edit/correction UI, not just create+verify+archive) is the next piece of the catalogue-expansion
plan, if that's still the priority — otherwise M3's import format is what unblocks growing the pilot without
hand-editing `seed.ts`.

## Last successful checks

`pnpm db:generate`, `pnpm format`, `pnpm turbo run typecheck` (6/6), `pnpm turbo run test build` (7/7, 86
tests). No live migration run or seed run against Postgres this session.

## Relevant files for the active task

- `packages/database/prisma/schema.prisma`, `packages/database/prisma/migrations/20261107000000_scholarship_funding_evidence/`
- `packages/validation/src/index.ts` (`scholarshipFundingComponentSchema`, `adminVerificationSchema`)
- `apps/web/app/actions/admin.ts` (`createScholarshipFundingComponentAction`, `applyCatalogueVerification`)
- `apps/web/components/catalogue-child-forms.tsx` (`ScholarshipFundingForm`)
- `apps/web/app/admin/catalogue/[kind]/[id]/page.tsx`, `apps/web/app/scholarships/[slug]/page.tsx`
