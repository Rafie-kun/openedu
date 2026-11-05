# Implementation state

A single concise working-state snapshot, meant to be read first and updated at the end of every milestone.
For the full phase-by-phase picture see `docs/status.md`; for the backlog order see `docs/roadmap.md`.

## Current milestone

M2 complete, pending commit/push and the user's go-ahead for M3 (real catalogue pilot — needs explicit
permission per `docs/roadmap.md` before any data entry starts).

## Last completed milestone

M2 — Privacy, legal and security foundations: `docs/cookie-inventory.md`, `docs/data-flow.md`,
`docs/threat-model.md`, `docs/legal-review-checklist.md` added; the one factual inaccuracy found (the
cookie notice claiming "30 days of inactivity" when the code fixes expiry at creation) fixed in
`apps/web/lib/legal.ts`; `docs/privacy.md` and `docs/security.md` cross-referenced to the new docs. No
other inaccuracy found in the existing legal pages or `docs/privacy.md`/`docs/security.md` — they were
already honest about gaps (operator identity, AI consent, minors, backups) rather than claiming
compliance.

## Last verified commit

`6bf47b6` — "docs: split product spec out of AGENTS.md for token efficiency" (`master`, pushed). The M2
commit described below is not yet made.

## Current blockers

- Docker Desktop's daemon is not running on this machine, so Postgres on 5432 is unreachable locally.
  Verification work this session is build/typecheck/test-level, not a live manual click-through.
- No real programme or scholarship data exists yet. M3 needs explicit go-ahead before it starts, per the
  user's last instruction ("ask for permission for 3").
- Every item in `docs/legal-review-checklist.md`'s "Blocking" section remains open — none can be resolved
  by writing code; they need a qualified reviewer and operator-specific facts (legal entity, jurisdiction).
- Pre-existing, not yet fixed: `adminVerificationSchema`'s `entityType` enum still lists `University` and
  `VisaCategory`, which `applyCatalogueVerification` has no case for — a call with either value currently
  no-ops rather than erroring. Low risk (safe failure), but dishonest; worth a small follow-up.
- Real gap found in `docs/threat-model.md` this pass, not yet fixed: the rate limiter trusts
  `X-Forwarded-For`/`X-Real-IP` with no trusted-proxy allowlist (`apps/web/lib/rate-limit.ts`) — already
  listed as a known gap in `docs/security.md`, now with the attack explained.

## Most important next task

Ask the user for permission before starting M3 (real catalogue pilot). Until then, the next unprompted
unit of work is small and low-risk: fixing the `adminVerificationSchema`/`applyCatalogueVerification`
mismatch noted above.

## Last successful checks

`pnpm format` / `format:check`, `pnpm turbo run typecheck test` (12/12 tasks) after the M2 documentation
and `legal.ts` text change — no schema or business logic touched this pass, so build and worker tests were
not re-run (no code change to justify it, per the token-discipline rule).

## Relevant files for the active task (M3, once approved)

- `packages/database/prisma/seed.ts`, `packages/database/prisma/seed-data/` (new)
- `.opencode/agents/data-source-researcher.md`
- `docs/data-sources.md`, `docs/status.md`
- `apps/web/app/admin/catalogue/page.tsx`, `apps/web/app/admin/catalogue/[kind]/[id]/page.tsx`
