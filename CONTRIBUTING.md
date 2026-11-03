# Contributing to EduBuf

Thanks for looking. This project has an unusual constraint for an open-source app: the data matters
more than the code, and a plausible-looking wrong record is worse than an empty page.

## Before you open a pull request

- Run `pnpm install`, then `pnpm db:generate`, `pnpm typecheck` and `pnpm test`.
- If you changed the Prisma schema, include the migration (`pnpm db:migrate`) and check that
  `pnpm db:seed` still runs twice without creating duplicates.
- If you touched matching rules, add or update a case in `packages/matching/test/engine.test.ts`.

## Data contributions

A data correction needs three things:

1. the record and field you are changing;
2. the official URL that says otherwise;
3. the date you checked it.

Corrections without a source will be closed. That is not hostility; it is the entire point of the
project. If two sources disagree, tell us both and we record the conflict instead of picking one.

Things that will not be merged:

- institutions, programmes or scholarships invented to fill out a demo;
- "typical" entry requirements, "around" tuition fees, or guessed deadlines;
- grade conversions that are not published by an awarding body, a university or a recognised
  authority;
- visa rules sourced from an agency, a blog or another country's page;
- scraped content that the source's terms do not allow us to redistribute.

Empty fields are correct when we do not know something. Leave them empty.

## Code

- TypeScript in `apps/*` and `packages/*`; Python in `workers/` once the ingestion worker lands.
- Match the surrounding style rather than reformatting untouched files.
- Comments explain a non-obvious decision. Do not narrate what the line already says.
- Server actions validate input with a schema from `packages/validation` and check ownership of
  every private record.
- Do not add a dependency if an existing one covers the job. Do not add a second ORM, HTTP framework,
  job queue or AI provider without an architecture note in `docs/architecture.md`.

## Commits and branches

Short, imperative subjects: `fix programme deadline display`, not `Fixed stuff`. One logical change
per commit. Branch names like `data/ror-adapter` or `fix/session-cookie`.

## Review

A reviewer will check:

- does it build, typecheck and pass tests;
- is every new public record traceable to a source;
- does it leak another user's data or widen permissions;
- does the UI still make sense with zero records (the normal state of a new catalogue).

## Reporting security issues

Do not use the public issue tracker. See [SECURITY.md](SECURITY.md).

## License

By contributing you agree your work is licensed under the MIT licence in [LICENSE](LICENSE).
