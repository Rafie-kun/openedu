# Architecture

What is in the repository today, and why it is arranged this way. Requirements come from `AGENTS.md`;
this file records the decisions that the code actually reflects.

## Repository layout

| Path                     | Purpose                                                                                    |
| ------------------------ | ------------------------------------------------------------------------------------------ |
| `apps/web`               | The only application. Next.js App Router pages, server actions, two route handlers.        |
| `packages/database`      | Prisma schema, migrations, seed script, and the generated client re-exported as `db`.      |
| `packages/matching`      | Pure TypeScript eligibility engine and its unit tests. No database, no React, no Next.     |
| `packages/shared`        | Labels, formatting helpers, profile completeness, `safeInternalPath`.                      |
| `packages/ui`            | Presentational primitives (`Card`, `Badge`, `Window`, `EmptyState`) and provenance blocks. |
| `packages/validation`    | Zod schemas shared by server actions.                                                      |
| `prisma` (in `packages`) | Schema and migrations live under `packages/database/prisma`.                               |

Referenced but not present: `apps/admin` (root script `dev:admin` points at `@openedu/admin`),
`workers/data-ingestion` (root script `worker:test` and `.prettierignore` point at it),
`packages/config`. Nothing imports them.

## Request and data flow

Read path: a server component under `apps/web/app` (`export const dynamic = "force-dynamic"`) calls a
loader in `apps/web/lib` (`search.ts`, `student.ts`, `eligibility.ts`), which calls `db` from
`@openedu/database`, which is a Prisma client bound to PostgreSQL through `DATABASE_URL`.

Write path: a `<form>` posts to a server action in `apps/web/app/actions/*.ts` (`"use server"`). Most
actions follow the same order:

1. `requireUser(...)` from `apps/web/lib/session.ts`, or `getCurrentUser()` for the export route.
2. Parse `FormData` with a schema from `@openedu/validation`.
3. Resolve the caller's `StudentProfile` (`profileIdForUser`, `profileFor`, `profileIdFor`) and scope
   every query by that id.
4. Write inside a transaction when more than one row is involved.
5. `audit(...)` from `apps/web/lib/audit.ts`, for state changes rather than for reads.
6. `revalidatePath(...)` for the affected routes.

Eligibility read path: `apps/web/lib/eligibility.ts` loads the profile and the opportunity, maps rows
into the plain objects in `packages/matching/src/types.ts`, and calls `evaluateOpportunity`. The result
is rendered by `apps/web/components/eligibility-panel.tsx`. Nothing is cached and no `MatchResult` row
is written; every page view recomputes.

## Why Next route handlers instead of a separate backend

There are two route handlers only: `apps/web/app/api/health/route.ts` and
`apps/web/app/api/account/export/route.ts`. Everything else is a server action.

The reason is deployment: `Dockerfile` builds only `@openedu/web` and starts it with
`pnpm --filter @openedu/web start`, and `docker-compose.yml` exposes a single port. A second service
would need its own build, health check and secret handling for no current benefit. No Express,
Fastify or NestJS dependency exists in any `package.json`.

The cost is that long-running work cannot live in a request. That is why ingestion is meant to be
Python workers rather than a route handler.

## Where business rules live

- Eligibility: `packages/matching/src/engine.ts`. Deterministic, no I/O.
- Input shape and normalisation: `packages/validation/src/index.ts`.
- Display of verification state: `packages/ui/src/provenance.tsx` and `packages/shared/src/labels.ts`.
- Everything stateful (who may read which row, what gets audited) lives in `apps/web/lib` and the
  server actions. It is not in the packages.

The engine takes codes and ranks, not database rows. That keeps it testable and keeps Prisma types out
of the rules.

## TypeScript and Python boundary

TypeScript owns the request path, the database, and the matching rules. Python is reserved for data
ingestion: fetching, parsing, normalising, validating source records, and writing provenance rows.

No Python exists in the repository yet, so the boundary is currently a plan rather than a running
interface. When it lands it should write through the `DataSource`, `IngestionRun`, `SourceRecord`,
`ChangeLog` and `VerificationRecord` tables and never touch student tables.

## AI provider abstraction

The platform is meant to work with no AI configuration at all. Today that is true in the strongest
sense: there is no provider client, no SDK dependency, and no route that calls a model.

What exists:

- `apps/web/lib/env.ts` validates `AI_PROVIDER`, `GEMINI_API_KEY` and `GEMINI_MODEL`, and
  `isAiConfigured()` reports whether a key is present. Nothing else reads the key.
- `AIConversation`, `AIMessage` and `AIUsageRecord` tables, all empty.
- `ConsentKind.AI_PROCESSING` in the consent enum.
- `apps/web/lib/legal.ts` states plainly that the assistant is not enabled.

So "works without an API key" is not a fallback path, it is the only path. When an assistant is added,
the rule stays: the engine decides eligibility, and the model may only explain results built from
catalogue rows.

## Decision log

Only decisions visible in the code. Dates are when the decision was recorded, not when it was
revisited.

### 2026-11-02 — pnpm workspaces plus Turborepo, one application

Context: a monorepo was required, but only one deployable exists. Decision: `pnpm-workspace.yaml`
covers `apps/*` and `packages/*`; `turbo.json` defines `build`, `typecheck`, `test` and `dev`.
Consequences: adding the admin app is a new workspace, not a new repository. Turbo caches per task;
`globalEnv` lists every env var that affects a build.

### 2026-11-02 — One generated Prisma client, output inside the package

Context: several workspaces need the same client and types. Decision: `generator client` writes to
`../src/generated/prisma`, and `packages/database/src/index.ts` re-exports it and exports a single
`db`. That directory is gitignored and produced by `pnpm db:generate`.
Consequences: a fresh clone cannot typecheck before `db:generate`; CI runs it as its second step.

### 2026-11-02 — Private student data separated by model group

Context: public catalogue rows and student records have different access rules. Decision: the schema is
grouped by domain, with student tables hanging off `StudentProfile` and public tables carrying
verification columns. Public rows have no relation to `User` except through review metadata.
Consequences: every student query can be scoped by `profileId`; no public page joins a student table.

### 2026-11-02 — Grades compared only inside one grade scale

Context: grade conversions between systems are usually unsourced. Decision: `StudentQualification`
stores `gradeScaleId` and a rank from `GradeBand`, and the engine compares ranks only when
`gradeScaleCode` matches the requirement. `QualificationEquivalence` exists for documented
equivalencies but no code reads it and no rows are seeded.
Consequences: an IB result cannot satisfy an A Level grade requirement; the result is `UNKNOWN` with an
explanation.

### 2026-11-03 — Node `crypto.scrypt` and database-backed opaque sessions

Context: authentication had to be implemented without adding an auth dependency. Decision:
`apps/web/lib/crypto.ts` hashes passwords with scrypt (N=16384, r=8, p=1, 64-byte key, 16-byte salt),
stored as `scrypt$N$r$p$salt$key`. `apps/web/lib/session.ts` mints a 32-byte random token, stores only
its SHA-256 hash in `Session.tokenHash`, and sets it in an httpOnly cookie.
Consequences: a database read is needed on every request; the database is the single source of truth
for revocation. Password rotation revokes all sessions.

### 2026-11-03 — Rate limiting in PostgreSQL rather than Redis

Context: Redis is optional infrastructure. Decision: `apps/web/lib/rate-limit.ts` counts rows in
`RateLimitEvent` per bucket key inside a time window, hashes the client IP with `AUTH_SECRET`, and
deletes rows older than a day on roughly 2% of calls.
Consequences: the app needs only a database to be safe to expose; throughput is bounded by write
volume, and the counters are per-database rather than per-process.

### 2026-11-03 — Root `.env`, loaded by a wrapper script

Context: Next reads `.env` from the app directory; the workspace keeps one file at the root. Decision:
`apps/web/scripts/with-env.mjs` parses the root `.env` with `dotenv`, sets only variables that are not
already defined, then spawns the local Next binary. `dev`, `build` and `start` all go through it.
Consequences: `pnpm dev:web` works from a fresh clone; a variable already exported in the shell wins.

### 2026-11-03 — PostgreSQL full-text search with a matching GIN index

Context: search had to work without a search service. Decision: university search uses
`websearch_to_tsquery('simple', ...)` over name, official name and city, plus `ILIKE` fallbacks, in
`apps/web/lib/search.ts`. Migration `20261103093000_university_search_index` creates a GIN index on
exactly that expression.
Consequences: the SQL expression and the index must stay identical; programmes and scholarships use
Prisma `contains` filters and have no index of their own.

### 2026-11-03 — Health check reports configuration, not secrets

Context: operators need to know what a deployment runs. Decision: `api/health` returns database
reachability plus whether AI and email are configured, the storage driver, and whether rate limiting is
disabled. `apps/web/app/account/page.tsx` shows the same facts to the signed-in user.
Consequences: no key material or connection string can leak through either surface.
