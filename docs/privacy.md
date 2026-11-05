# Privacy

Where personal data lives, what it is for, how a student gets it out or deletes it, and what has not been
reviewed. No claim of compliance with any law is made here or by the application. See also
`docs/data-flow.md` for a purpose-by-purpose table, `docs/cookie-inventory.md` for the one cookie and
everything checked and not found, and `docs/legal-review-checklist.md` for what a qualified reviewer still
needs to decide.

## Data inventory

Tables holding personal data, from `packages/database/prisma/schema.prisma`.

| Table                                                                                  | Personal data                                                                            | Purpose                                   |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------- |
| `User`                                                                                 | email, display name, password hash, role, login counters, `deletedAt`                    | Account and sign-in                       |
| `Session`                                                                              | token hash, `ipHash`, user agent, timestamps                                             | Keep a signed-in browser signed in        |
| `UserPreference`                                                                       | locale, timezone, notification toggles, theme                                            | Remember settings                         |
| `ConsentRecord`                                                                        | consent kind, granted flag, document version, `ipHash`                                   | Evidence of what was accepted and when    |
| `AuditLog`                                                                             | actor id (nullable), action, entity, optional metadata, `ipHash`                         | Security trail                            |
| `RateLimitEvent`                                                                       | bucket key only (a hash of an IP or email)                                               | Abuse prevention                          |
| `StudentProfile`                                                                       | display name, date of birth, residence, nationality, intended study, financial need band | Matching and planning                     |
| `StudentPreferredDestination`                                                          | country choices with priority                                                            | Recommendations                           |
| `StudentQualification`                                                                 | qualification, awarding body, scale, status, session, overall grade, notes               | Eligibility checks                        |
| `QualificationSubjectResult`                                                           | subject, grade label and rank, achieved/predicted                                        | Subject and grade requirements            |
| `LanguageQualification`                                                                | test code, score, test and expiry dates                                                  | Language requirements                     |
| `StudentApplication`, `ApplicationTask`, `ApplicationNote`, `ApplicationStatusHistory` | tracker entries, deadlines, fees, private notes                                          | Application workspace                     |
| `ApplicationDocument`                                                                  | label, file name, MIME type, size                                                        | Placeholder; no file is stored            |
| `SavedOpportunity`                                                                     | saved target and note                                                                    | Saved list                                |
| `BudgetPlan`, `BudgetItem`                                                             | plan title, destination, cost lines, amounts                                             | Financial planning                        |
| `MatchResult`, `MatchRequirementResult`                                                | evaluation output and per-requirement evidence                                           | Would store results; no rows are written  |
| `Notification`, `NotificationDelivery`                                                 | in-app messages, read state, delivery attempts                                           | Notifications; nothing generates them yet |
| `AIConversation`, `AIMessage`, `AIUsageRecord`                                         | message content, citations, token counts                                                 | Reserved; unused and empty                |

Public catalogue tables (`University`, `Programme`, `Scholarship`, `Country`, `GradeScale`, and the rest)
contain no personal data. `VerificationRecord.checkedById`, `DataVersion.createdById` and
`ReviewQueueItem.assignedToId` reference staff accounts, not students, and stay null while no admin
exists.

## What is deliberately not collected

No passport, national ID or visa document numbers. No payment or card data. No uploaded files. No
advertising identifiers, no third-party analytics, no tracking pixels. No raw IP address: only a salted
SHA-256 hash, and only on sessions, consents and audit entries.

## Purpose and retention intent

| Data                         | Intent                                           | What the code does today                                                    |
| ---------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------- |
| Profile and academic records | Provide the workspace and run eligibility checks | Kept until the account is deleted                                           |
| Sessions                     | Authenticate                                     | Expire 30 days after creation; the row is deleted when read after expiry    |
| Rate-limit counters          | Throttle abuse                                   | Rows older than 24 hours are deleted opportunistically on about 2% of calls |
| Consents                     | Record which document version was accepted       | Kept with the account                                                       |
| Audit entries                | Keep a security trail                            | Kept indefinitely; not covered by any retention job                         |
| Notifications                | Inform the student                               | No retention job; nothing creates them yet                                  |
| AI conversations             | Let you review an earlier answer                 | Stored with your profile, included in export, deleted with the account      |

There is no scheduled deletion job for any table. Anything described as short-lived depends on the code
paths above, not on a scheduler.

## Export

`apps/web/app/api/account/export/route.ts`, reached from the account page as "Download my data". Returns
a JSON attachment named `openedu-export-YYYY-MM-DD.json` with `cache-control: no-store`.

Contents: account fields, the full profile tree (destinations, qualifications with subject results,
language tests, saved opportunities, applications with tasks, notes, document metadata and status
history, budget plans with items, match results), notifications, preferences, consent records, and
session metadata (created, last used, expiry, user agent).

Explicitly excluded and labelled in the payload: password hash, session token hashes, rate-limit
counters, audit log entries.

## Deletion

`deleteAccountAction` in `apps/web/app/actions/profile.ts` requires the current password and the literal
string `DELETE`, writes an audit row with no actor, then calls `db.user.delete`.

Cascade rules in the schema remove the profile, qualifications, subject results, language tests,
destinations, saved items, applications and their children, budget plans and items, match results,
notifications, preferences, consents and sessions. `AuditLog.actorId` and `VerificationRecord.checkedById`
are set to null instead of deleted.

Two things to be precise about:

- This is a hard delete. `User.deletedAt` exists in the schema and is checked when reading a session, but
  no code path sets it, and there is no soft-delete window or recovery.
- Backup copies, if an operator keeps any, are not managed by the application. Deletion reaches them only
  on whatever rotation the operator runs, which is not configured here.

## AI disclosure and consent

The assistant is optional and only active when `GEMINI_API_KEY` is set by the operator. `getAiProvider()`
returns `null` otherwise, `api/assistant` answers 503, and `/assistant` renders a read-only notice.

What a request sends: the message, the last ten messages of the thread, and up to ten catalogue rows
selected by keyword. The student's academic summary is sent only when `includeProfile` is true for that
request, which the UI leaves unticked. Documents are never read, and the model has no tool that can query
the database or write anything.

`ConsentKind.AI_PROCESSING` exists so consent can be recorded per purpose; no record of that kind is
written today, because the per-message checkbox is the control actually in force. That gap is deliberate
and should be closed before a public launch that markets the assistant.

The published position, in `apps/web/lib/legal.ts` under `/legal/ai`, is that the assistant may explain
results but may not decide eligibility, invent requirements, submit anything, or see another student's
records.

Consent records that do exist: `TERMS` and `PRIVACY`, written at registration with version
`2026-11-02` (the constant `CONSENT_VERSION` in `apps/web/app/actions/auth.ts`). Registration is refused
unless both boxes are ticked, which the schema enforces with `z.literal(true)`.

## Minors

The platform expects secondary-school students, so some users will be under 18.

- Date of birth is optional, only requested on the profile form, and used for age requirements.
- There is no age gate at registration and no parental consent or verification mechanism.
- The terms and privacy notice say a user below the age of majority should involve a parent or guardian.
  That is a statement, not a control.
- No student data is used for advertising, and no advertising or analytics code is present.
- Age-of-consent rules differ by jurisdiction and are not implemented per country.

Before launch this needs a decision, not just a paragraph: either an age gate with a parental path, or a
documented position on why the service is safe for teenagers without one.

## Published documents

Drafts live in `apps/web/lib/legal.ts` and render at `/legal/[slug]`: terms, privacy, cookies, AI,
disclaimer, data-retention, contact. They are dated 2 November 2026 and describe what the code does,
including the gaps (`/legal/terms` says the operator entity and jurisdiction are unset). They are not
legal advice and have not been reviewed.

## Still requires legal review

- Controller identity, contact address, and any required representative.
- Lawful basis for each processing purpose, and whether consent is the right basis for any of them.
- International transfers: hosting, database, email and AI providers are all operator choices.
- Retention periods, including audit entries and backups, and whether indefinite retention is justified.
- Age of consent and child-safety obligations in the target markets.
- Data processing agreements with every processor actually used.
- Whether the export and deletion flows satisfy access, portability and erasure requirements in the
  jurisdictions the operator serves.
- Cookie classification: one strictly necessary cookie today, so no consent banner is implemented.
