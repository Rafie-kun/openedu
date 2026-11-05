# OpenEdu

OpenEdu is a planning workspace for students who are trying to study somewhere other than where they
finished school.

You record your qualifications the way they were actually awarded: the exam board, the subject, the
grade, the session, the scale. Then you open a programme or a scholarship and see a requirement by
requirement comparison against what you entered. Every requirement in that comparison carries a link
to where it came from and the date it was last checked. If the platform cannot check something, it
says so instead of guessing.

Eligibility is decided by a deterministic rules engine in `packages/matching`. A language model can
explain the result later; it does not produce it.

## Why this exists

There is no shortage of university directories. The gap is usually the part after the list: is this
requirement current, does it apply to me, what exactly am I missing, and what do I do about it.

So the two things this project cares about most are:

1. **Provenance.** A public record without a source and a check date is treated as unverified, and
   unverified requirements cannot produce a confident eligibility result.
2. **Honesty about grades.** A Cambridge A* and an IB 7 stay on their own scales. The platform does
   not invent a GPA conversion, because most of those conversions are not backed by anything.

## Status

Early. The repository is being built in the open and the catalogue is deliberately sparse.

Working today:

- email/password accounts, database-backed sessions, rate limiting, account deletion and JSON export
- student profile, qualifications with subject-level results, predicted vs achieved grades, language tests
- university, programme and scholarship pages with verification badges and source links
- deterministic eligibility checks per programme and scholarship, including missing-data states
- saved opportunities, application tracker with status history, private notes, tasks, a document checklist
  and a deadline calendar that separates your own dates from catalogue dates
- budget plans with Frankfurter reference rates, shown with their rate date and labelled as estimates
- an optional assistant that answers from catalogue rows, cites them and stores the thread; it stays off
  when no provider key is configured
- qualification reference data for several international systems, plus a small set of real institutions
- a Python ingestion worker with ROR and OpenAlex adapters, change detection, and an admin review queue
  and source registry

Not built yet:

- an admin record editor. Programme, scholarship, deadline and visa tables are still empty, and the
  platform does not invent rows to fill them
- the Redis queue and the scheduler for the ingestion worker
- document upload and storage
- email delivery and notification generation
- verified visa records. The visa page exists and will stay empty until official sources are recorded

The catalogue currently contains institutions and reference data only. There are no invented
scholarships, no invented deadlines and no guessed entry requirements. If a page looks empty, that is
the actual state of the data.

## Stack

| Layer    | Choice                                                 |
| -------- | ------------------------------------------------------ |
| Web      | Next.js App Router, React, TypeScript                  |
| Styling  | Tailwind CSS v4 plus custom CSS tokens                 |
| Data     | PostgreSQL, Prisma                                     |
| Matching | TypeScript, pure functions, unit tested                |
| Workers  | Python (`workers/data-ingestion`), Redis queue planned |
| Tests    | Vitest, Playwright, pytest                             |
| Monorepo | pnpm workspaces, Turborepo                             |

## Local setup

Requirements: Node 20.11 or newer, pnpm 9 or newer, Docker (or your own PostgreSQL).

```bash
cp .env.example .env
docker compose up -d db
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev:web
```

On Windows, copy the env file with `Copy-Item .env.example .env`.

`AUTH_SECRET` must be at least 32 characters. Generate one with `openssl rand -base64 32` or any
equivalent. Never commit your `.env`.

The app runs at http://localhost:3000. The seed loads countries, grade scales, qualification types,
subjects, degree types, currencies and a handful of institutions marked `UNVERIFIED`. It does not load
fake requirements.

### Checks

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm worker:test
```

The web app is designed to boot without a reachable database so that a build does not require one, but
any page that queries data will fail at request time if `DATABASE_URL` is wrong.

## How a match is decided

Short version:

- requirements are evaluated one at a time, mandatory and optional separately
- a requirement that is not `VERIFIED`, or whose last check is older than a year, downgrades the
  result to "needs confirmation" rather than passing it
- grades are only compared inside the same grade scale
- in-progress and predicted results never satisfy a final grade requirement
- no recorded requirements means `UNVERIFIED`, not `ELIGIBLE`

The full rules and the test cases are in `packages/matching` and `docs/matching-engine.md`.

## Data rules

These are not aspirations, they are review criteria:

- no institution, programme, scholarship or deadline is added without a real source
- when two sources disagree, the conflict is recorded; the platform does not silently pick one
- a record keeps its previous versions when a field changes
- an empty field stays empty. Do not write "N/A", "varies" or a plausible number
- scraping a page is not the same as having permission to redistribute it. Check before importing

## Contributing

Read `CONTRIBUTING.md` first. Data corrections are as welcome as code, but they need a source link.
Security issues should go through `SECURITY.md`, not the public issue tracker.

## License

MIT. See `LICENSE`.

Built by [Rafie-kun](https://github.com/Rafie-kun). OpenEdu is not a university, an admissions service,
a funding body or an immigration adviser, and it is not affiliated with any of them.
