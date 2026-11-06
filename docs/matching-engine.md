# Matching engine

The engine is `packages/matching/src/engine.ts`, a pure function with no database access. Types are in
`packages/matching/src/types.ts`. Tests are in `packages/matching/test/engine.test.ts`.

`apps/web/lib/eligibility.ts` is the only caller. It loads a profile and an opportunity, builds the
snapshot objects, and passes them in.

## Inputs

`StudentSnapshot`:

| Field                    | Notes                                                                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `nationalityCountryCode` | ISO 3166-1 alpha-2, or null                                                                                                     |
| `residenceCountryCode`   | ISO 3166-1 alpha-2, or null                                                                                                     |
| `dateOfBirth`            | `YYYY-MM-DD`, or null                                                                                                           |
| `intendedDegreeLevel`    | String compared to the requirement's `valueString`                                                                              |
| `financialNeedLevel`     | `LOW`, `MEDIUM`, `HIGH` or `PREFER_NOT_TO_SAY`                                                                                  |
| `languageTests`          | Test code, raw score string, optional expiry                                                                                    |
| `qualifications`         | Type code, level, status, grade scale code, overall grade and rank, subject results with `ACHIEVED` / `PREDICTED` / `ESTIMATED` |

`OpportunitySnapshot`: `kind` (`PROGRAMME` or `SCHOLARSHIP`), `id`, `title`, `verificationStatus`,
`officialUrl`, and a list of `OpportunityRequirement`. A requirement carries `key`, `label`, `kind`,
`isMandatory`, `sourceUrl`, `verificationStatus`, `lastCheckedAt`, plus the kind-specific fields
(`qualificationTypeCodes`, `requiredLevel`, `subjectCodes`, `matchMode`, `minimumGradeLabel`,
`minimumGradeRank`, `gradeScaleCode`, `languageTestCode`, `minimumScore`, `nationalityCodes`,
`residencyCodes`, `minAge`, `maxAge`, `valueString`).

Options: `asOf` (default now), `staleAfterDays` (default 365), `engineVersion` (default
`ENGINE_VERSION`, currently `"1.0.0"`).

## Evaluation

Each requirement is evaluated by its `kind`, then passed through the provenance filter. The order
matters.

### Per-kind rules

| Kind                    | Behaviour                                                                                                                                                                                                                                                                                                                                                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `QUALIFICATION`         | A held qualification (status `COMPLETED`, `AWARDED` or `PARTIALLY_COMPLETED`) matching `qualificationTypeCodes` is `MET`. With `requiredLevel` and no accepted codes, a held qualification at that level or above is `MET`. An in-progress one at or above that level is `NEEDS_CONFIRMATION`. No qualifications on the profile is `UNKNOWN`. Otherwise `NOT_MET`.                                                     |
| `SUBJECT`               | Only `ACHIEVED` results count. `matchMode` defaults to `ANY`; `ALL` requires every listed subject. Some but not all with `ALL` is `NOT_MET` and names the missing subjects. Only predicted results is `NEEDS_CONFIRMATION`. No requirements recorded is `NEEDS_CONFIRMATION`.                                                                                                                                          |
| `GRADE`                 | Requires both `minimumGradeRank` and `gradeScaleCode`, otherwise `NEEDS_CONFIRMATION`. Compares only within the same `gradeScaleCode`; grades on another scale produce `UNKNOWN` with an explicit "does not convert" message. The best rank wins. A predicted result that reaches the minimum is `NEEDS_CONFIRMATION`, not `MET`. The overall qualification grade is only used when the requirement lists no subjects. |
| `LANGUAGE`              | Matches `languageTestCode` exactly. No test is `UNKNOWN`. An unparsable score is `NEEDS_CONFIRMATION`. The freshest test (latest expiry) is used; an expired one is `NOT_MET`. Score comparison parses the first number, treating a comma as a decimal separator.                                                                                                                                                      |
| `NATIONALITY`           | Empty code list is `NEEDS_CONFIRMATION`; missing nationality is `UNKNOWN`; membership is `MET`, otherwise `NOT_MET`.                                                                                                                                                                                                                                                                                                   |
| `RESIDENCY`             | Same shape, using `residenceCountryCode`.                                                                                                                                                                                                                                                                                                                                                                              |
| `AGE`                   | Missing date of birth is `UNKNOWN`. Age is computed at `asOf` in UTC, with birthdays not yet reached subtracted. Outside `minAge`/`maxAge` is `NOT_MET`.                                                                                                                                                                                                                                                               |
| `FINANCIAL_NEED`        | Ordered `LOW < MEDIUM < HIGH`. Missing student level, including `PREFER_NOT_TO_SAY`, is `UNKNOWN`. Student level at or above the required one is `MET`.                                                                                                                                                                                                                                                                |
| `DEGREE_LEVEL`          | Compares `intendedDegreeLevel` to the requirement's `valueString`. Missing value is `NEEDS_CONFIRMATION`.                                                                                                                                                                                                                                                                                                              |
| `SUBJECT_AREA`, `OTHER` | Always `NEEDS_CONFIRMATION` with "read the official page". Never guessed.                                                                                                                                                                                                                                                                                                                                              |

### Provenance filter

Applied after the per-kind result, and skipped only for `UNKNOWN` and `NOT_APPLICABLE`:

1. Requirement status `CONFLICTING` becomes `NEEDS_CONFIRMATION`, and the evidence says sources
   disagree.
2. Status other than `VERIFIED` becomes `NEEDS_CONFIRMATION`, with "has not been verified against its
   source yet".
3. `lastCheckedAt` missing, unparsable, or older than `staleAfterDays` (365) becomes
   `NEEDS_CONFIRMATION`, with "source check is older than 365 days".

This filter also downgrades a `NOT_MET` result. A requirement that looks unmet but is unverified is
reported as needing confirmation, not as a failure. That is deliberate: the platform should not reject a
student on the strength of a stale page.

### Outcome

Evaluated in this order, first match wins:

| Condition                                                                  | Outcome                  |
| -------------------------------------------------------------------------- | ------------------------ |
| No mandatory requirements at all                                           | `UNVERIFIED`             |
| Any mandatory requirement is `NOT_MET`                                     | `NOT_CURRENTLY_ELIGIBLE` |
| Any mandatory requirement is not `MET` (`UNKNOWN` or `NEEDS_CONFIRMATION`) | `POTENTIALLY_ELIGIBLE`   |
| Opportunity itself is `CONFLICTING` or `ARCHIVED`                          | `UNVERIFIED`             |
| Otherwise                                                                  | `ELIGIBLE`               |

`completeness` is met mandatory requirements divided by mandatory requirements, rounded to two
decimals; zero when there are none. Optional requirements are still evaluated and listed, and never
change the outcome.

`summary` always ends with a sentence saying that meeting requirements is not an offer, an admission
decision or a funding guarantee. `nextSteps` is built from unmet, unknown and unconfirmed requirements,
plus a final reminder to check the official page.

## The four outcomes

| Outcome                  | Meaning                                                                                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ELIGIBLE`               | Every mandatory requirement is `MET` and verified, and the opportunity is not conflicting or archived. Not a guarantee of admission or funding.         |
| `POTENTIALLY_ELIGIBLE`   | At least one mandatory requirement is unknown, unverified, stale or needs confirmation, and none is a confirmed failure.                                |
| `NOT_CURRENTLY_ELIGIBLE` | A mandatory requirement is confirmed as not met, with the reason and the missing item named.                                                            |
| `UNVERIFIED`             | There is not enough verified requirement data to compare. Also returned when no requirements are recorded, so an empty record can never read as a pass. |

## Rule versioning

`MatchingRuleVersion` in the schema holds `version` (unique), `description`, `rulesJson`,
`effectiveFrom` and `createdById`. `MatchResult` has `engineVersion`, `ruleVersionId`, `dataCompleteness`
and child `MatchRequirementResult` rows that copy the requirement's source URL and check date.

Current state: the engine never reads `MatchingRuleVersion`, no rows exist, and no `MatchResult` is
written. `engineVersion` comes from the constant. Persisting evaluations is a later change; when it
happens, the row must record which rule version produced it.

## Adding a rule

1. Add the kind to the `RequirementKind` enum in `packages/database/prisma/schema.prisma` if it is new,
   and create a migration.
2. Add the case to `evaluateRequirement` in `packages/matching/src/engine.ts`. New per-kind fields go on
   `OpportunityRequirement` in `types.ts`.
3. If the rule needs student data, extend `StudentSnapshot` and `loadStudentSnapshot` in
   `apps/web/lib/eligibility.ts`.
4. Map the database rows into the new fields in `programmeSnapshot` and `scholarshipSnapshot` in the
   same file. Unmapped fields must stay null so the rule reports `NEEDS_CONFIRMATION`.
5. Add a test to `packages/matching/test/engine.test.ts` for each new branch, including the
   missing-data branch.
6. Bump `ENGINE_VERSION` when behaviour changes for existing requirements, and note it in
   `docs/architecture.md`.

Do not add a rule that reads the AI provider, the network, or the clock other than through `asOf`.

## Test cases

`packages/matching/test/engine.test.ts`, run with `pnpm test`. Fixed `asOf` of 2026-11-02 and check date
2026-06-01.

| Test                                              | Expected                                                       |
| ------------------------------------------------- | -------------------------------------------------------------- |
| Fully satisfied, verified opportunity             | `ELIGIBLE`, completeness 1                                     |
| Summary wording                                   | Contains "not an offer"                                        |
| Missing mandatory subject (Chemistry)             | `NOT_CURRENTLY_ELIGIBLE`, evidence names `CHEM`                |
| Language test missing from the profile            | `POTENTIALLY_ELIGIBLE`, requirement is `UNKNOWN`               |
| Expired language test                             | `NOT_CURRENTLY_ELIGIBLE`, evidence says expired                |
| Requirement marked `UNVERIFIED`                   | `NEEDS_CONFIRMATION`, outcome `POTENTIALLY_ELIGIBLE`           |
| Requirement checked in 2023                       | `NEEDS_CONFIRMATION`, evidence mentions 365 days               |
| Qualification still in progress                   | `NEEDS_CONFIRMATION`, `POTENTIALLY_ELIGIBLE`                   |
| Grade on a different scale (`IB_45` vs `CAIE_AL`) | `UNKNOWN`, evidence says it does not convert                   |
| Nationality not in the eligible list              | `NOT_CURRENTLY_ELIGIBLE`                                       |
| Nationality not supplied                          | `UNKNOWN`, `POTENTIALLY_ELIGIBLE`                              |
| Conflicting sources on a requirement              | `NEEDS_CONFIRMATION`, evidence says sources disagree           |
| Opportunity with no requirements                  | `UNVERIFIED`, completeness 0                                   |
| Opportunity itself `CONFLICTING`                  | `UNVERIFIED`                                                   |
| Optional requirement that cannot be checked       | Outcome `ELIGIBLE`, optional item listed as needs confirmation |
| Age above the maximum                             | `NOT_CURRENTLY_ELIGIBLE`, evidence names the maximum age       |
| Only predicted grade for a grade requirement      | `NEEDS_CONFIRMATION`, `POTENTIALLY_ELIGIBLE`                   |
| Requirement carries a source                      | `sourceUrl` and `lastCheckedAt` copied to the result           |

## Persistence

`apps/web/lib/eligibility.ts`'s `evaluateProgrammeForProfile`/`evaluateScholarshipForProfile` always compute
live, then write the result: a `MatchResult` row (outcome, `engineVersion`, `dataCompleteness`, summary) plus
one `MatchRequirementResult` row per requirement (status, evidence, source, `lastCheckedAt`), in a single
transaction. Every call appends a new row rather than overwriting — this is a history, not a cache; nothing
reads a persisted row instead of recomputing, and nothing prunes old rows yet. `MatchingRuleVersion` stays
unused: the engine has no versioned rule table to point `ruleVersionId` at, only `ENGINE_VERSION`'s semver
string, which is what gets stored instead.

## Known gaps

- `bestRecordedGrade` is exported from `packages/matching/src/index.ts` but no application code calls
  it.
- `QualificationEquivalence` is never read, so no conversion is applied anywhere, by design.
- Requirements that reference multiple qualification types are collapsed to one code per row by
  `programmeSnapshot`; the engine supports a list, the mapping does not produce one yet.
