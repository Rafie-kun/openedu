# Development

How to run this repository locally, and what the checks actually do.

## Requirements

| Tool       | Version                                              | Notes                                                      |
| ---------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| Node       | 20.11 or newer                                       | `engines` in the root `package.json`                       |
| pnpm       | 9 or newer                                           | `packageManager` pins 11.22.0; `corepack enable` is enough |
| PostgreSQL | 17 in `docker-compose.yml`, any recent version works | or your own instance                                       |
| Docker     | optional but easiest                                 | `db` and `redis` services                                  |
| Python     | 3.11 or newer for `workers/data-ingestion`           | `uv sync` or `pip install -e .[dev]` in that directory     |

There is no `packages/config` workspace and no `apps/admin`.

## Environment

One file, at the repository root: `.env`. It is gitignored through the `.env` and `.env.*` patterns in
`.gitignore`, and only `.env.example` is committed.

```bash
cp .env.example .env            # macOS / Linux
Copy-Item .env.example .env     # Windows PowerShell
```

Required:

| Variable       | Rule                                                                     |
| -------------- | ------------------------------------------------------------------------ |
| `DATABASE_URL` | PostgreSQL connection string, `?schema=public` in the example            |
| `AUTH_SECRET`  | At least 32 characters. `apps/web/lib/env.ts` refuses to start otherwise |
| `APP_URL`      | Public base URL, default `http://localhost:3000`                         |

Optional: `REDIS_URL` (nothing reads it yet), `AI_PROVIDER`, `GEMINI_API_KEY`, `GEMINI_MODEL`,
`STORAGE_DRIVER` and the `S3_*` values, `EMAIL_PROVIDER_API_KEY`, `EMAIL_FROM`,
`RATE_LIMIT_DISABLED`.

Generate a secret with the command in `.env.example`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Validation happens in `env()` in `apps/web/lib/env.ts`, called from the pages and actions that need
it, not at import time. The error message names the failing variable and nothing else.

### Why `apps/web/scripts/with-env.mjs` exists

Next only reads `.env` files from the directory it runs in, which is `apps/web`. This workspace keeps a
single `.env` at the root because the Prisma scripts in `packages/database` read it too
(`dotenv -e ../../.env`). The wrapper loads the root file with `dotenv`, sets only variables that are
not already defined, then spawns the local Next binary. `dev`, `build` and `start` in
`apps/web/package.json` all go through it, so `pnpm dev:web` works from a clean checkout. A variable
already exported in your shell takes precedence over the file.

Because of the wrapper, the Docker build passes placeholder `DATABASE_URL` and `AUTH_SECRET` values and
still builds; the image is not expected to reach a database at build time.

## Local services

```bash
docker compose up -d db          # PostgreSQL on 5432
docker compose up -d redis       # only needed once the queue lands
```

The compose file also defines a `web` service under the `full` profile, which builds `Dockerfile`. It
requires `AUTH_SECRET` from the shell or from the root `.env`, and refuses to start without it:

```bash
docker compose --profile full up -d
```

## Database

```bash
pnpm install
pnpm db:generate     # prisma generate, writes packages/database/src/generated/prisma
pnpm db:migrate      # prisma migrate dev, creates a migration from schema changes
pnpm db:seed         # tsx prisma/seed.ts, upserts reference data
```

`db:generate` must run before `typecheck` on a fresh clone: the generated client is gitignored and every
workspace imports it.

Other scripts:

| Command                                    | Effect                                                                                      |
| ------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `pnpm db:deploy`                           | `prisma migrate deploy`. Applies existing migrations only.                                  |
| `pnpm db:studio`                           | Prisma Studio against `DATABASE_URL`.                                                       |
| `pnpm --filter @openedu/database db:reset` | `prisma migrate reset --force`: drops the database, replays migrations, then runs the seed. |

There is no `db:reset` alias at the root. Use the filter form above. Reset destroys all local student
data and is the fastest way back to a known state.

The seed is idempotent: every write is an `upsert` keyed on a unique column. CI proves it by running
`pnpm db:seed` twice in a row (`.github/workflows/ci.yml`, `migrations` job).

## Running the app

```bash
pnpm dev:web      # apps/web on http://localhost:3000
pnpm dev          # turbo run dev --parallel; only apps/web has a dev script
```

`pnpm dev:admin` is defined at the root but fails: `apps/admin` does not exist. `pnpm worker:test`
runs pytest in `workers/data-ingestion`.

## Checks

| Command             | What it runs                                                                  |
| ------------------- | ----------------------------------------------------------------------------- |
| `pnpm typecheck`    | `tsc --noEmit` in every workspace, `strict` and `noUncheckedIndexedAccess` on |
| `pnpm test`         | Vitest in `matching`, `shared`, `validation`, `database`, `web`               |
| `pnpm build`        | Turborepo build; only `apps/web` has one                                      |
| `pnpm format:check` | `prettier --check .` with `.prettierrc.json`                                  |
| `pnpm format`       | `prettier --write .`                                                          |

`apps/web` sets `"test": "vitest run --passWithNoTests"` and `vitest.config.ts` includes both
`test/**/*.test.ts` and `lib/**/*.test.ts`. The suites there cover the ingestion candidate helpers, the
Gemini client with a stubbed `fetch`, and rate-payload parsing and conversion. `pnpm test:e2e` runs
`playwright test`, but there is no Playwright config and no `e2e` directory, so it fails.

The useful suites today are `packages/matching/test/engine.test.ts` (18 cases), the validation and
shared tests, and the three `apps/web/lib` suites.

CI runs three jobs: `checks` (generate, typecheck, test, build), `migrations` (against a real Postgres
service: deploy, then seed twice), and `formatting`.

## Windows notes

- Windows PowerShell 5.1 does not accept `&&` as a command separator. Use `;` or separate commands.
- Use `Copy-Item .env.example .env` rather than `cp`.
- Prisma ships a Windows query engine; `pnpm db:generate` can fail with a file lock if a dev server is
  running and holding `query_engine-windows.dll.node`. Stop the server and rerun.
- The scripts under `apps/web/scripts` and all package scripts are Node, so they behave the same on
  Windows, macOS and Linux. Do not add shell logic outside `scripts/*.sh` / `scripts/*.ps1`.
- File paths with spaces work; quote them. This checkout lives under `F:\Open code\EduBuf`.

## Troubleshooting

| Symptom                                                  | Cause                                                          |
| -------------------------------------------------------- | -------------------------------------------------------------- |
| `Invalid environment configuration` naming `AUTH_SECRET` | Secret shorter than 32 characters or missing from `.env`       |
| Types missing after `pnpm install`                       | `pnpm db:generate` has not run                                 |
| Pages throw at request time but the build succeeded      | `DATABASE_URL` is wrong; the build does not query the database |
| Everything returns 401 or redirects to `/login`          | Stale cookie, or the session row was deleted                   |
| Rate limits hit while testing                            | Set `RATE_LIMIT_DISABLED=true`, never in production            |
