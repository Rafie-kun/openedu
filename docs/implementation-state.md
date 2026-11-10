# Implementation state

A single concise working-state snapshot, meant to be read first and updated at the end of every milestone.
For the full phase-by-phase picture see `docs/status.md`; for the backlog order see `docs/roadmap.md`.

## M2 — admin editing complete (2026-11-10)

Added edit actions for all 11 catalogue record types: University, Programme, Scholarship,
ScholarshipProvider, and all 7 child types (AdmissionRequirement, LanguageRequirement, TuitionFee,
ProgrammeDeadline, ScholarshipEligibilityRule, ScholarshipFundingComponent, ScholarshipDeadline). Each
action: `requireAdmin()`s, validates with a new `*EditSchema` (reusing the create schema's field
validators), diffs old vs. new values, writes a `ChangeLog` row per changed field, resets
`verificationStatus` from `VERIFIED` back to `PENDING_REVIEW` and clears `lastCheckedAt` when any field
actually changed (a no-op edit returns "No changes." and touches nothing), refuses to edit an `ARCHIVED`
record, and audits the change. UI: inline `<details>`/`<summary>` edit forms next to every existing
Card/verification-button block in `/admin/catalogue` and `/admin/catalogue/[kind]/[id]`, including a new
"Universities" section on the catalogue index (previously had no list or edit path at all).

Verified for real against the live Postgres container (not just typechecked): simulated a prior
`VERIFIED` programme, edited its title through the same diff/update/ChangeLog logic the action uses,
confirmed `verificationStatus` reset to `PENDING_REVIEW`, `lastCheckedAt` cleared, exactly one `ChangeLog`
row written with correct old/new values, a second identical edit produces zero new changes, then restored
the pilot data to its original state. 6 new Vitest tests for the edit schemas (43/43 passing in
`@openedu/validation`). Full suite: 13/13 TS tasks.

Scope note: did not build a delete action anywhere (archive remains the only removal path, which matches
the rest of the catalogue's design) and did not add Playwright/browser click-through — verified at the
Prisma/DB logic level directly instead, since `requireAdmin()` needs a real request context a plain script
doesn't have.

## Somnia migration — Stage 1 complete (2026-11-08)

Built `workers/data-ingestion/src/openedu_ingest/sources/somnia.py`, a real `SourceAdapter` reusing the
existing ROR/OpenAlex ingestion pipeline. Ran it for real: dry-run against the live legacy GitHub file
(61/61, 0 rejected, matches the audit exactly), then twice against the real local Postgres container —
first run created 61 `SourceRecord` + `ReviewQueueItem` rows, second run confirmed idempotent (61
unchanged, 0 created). Cross-checked the 61 against OpenEdu's existing 16 universities: 9 already match by
name (MIT, Toronto, Oxford, NUS, Tokyo, Melbourne, Amsterdam, Dhaka, ETH Zurich), 52 are new leads. 6 new
Python tests. Full writeup in `docs/somnia-migration-audit.md`. Nothing was promoted to the public
`University` table — the 61 candidates sit in `/admin/review`, unreviewed. Also fixed the Somnia
Stage 0→1 git-attribution request: confirmed (again) no Claude/Anthropic trailers anywhere in history, git
config, `AGENTS.md`, `.opencode/`, or `CONTRIBUTING.md` — nothing needed changing, verified with a local
unpushed test commit that was reset before pushing.

## 2026-11-08 verification note

Docker/Postgres came up this session (previously unreachable for several sessions). Ran, against the real
`openedu-db-1` container: `prisma migrate deploy` (applied the hand-written
`20261107000000_scholarship_funding_evidence` migration cleanly), `pnpm db:seed` twice (identical counts
both times — confirmed idempotent, 16 universities / 3 programmes / 2 scholarships / their child rows), and
a real `evaluateProgrammeForProfile` call against a seeded programme, which returned a genuine evaluation
and wrote an actual `MatchResult` row. Everything reported as "typecheck/build-verified only" in prior
sessions (the pilot seed, the persistence code, the funding-evidence migration) is now confirmed to
actually work against a live database, not just compile. No seed/migration bugs found.

## Somnia migration — Stage 0 complete (2026-11-08)

Cloned `rafie-kun.scolarship-app` at `c6ab2311...` read-only to a temp directory (not added to this repo),
computed real statistics on its two catalogue JSON files, and read its schema/sync code directly. Full
findings in `docs/somnia-migration-audit.md`. Headline results: 253 university records but only 61 unique
identities (9 duplicate groups, largest being 30 near-identical "University of Oxford" rows with randomised
ranking/GPA/tuition); 100 scholarship records but only 7 distinct names, every numeric/eligibility field
confirmed templated-and-randomised (e.g. DAAD recorded as "Oceania"/GBP). Nothing was imported — Stage 0 is
audit only, per the task's own staging. Next stage (dry-run import pipeline for the 61 unique identity
leads) has not been started; needs explicit go-ahead given how large the full request is.

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
