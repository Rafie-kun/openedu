# Implementation state

A single concise working-state snapshot, meant to be read first and updated at the end of every milestone.
For the full phase-by-phase picture see `docs/status.md`; for the backlog order see `docs/roadmap.md`.

## Current milestone

M2 — Privacy, legal and security foundations (cookie inventory, data-flow mapping, threat model, legal
pages reconciled with actual behaviour).

## Last completed milestone

M1 — Documentation and token-efficiency reorganisation: `AGENTS.md` trimmed to always-needed rules;
`docs/product-spec.md`, `docs/roadmap.md`, this file added.

## Last verified commit

`3686392` — "feat(admin): add sourced catalogue child-record editors" (`master`, pushed, CI green:
migrations, worker tests, typecheck, unit tests, build).

## Current blockers

- Docker Desktop's daemon is not running on this machine, so Postgres on 5432 is unreachable locally.
  Verification work this session is build/typecheck/test-level, not a live manual click-through.
- No real programme or scholarship data exists yet. The M0 editors can create records, but the catalogue
  and matching engine have nothing to compare against until M3 is explicitly approved and run.
- Pre-existing, not yet fixed: `adminVerificationSchema`'s `entityType` enum still lists `University` and
  `VisaCategory`, which `applyCatalogueVerification` has no case for — a call with either value currently
  no-ops rather than erroring. Low risk (safe failure), but dishonest; worth a small follow-up.

## Most important next task

Complete the M2 audit in `AGENTS.md`'s referenced instructions: cookie/storage inventory
(`docs/cookie-inventory.md`), processing-purpose mapping (`docs/data-flow.md`), threat model
(`docs/threat-model.md`), legal-review checklist (`docs/legal-review-checklist.md`), and reconciling
`apps/web/lib/legal.ts` plus `docs/privacy.md`/`docs/security.md` with what the code actually does.

## Last successful checks

`pnpm db:generate`, `pnpm format` / `format:check`, `pnpm turbo run typecheck` (6/6 workspaces),
`pnpm turbo run test` (matching 18, shared 9, validation 37, web 22 passed), `pnpm --filter @openedu/web
build`, `pnpm worker:test` (pytest, 53 passed). All green as of commit `3686392`.

## Relevant files for the active task (M2)

- `apps/web/lib/legal.ts`, `apps/web/app/legal/[slug]/page.tsx`
- `apps/web/lib/session.ts` (cookie behaviour), `apps/web/app/layout.tsx`
- `packages/database/prisma/schema.prisma` (`ConsentKind`, `ConsentRecord`)
- `apps/web/app/actions/auth.ts` (consent recording at registration)
- `docs/privacy.md`, `docs/security.md`, `docs/status.md`, `README.md`
