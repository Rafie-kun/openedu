# Database

PostgreSQL and Prisma. The schema is `packages/database/prisma/schema.prisma`; migrations are under
`packages/database/prisma/migrations`. The generated client is written to
`packages/database/src/generated/prisma` and re-exported as `db` from `packages/database/src/index.ts`.

Seventy models, grouped below. Enum types are declared at the top of the schema.

## Domain groups

### Identity and accounts (6)

`User` holds the account, password hash, role, login counters and `deletedAt`. `Session` holds an opaque
token hash with expiry, hashed IP and user agent. `UserPreference` holds locale, timezone, notification
toggles and theme. `ConsentRecord` records which consent kind was granted or withdrawn and against which
document version. `AuditLog` records security-relevant actions. `RateLimitEvent` is one row per
rate-limited attempt, keyed by bucket.

### Geography (1)

`Country`: ISO alpha-2 and alpha-3 codes, name, region, optional education summary and official education
URL, plus verification columns.

### Qualifications and grading (7)

| Model                       | Purpose                                                                                                  |
| --------------------------- | -------------------------------------------------------------------------------------------------------- |
| `QualificationType`         | A qualification, its level, optional country and default scale                                           |
| `AwardingBody`              | Exam board or awarding organisation                                                                      |
| `QualificationAwardingBody` | Join table, composite primary key                                                                        |
| `GradeScale`                | A named grading system and its kind (letter, numeric, percentage, points, descriptive)                   |
| `GradeBand`                 | One label within a scale, with an integer `rank` used for comparison                                     |
| `QualificationEquivalence`  | Documented conversion between two scale labels, with methodology and source. No rows, never read by code |
| `Subject`                   | Subject code, name and subject area                                                                      |

### Student profile (5)

| Model                         | Purpose                                                                                  |
| ----------------------------- | ---------------------------------------------------------------------------------------- |
| `StudentProfile`              | One per user: date of birth, residence, nationality, intended study, financial need band |
| `StudentPreferredDestination` | Country choices with a priority, composite primary key                                   |
| `StudentQualification`        | A qualification the student holds or is studying, with status, session and overall grade |
| `QualificationSubjectResult`  | Per-subject grade with `ACHIEVED`, `PREDICTED` or `ESTIMATED`                            |
| `LanguageQualification`       | Test code, score string, test date and expiry                                            |

### Institutions and programmes (12)

`University`, `UniversityAlias`, `Campus`, `DegreeType`, `Programme`, `ProgrammeSubject`,
`ProgrammeDeadline`, `TuitionFee`, `AdmissionRequirement`, `LanguageRequirement`,
`InstitutionRecognition`, `ProgrammePathway`.

`University` holds the public identity and a slug; `Programme` holds degree level, duration, delivery
mode, official URL and tuition summary; `AdmissionRequirement` holds kind, label, optional
qualification/subject/grade scale and a minimum grade, with `isMandatory`; `ProgrammePathway` records
foundation, diploma and transfer routes including `progressionGuaranteed` (nullable, never assumed).

### Scholarships and funding (7)

`ScholarshipProvider`, `Scholarship`, `ScholarshipEligibilityRule`, `ScholarshipFundingComponent`,
`ScholarshipDeadline`, `ScholarshipDocumentRequirement`, `ScholarshipApplicationMethod`.

Funding is recorded per component (`TUITION`, `STIPEND`, `ACCOMMODATION`, and so on) with a
`CoverageType` and `isSpecified`, so "fully funded" never has to be stored as a single boolean.
`ScholarshipFundingComponent` carries its own `sourceUrl`, `verificationStatus` and `lastCheckedAt`
(migration `20261107000000_scholarship_funding_evidence`) — each funding figure is independently
sourced and verifiable, the same as every other child record, not inherited from the parent scholarship.

### Matching (3)

| Model                    | Purpose                                                      |
| ------------------------ | ------------------------------------------------------------ |
| `MatchingRuleVersion`    | Versioned rule set (`rulesJson`, `effectiveFrom`); no rows   |
| `MatchResult`            | Outcome, engine version, completeness, optional rule version |
| `MatchRequirementResult` | Per-requirement status, evidence, source URL and check date  |

`lib/eligibility.ts` writes a `MatchResult` row and its `MatchRequirementResult` children on every
evaluation, in addition to computing it live and returning it to the caller — see `docs/matching-engine.md`.

### Applications and saved items (6)

`StudentApplication`, `ApplicationTask`, `ApplicationDocument`, `ApplicationNote`,
`ApplicationStatusHistory`, `SavedOpportunity`.

A saved item is unique per `(profileId, targetKey)` where `targetKey` is `KIND:id`. Documents are
metadata only: `storageKey` is never populated.

### Data engineering and provenance (8)

`DataSource`, `IngestionJob`, `IngestionRun`, `SourceRecord`, `DataVersion`, `ChangeLog`,
`VerificationRecord`, `ReviewQueueItem`.

`SourceRecord` is unique per `(dataSourceId, externalId)` and stores a payload, a content hash and a
version. `DataVersion` is unique per `(entityType, entityId, version)` and stores a JSON snapshot.
`ChangeLog` records one field change at a time with a review status.

### Visa, money and budgets (8)

`VisaCategory`, `VisaRequirement`, `VisaSource`, `Currency`, `ExchangeRate`, `CostEstimate`,
`BudgetPlan`, `BudgetItem`.

`VisaCategory` is unique per `(countryId, code)`. `ExchangeRate` is unique per
`(baseCurrencyId, quoteCurrencyId, rateDate, sourceName)` and is written by
`apps/web/lib/exchange-rates.ts` from Frankfurter. `CostEstimate.basis` distinguishes
university-published, government, third-party and user-entered figures.

### AI and platform operations (7)

`AIConversation`, `AIMessage`, `AIUsageRecord`, `Notification`, `NotificationDelivery`, `FeatureFlag`,
`SystemConfiguration`.

`AIConversation` and `AIMessage` are written by `api/assistant`; `AIMessage.citations` stores the
retrieved record list as JSON. `AIUsageRecord` gets one row per provider call. Nothing creates
notifications yet.

## Key invariants

**Unique.** `User.email`, `Session.tokenHash`, `Country.iso2`, `Country.iso3`, `QualificationType.code`,
`AwardingBody.code`, `GradeScale.code`, `Subject.code`, `DegreeType.code`, `University.slug`,
`Programme.slug`, `ScholarshipProvider.slug`, `Scholarship.slug`, `Currency.code`, `DataSource.code`,
`MatchingRuleVersion.version`, `FeatureFlag.key`, `SystemConfiguration.key`, `UserPreference.userId`,
`StudentProfile.userId`.

**Composite unique.** `GradeBand (gradeScaleId, label)` and `(gradeScaleId, rank)`;
`QualificationEquivalence (sourceScaleId, sourceGradeLabel, targetScaleId, targetGradeLabel)`;
`QualificationSubjectResult (studentQualificationId, subjectId, kind)` — one achieved and one predicted
grade per subject; `ScholarshipFundingComponent (scholarshipId, component)`;
`SavedOpportunity (profileId, targetKey)`; `SourceRecord (dataSourceId, externalId)`;
`DataVersion (entityType, entityId, version)`; `ExchangeRate (base, quote, rateDate, sourceName)`;
`VisaCategory (countryId, code)`; `Notification (userId, dedupeKey)`.

**Composite primary keys.** `QualificationAwardingBody`, `StudentPreferredDestination`,
`ProgrammeSubject`.

**Delete behaviour.** Everything that belongs to a student cascades from `User` or `StudentProfile`.
Catalogue rows cascade into their requirement, fee, deadline and funding children. Reference rows
(`Country`, `QualificationType`, `GradeScale`, `Subject`, `AwardingBody`, `DegreeType`) use `SetNull`, so
deleting a reference never silently deletes an institution. `AuditLog.actorId`,
`VerificationRecord.checkedById`, `DataVersion.createdById` and `ReviewQueueItem.assignedToId` use
`SetNull`.

**Soft delete.** Only two forms exist: `User.deletedAt` (checked when a session is read, never set by any
code path) and `VerificationStatus.ARCHIVED` for withdrawn catalogue rows, which public queries filter
out. Nothing else is soft-deleted.

**Indexes.** Foreign keys are indexed throughout. Notable extras: `University(countryId)`, `(name)`,
`(verificationStatus)`; `Scholarship(providerId)`, `(verificationStatus)`, `(name)`;
`ProgrammeDeadline(closesAt)`; `ScholarshipDeadline(closesAt)`; `StudentApplication(deadline)`;
`MatchResult(profileId, generatedAt)`; `AuditLog(entityType, entityId)` and `(actorId, createdAt)`;
`RateLimitEvent(bucketKey, createdAt)`; `ChangeLog(reviewStatus)`; `ReviewQueueItem(status, priority)`.

## Provenance columns

Public catalogue rows carry three explicit columns:

| Column               | Type                 | Meaning                                                                                              |
| -------------------- | -------------------- | ---------------------------------------------------------------------------------------------------- |
| `verificationStatus` | `VerificationStatus` | `UNVERIFIED`, `PARTIALLY_VERIFIED`, `PENDING_REVIEW`, `VERIFIED`, `CONFLICTING`, `STALE`, `ARCHIVED` |
| `sourceUrl`          | `String?`            | The page or document the value came from                                                             |
| `lastCheckedAt`      | `DateTime?`          | When a human or job last checked it                                                                  |

These appear on `Country`, `QualificationType`, `AwardingBody`, `GradeScale`, `University`, `Programme`,
`ProgrammeDeadline`, `TuitionFee`, `AdmissionRequirement`, `LanguageRequirement`,
`InstitutionRecognition`, `ProgrammePathway`, `Scholarship`, `ScholarshipProvider`,
`ScholarshipEligibilityRule`, `ScholarshipDeadline`, `VisaCategory`, `VisaRequirement`, `CostEstimate`.
`VisaSource` is the exception: it records a URL, publisher, `retrievedAt` and a status, with no
`lastCheckedAt`.

Two columns that the specification mentions do not exist on the rows themselves: there is no `sourceId`
foreign key on catalogue tables, and no per-row `dataVersion` counter. Provenance beyond URL and check
date is held in the side tables: `SourceRecord` for what a source said, `DataVersion` for snapshots,
`ChangeLog` for field-level history, `VerificationRecord` for who verified what.

Student-entered records also use `verificationStatus` (`StudentQualification`, `LanguageQualification`,
`ApplicationDocument`), defaulting to `UNVERIFIED` because the platform has not seen the certificate.
The matching engine ignores that field for student data; it only applies provenance rules to the
opportunity's requirements.

## Migrations

```bash
pnpm db:generate    # prisma generate
pnpm db:migrate     # prisma migrate dev --schema prisma/schema.prisma (against the root .env)
pnpm db:deploy      # prisma migrate deploy, production and CI
```

Provider is `postgresql` (`migration_lock.toml`). Two migrations exist:

| Migration                                | Contents                                                                                               |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `20261102152645_init`                    | All enums and tables                                                                                   |
| `20261103093000_university_search_index` | `University_search_idx`, a GIN index on `to_tsvector('simple', ...)` over name, official name and city |

The GIN index expression must stay byte-identical to the query in `apps/web/lib/search.ts`, or Postgres
will not use it. Any change to one requires a migration and a matching edit in the other.

CI applies migrations with `pnpm db:deploy` against a PostgreSQL 17 service, then runs `pnpm db:seed`
twice to prove the seed is idempotent.

## Seeded reference data

`packages/database/prisma/seed.ts`, run with `pnpm db:seed`. Every write is an `upsert`:

| Table               | Rows | Notes                                                                                           |
| ------------------- | ---: | ----------------------------------------------------------------------------------------------- |
| `Country`           |  198 | Every ISO 3166-1 country, ISO codes, names and regions only. No education-system or visa claims |
| `GradeScale`        |    7 | Cambridge A Level, Cambridge IGCSE, IB DP, AP 1-5, WASSCE, Bangladesh HSC GPA, percentage       |
| `GradeBand`         |   51 | Labels and ranks per scale; ranks are what the engine compares                                  |
| `QualificationType` |    9 | Cambridge A Level and IGCSE, Edexcel IAL and IGCSE, IB DP, AP, WASSCE, Bangladesh HSC, CBSE XII |
| `AwardingBody`      |    6 | Cambridge International, Pearson Edexcel, IB, College Board, WAEC, CBSE                         |
| `Subject`           |   22 | Mathematics through Environmental Science, each with a subject area                             |
| `DegreeType`        |   14 | BA, BSc, BEng, BBA, LLB, MA, MSc, MBA, LLM, PhD, foundation, diploma, associate, certificate    |
| `Currency`          |   40 | ISO 4217 codes, names, symbols, minor units. No rates                                           |
| `DataSource`        |    4 | ROR, OpenAlex, WHED, Frankfurter                                                                |
| `University`        |   12 | Real institutions in GB, CH, NL, CA, US, SG, AU, DE, JP, BD                                     |

The seed writes no programmes, scholarships, deadlines, fees, requirements, visa records, cost
estimates, exchange rates or matching rules. Seeded catalogue rows are `UNVERIFIED` with
`lastCheckedAt` set to the seed run time, and all four data sources are `permissionStatus: "PENDING"`
with `isActive: false`.
