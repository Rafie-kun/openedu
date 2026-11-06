# Implementation state

A single concise working-state snapshot, meant to be read first and updated at the end of every milestone.
For the full phase-by-phase picture see `docs/status.md`; for the backlog order see `docs/roadmap.md`.

## Current milestone

Milestone 4 (persistent eligibility) complete. Milestone 3 Part 2 (real institution/programme/scholarship
pilot) was scoped down this session: live per-fact verification of specific programme/scholarship data from
official pages was not completed (see below), so no programme or scholarship row was entered. Part 3 (source
documentation) is covered by the existing `docs/data-sources.md`, which already states accurately that no
programme/scholarship is seeded — no change was needed there this session.

## Last completed milestone

Milestone 4 — `apps/web/lib/eligibility.ts` now persists every evaluation: a `MatchResult` row (outcome,
`engineVersion`, `dataCompleteness`, summary) plus one `MatchRequirementResult` per requirement, written in
a transaction after the live computation. `latestMatchResult` reads the most recent row for a profile/target
pair. See `docs/matching-engine.md` "Persistence" for exactly what is and is not covered (it is a history,
not a cache or a staleness check).

## Last verified commit

`4a60f3e` — "fix(auth): hyperlink terms and privacy notice in the register form" (`master`). The persistence
work described here is not yet committed.

## Current blockers

- Milestone 3 Part 2 is still blocked on the same constraint as before: entering a real programme or
  scholarship requires per-fact verification against a live official page (exact requirement wording, fee,
  deadline). Attempted this session for DAAD's scholarship database; its page is a JS-rendered search UI
  with no fetchable static facts, so nothing was entered rather than guessing at numbers.
- Docker Desktop's daemon is not running on this machine, so Postgres on 5432 is unreachable locally. The
  new `MatchResult`/`MatchRequirementResult` writes are typechecked and build-tested but not run against a
  live database this session.
- Every item in `docs/legal-review-checklist.md`'s "Blocking" section remains open.
- Pre-existing, not yet fixed: `adminVerificationSchema`'s `entityType` enum still lists `University` and
  `VisaCategory`, which `applyCatalogueVerification` has no case for.
- Rate limiter trusts `X-Forwarded-For`/`X-Real-IP` with no trusted-proxy allowlist (`docs/threat-model.md`).

## Most important next task

Milestone 3 Part 2 needs a different approach than "enter data from memory": either the user supplies
specific official pages with known-current facts to transcribe, or a live-browser/fetch pass is run per
institution before any row is entered. Until then, the honest state is a country directory with no
programme or scholarship data to match against.

## Last successful checks

`pnpm db:generate`, `pnpm turbo run typecheck` (6/6), `pnpm turbo run test build` (7/7, 86 tests). No live
seed run or manual DB-backed click-through this session — Docker is down locally.

## Relevant files for the active task

- `apps/web/lib/eligibility.ts`, `packages/database/prisma/schema.prisma` (`MatchResult`,
  `MatchRequirementResult`, `MatchingRuleVersion`)
- `docs/matching-engine.md`, `docs/database.md`, `docs/status.md`
- For M3 Part 2 when resumed: `apps/web/app/admin/catalogue/[kind]/[id]/page.tsx`,
  `apps/web/app/actions/admin.ts`, `docs/data-sources.md`
