# Status

Phase numbering follows the roadmap in `AGENTS.md` section 26. "Done" means the behaviour exists and is
reachable in the app; "partial" means some of it works and the missing part is named.

| Phase | Scope                                  | State       | Evidence                                                                                                                                                                                                                                                                          |
| ----- | -------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0     | Repository inspection and architecture | Done        | `docs/architecture.md`, `docs/development.md`, this file                                                                                                                                                                                                                          |
| 1     | Project foundation                     | Done        | pnpm workspaces, Turborepo, Next 16 app, Tailwind v4, Prisma, env validation, Docker, CI                                                                                                                                                                                          |
| 2     | Authentication and student profiles    | Done        | Register, login, logout, sessions, onboarding, profile, dashboard, account page                                                                                                                                                                                                   |
| 3     | Qualification and grade database       | Partial     | 7 grade scales, 9 qualification types, subject-level results, predicted vs achieved. No equivalency rows                                                                                                                                                                          |
| 4     | University and scholarship database    | Partial     | Models complete, 12 universities seeded, search and filters. No programmes, no scholarships, no admin UI                                                                                                                                                                          |
| 5     | Eligibility and matching engine        | Done        | `packages/matching`, 18 unit tests, wired into programme and scholarship pages                                                                                                                                                                                                    |
| 6     | Automatic data ingestion               | Partial     | `workers/data-ingestion` (Python, pytest, 53 tests) ingests ROR and OpenAlex end to end into `SourceRecord`/`ChangeLog`/`ReviewQueueItem`. Admin review queue and candidate-promotion UI at `/admin/review` publish candidates into `University`. No scheduler or Redis queue yet |
| 7     | Application guidance and workspace     | Partial     | Guidance page, saved items, tracker with status history and notes, notifications list. No document checklist, no calendar                                                                                                                                                         |
| 8     | Visa centre and budget planner         | Partial     | Manual budget plans and cost lines. No exchange rates, no visa records, no country directory                                                                                                                                                                                      |
| 9     | AI assistant                           | Not started | Config flags, three empty tables and a consent kind. No provider client                                                                                                                                                                                                           |
| 10    | Release readiness                      | Partial     | Security headers, docs, CI. No accessibility audit, no backups, no e2e suite                                                                                                                                                                                                      |

## What works today

- Accounts: email and password, scrypt hashing, database-backed sessions, login lockout, rate limiting,
  password change, immediate account deletion, JSON export.
- Profile: nationality, residence, intended degree level and subject, financial need band, preferred
  destinations, completeness scoring with named gaps.
- Qualifications: add and delete qualifications with an awarding body, grade scale, status, session,
  overall grade and up to 40 subject results marked achieved, predicted or estimated. Language tests with
  expiry.
- Catalogue: university, programme and scholarship lists with search, country, level and type filters,
  pagination, and verification badges with source links. Detail pages render requirements one by one.
- Eligibility: per-programme and per-scholarship evaluation with met, unmet, unknown and
  needs-confirmation groups, evidence strings, next steps, and a disclaimer on every result.
- Workspace: save and unsave universities, programmes and scholarships; application tracker with eleven
  statuses, status history, private notes, fee and deadline. Task rows are read and counted but nothing
  creates one yet.
- Budget: plans and cost items in a three-letter currency code, manual amounts, copy a recorded
  `CostEstimate` into a plan. The code is not checked against the `Currency` table.
- Operations: `/api/health` reporting database reachability and which optional integrations are
  configured; audit log for account, academic, application and budget mutations.
- Ingestion: `workers/data-ingestion` CLI runs the ROR or OpenAlex source adapter, writes `SourceRecord`
  rows with a version and change log, opens a `ReviewQueueItem` for new institution candidates, and
  records the run on `DataSource`/`IngestionRun`. `/admin/review` lists open items, shows the source
  payload and field changes, and lets an admin promote a candidate into `University` (unverified, source
  link attached), resolve, or reject.

## Known gaps

| Gap                                     | Detail                                                                                                                                                                                    |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Admin application                       | `/admin` lives inside `apps/web`, not a separate `apps/admin` workspace; there is no role-gated separate deployment. Covers review queue only, no record editing or source management yet |
| Python ingestion workers                | ROR and OpenAlex adapters exist; no scheduler, no Redis queue, and retries are per-request, not across failed jobs                                                                        |
| Document upload and storage             | No upload route and no storage client. `ApplicationDocument.storageKey` is never set                                                                                                      |
| Email delivery                          | `EMAIL_PROVIDER_API_KEY` and `EMAIL_FROM` are validated but no provider is implemented                                                                                                    |
| Notification generation                 | The list, read state and preferences work; nothing creates a `Notification` row                                                                                                           |
| AI assistant UI                         | No conversation interface and no provider client. `isAiConfigured()` only reads a key                                                                                                     |
| Verified visa records                   | `/visas` renders an empty state by design. No `VisaCategory` row exists                                                                                                                   |
| Match persistence                       | `evaluateOpportunity` runs per request. `MatchResult` and `MatchingRuleVersion` stay empty                                                                                                |
| Currency conversion                     | `ExchangeRate` is empty and no code converts. Budget totals are single-currency                                                                                                           |
| Programme and scholarship data          | Neither table has rows, so search returns empty lists and eligibility has nothing to evaluate                                                                                             |
| Programme and scholarship search        | Uses Prisma `contains`; only universities have full-text search and a GIN index                                                                                                           |
| Country directory                       | No route. Countries appear only as filter options                                                                                                                                         |
| CSRF and CSP                            | No explicit CSRF token and no Content-Security-Policy (`docs/security.md`)                                                                                                                |
| Email verification, password reset, 2FA | Not implemented                                                                                                                                                                           |
| Test coverage                           | No `apps/web` tests except `lib/candidates.test.ts`; no Playwright config or `e2e` directory                                                                                              |
| Accessibility and backups               | WCAG 2.2 AA has not been audited; backup and restore are undocumented and unmanaged                                                                                                       |

The GIN index on university full-text search **does** exist, in migration
`20261103093000_university_search_index`, and matches the expression in `apps/web/lib/search.ts`. The
remaining search limitation is that the query also matches `Country.name` with `ILIKE`, which the index
cannot serve.

## Next steps

1. Real programme and scholarship records with sourced requirements, so the catalogue and the engine have
   something to compare. Highest-value next step: the matching engine and search both have nothing to act
   on yet.
2. A scheduler and Redis-backed queue instead of manual CLI invocation, and a source adapter for a
   scholarship or visa portal now that two institution-candidate sources confirm the pipeline shape.
3. Persist evaluations to `MatchResult` with an engine version, and record rule versions when the rules
   change.
4. Exchange rates from a registered source, with the source and rate date shown next to any converted
   amount.
5. Document upload with the storage controls listed in `docs/security.md`.
6. Notification generation for deadlines and data changes, with the dedupe key already in the schema.
7. Email verification and password reset, both of which need an email provider.
8. Accessibility pass, Playwright coverage of the register-to-tracker journey, and a documented backup and
   restore procedure.
