# Data sources

Rules for collecting public catalogue data, the registry that records them, and what is actually in the
database today.

## The registry

`DataSource` in `packages/database/prisma/schema.prisma` is the record of a source, not of its contents.
Fields:

| Field                   | Meaning                                                                                                              |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `code`, `name`          | Stable identifier and human name                                                                                     |
| `organisation`          | Who publishes the data                                                                                               |
| `category`              | `UNIVERSITY_DIRECTORY`, `SCHOLARSHIP`, `IMMIGRATION`, `CURRENCY`, `RESEARCH_IDENTITY`, `NATIONAL_AUTHORITY`, `OTHER` |
| `url`, `termsUrl`       | Source location and its terms page                                                                                   |
| `accessMethod`          | `API`, `BULK_DOWNLOAD`, `MANUAL`, `HTML_SCRAPE`                                                                      |
| `licenceSummary`        | What the source says about reuse, in the collector's words                                                           |
| `permissionStatus`      | `APPROVED`, `PENDING`, `RESTRICTED`, `PROHIBITED`, `UNKNOWN`                                                         |
| `attributionRequired`   | Whether published output must credit the source                                                                      |
| `bulkCollectionAllowed` | Nullable on purpose: unknown is not the same as allowed                                                              |
| `updateFrequencyHours`  | Intended recheck interval                                                                                            |
| `reliabilityNote`       | What the source is good for, and what it cannot prove                                                                |
| `knownLimitations`      | Documented gaps, so nobody re-discovers them                                                                         |
| `isActive`              | Whether collection is switched on                                                                                    |
| `lastSuccessfulRunAt`   | Last run that completed                                                                                              |
| `lastAttemptedRunAt`    | Last run that started, successful or not                                                                             |

Related tables: `IngestionJob` (schedule, enabled flag), `IngestionRun` (status, counters, error
summary, JSON log), `SourceRecord` (external id, payload, content hash, version, first and last seen),
`ChangeLog` (per-field before and after, review status), `VerificationRecord` (who checked what, when),
`ReviewQueueItem` (what needs a human).

None of these tables has rows except `DataSource`.

## Policy

These are review criteria, not intentions.

1. Prefer an official API or a published dataset over fetching HTML.
2. Do not bypass authentication, paywalls, anti-bot systems or `robots` directives. A page being
   readable is not permission to collect or redistribute it.
3. Record the licence before writing an adapter. If the terms are unclear, leave
   `permissionStatus` as `PENDING` or `UNKNOWN` and `isActive` false.
4. Check whether redistribution is allowed, separately from whether access is allowed. Open-source code
   does not make third-party data open.
5. Keep attribution with the record, not only in a footer.
6. Store what the source said: the URL, the collection timestamp, the last check, and the version. Do
   not overwrite history.
7. When two sources disagree, write a `ChangeLog` entry and a `ReviewQueueItem`. Do not pick the newer
   value automatically.
8. A record with no source and no check date is `UNVERIFIED` and cannot produce a confident eligibility
   result.

No adapter may write to `User`, `StudentProfile` or any table hanging off a profile.

## Seeded today

Four rows in `packages/database/prisma/seed.ts`. All are created with `permissionStatus: "PENDING"` and
`isActive: false`, meaning none is approved for collection.

| Code          | Name                            | Category               | Access   | Recorded licence note                                                            | Recorded limitation                                                                                     |
| ------------- | ------------------------------- | ---------------------- | -------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `ROR`         | Research Organization Registry  | `RESEARCH_IDENTITY`    | `API`    | "Registry data is released under CC0."                                           | Identifies research organisations; inclusion is not evidence of accreditation or degree-awarding status |
| `OPENALEX`    | OpenAlex                        | `RESEARCH_IDENTITY`    | `API`    | "Metadata is CC0; API use is subject to the project's terms."                    | Institution records include research bodies that do not teach degrees                                   |
| `WHED`        | World Higher Education Database | `UNIVERSITY_DIRECTORY` | `MANUAL` | "Access conditions and licensing must be confirmed before any bulk use."         | Not an open bulk dataset. Do not scrape without written permission                                      |
| `FRANKFURTER` | Frankfurter exchange rates      | `CURRENCY`             | `API`    | "Open-source service publishing reference rates from the European Central Bank." | Reference rates, not what a bank or payment provider gives you; not every currency is covered           |

Notes on reading that table:

- The licence column quotes the seed verbatim. Where the note describes the service rather than a
  licence for its data (Frankfurter), no data licence is recorded in this repository.
- `ROR` and `OPENALEX` are registered as identity helpers. Neither is used to claim that an institution
  is accredited.
- `WHED` is registered as `MANUAL` precisely so no code is written against it before permission exists.

## Frankfurter today

`apps/web/lib/exchange-rates.ts` is the only source integration in the request path. It calls
`https://api.frankfurter.app/latest?from=CODE`, validates that the response names the base it asked for
and only keeps positive numeric rates, then upserts one `ExchangeRate` row per quote currency with
`sourceName = "Frankfurter"` and the ECB rate date. A stored snapshot younger than 12 hours is reused
without a request.

What the numbers mean:

- These are ECB reference rates, published once per working day. A weekend or holiday request returns
  the previous working day's date, and the rate date on screen shows that, not the fetch time.
- A conversion is an estimate for planning. It is not a bank, card or transfer quote and excludes fees.
- When the fetch fails the page falls back to the newest stored snapshot and marks it stale. When no
  snapshot exists at all, the budget page says so instead of converting.

Frankfurter's own terms and the ECB's reuse conditions still have to be re-read before this is treated
as settled for production. The `FRANKFURTER` `DataSource` row records that gap in `licenceSummary`.

## Candidate sources, not integrated

Researched but not implemented. Nothing below has an adapter, a schedule, or approved permission.

| Source                                                | Category             | Status in this repo                                                                            |
| ----------------------------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------- |
| UNESCO WHED                                           | University directory | Registered as `WHED`, manual, pending. Access conditions must be confirmed in writing          |
| ROR                                                   | Research identity    | Registered, no adapter                                                                         |
| OpenAlex                                              | Research identity    | Registered, no adapter                                                                         |
| Official university and programme catalogues          | University directory | Nothing collected. The 12 seeded institutions carry only names, cities, types and website URLs |
| National ministries and higher education authorities  | `NATIONAL_AUTHORITY` | No rows                                                                                        |
| Official scholarship providers and government portals | `SCHOLARSHIP`        | No rows. No scholarship is seeded at all                                                       |
| Official immigration portals                          | `IMMIGRATION`        | No rows. No visa record is seeded                                                              |
| Frankfurter                                           | Currency             | Registered and used for reference rates. Fetched on demand by `apps/web/lib/exchange-rates.ts` |

The `Currency` table is seeded with 40 ISO 4217 codes. That is reference data, not a rate source.

## Not verified yet

State of the data as committed:

- No `IngestionJob`, `IngestionRun`, `SourceRecord`, `ChangeLog`, `VerificationRecord` or
  `ReviewQueueItem` row is seeded. The worker creates them when a run is actually executed.
- `workers/data-ingestion` exists and is tested, but nothing schedules it yet: a run is a manual CLI
  invocation.
- Every seeded catalogue row is `UNVERIFIED` with `lastCheckedAt` equal to the seed run time. That
  timestamp means "written by the seed", not "checked against the source".
- Five catalogue records are seeded with real data: 3 programmes (University of Łódź Business
  Management, UCSI Foundation in Arts, Ravensbourne BSc Business Management with International Year
  One) and 2 scholarships (UoPeople Scholarships, Romania Ministry of Foreign Affairs non-EU
  scholarships). Each requirement, fee, language condition and deadline carries the exact official page
  it was transcribed from and a collection date of 2026-11-06. All start `PENDING_REVIEW`, not
  `VERIFIED` — a fact collected once is not the same as an admin re-checking it against the live page.
  No visa record is seeded.
- Institution names, cities, types and official URLs are facts taken from the institutions themselves.
  Nothing about their entry requirements, fees or recognition beyond the five seeded records above is
  asserted.
- The four `DataSource` licence notes have not been re-read against the live terms pages since they
  were written. Treat them as claims to re-check before an adapter is built.

## Adding a source

1. Add or update the `DataSource` row with `permissionStatus: "PENDING"` and `isActive: false`.
2. Write the findings note in this file: access method, licence, attribution, rate limits, what the
   source cannot prove.
3. Only after that, build the parser and normaliser, and enable the job.
4. Record `IngestionRun` counters and keep failures visible; a run that collected nothing is not a
   success.
