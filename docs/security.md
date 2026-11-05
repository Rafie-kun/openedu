# Security

What this build actually does, and what it still does not. `SECURITY.md` is the reporting policy; this
file is the engineering record. See `docs/threat-model.md` for the fuller threat-by-threat breakdown this
file's controls map onto.

## Threat model

Assets, most sensitive first: student profile data (date of birth, nationality, residence, financial need
band); academic records (qualifications, grades, predicted results, language scores); planning data
(applications, deadlines, fees, private notes, budgets); account data (email, password hash, sessions,
consents); and catalogue integrity, since a wrong requirement or deadline is a safety problem, not just a
data bug. Relevant attackers: another student trying to read or change someone else's records; an
automated client abusing registration or login; a stolen session token; anyone reaching a misconfigured
deployment.

Out of scope by construction: there is no payment flow and no file upload, so payment fraud and malicious
uploads have no surface. The assistant is a live prompt-injection surface, treated under its own heading
below.

## Authentication and passwords

`apps/web/lib/crypto.ts`:

- scrypt with `N=16384, r=8, p=1`, 64-byte derived key, 16-byte random salt.
- Stored as `scrypt$N$r$p$salt$key`, base64url. Parameters travel with the hash, so they can be raised
  later without invalidating existing passwords.
- Verification recomputes with the stored salt and compares with `timingSafeEqual`.
- Passwords are normalised to NFKC before hashing and are 10 to 200 characters
  (`packages/validation`).

There is no password reset flow and no email verification. `User.emailVerifiedAt` exists and is never
written.

## Sessions

`apps/web/lib/session.ts`:

- A 32-byte random token is generated per login. Only its SHA-256 hex digest is stored, in
  `Session.tokenHash`.
- The raw token is sent in the `openedu_session` cookie: `httpOnly`, `sameSite: "lax"`,
  `secure` when `NODE_ENV=production`, `path: "/"`, explicit expiry.
- Lifetime is 30 days from creation. `lastUsedAt` is refreshed at most once an hour.
- An expired session row is deleted when it is read. A deleted user (`User.deletedAt` set) is treated as
  signed out.
- Password change deletes every session for the user, then creates one new session for the current
  browser. Account deletion removes sessions by cascade.
- Login redirects through `safeInternalPath` (`packages/shared/src/format.ts`), which rejects absolute
  URLs, `//` prefixes, backslashes and newlines.

There is no rolling token rotation, no device binding beyond a stored user agent string, and no UI to
list and revoke individual sessions. The account page shows a count only.

## Authorisation

Every private read and write goes through `requireUser(...)` (or `getCurrentUser()` for the export
route) and is then scoped to the caller's `StudentProfile`:

- `apps/web/app/actions/profile.ts` resolves `profileIdForUser(user.id)` and updates by that id.
  Qualification deletes first look up the row with `where: { id, profileId }`.
- `apps/web/app/actions/workspace.ts` scopes application updates with `findFirst({ id, profileId })`
  and deletes with `deleteMany({ id, profileId })`.
- `apps/web/app/actions/budget.ts` gates every item operation behind `ownedPlanId(profileId, planId)`.
- Saving is keyed on `@@unique([profileId, targetKey])`, so a repeat save replaces rather than
  duplicates, and the key is always built from the caller's own profile.
- `apps/web/app/api/account/export/route.ts` reads only `user.id` and returns 401 otherwise.

`requireAdmin()` exists in `session.ts` and redirects non-editors away. Its only caller is
`apps/web/app/actions/admin.ts`, which resolves and rejects review items and promotes institution
candidates; no page renders those actions and no admin workspace exists. There is no path for an
administrator to read a student's records.

## Rate limiting and lockout

`apps/web/lib/rate-limit.ts` counts `RateLimitEvent` rows per bucket inside a window. The client IP comes
from `x-forwarded-for` (first value) or `x-real-ip`, hashed with `AUTH_SECRET` before it is used as a key.

| Action   | Limit                                                      |
| -------- | ---------------------------------------------------------- |
| Register | 5 per hour per IP, 3 per hour per email hash               |
| Login    | 20 per 15 minutes per IP, 10 per 15 minutes per email hash |

In addition, `User.failedLoginCount` increments on a wrong password, and 8 failures set `lockedUntil` to
15 minutes ahead. A successful login resets both.

Weaknesses, stated plainly: the IP header is trusted as sent, so a deployment that is not behind a proxy
which overwrites it can be spoofed. Counters live in the application's database, not a shared cache, so
two app instances do not share a budget. `RATE_LIMIT_DISABLED=true` turns the whole mechanism off; it
must never be set in production.

## Audit log

`apps/web/lib/audit.ts` writes to `AuditLog`: actor, action, entity type and id, optional JSON metadata,
and the same hashed IP. Failures are swallowed and logged so that an audit write cannot break a user
action.

Actions recorded today: `auth.register`, `auth.login`, `auth.login_failed`, `auth.password_changed`,
`account.delete`, `profile.update`, `qualification.create`, `qualification.delete`,
`application.create`, `budget.plan.create`, `budget.plan.delete`.

Account deletion writes its audit row with `actorId: null` before removing the user, and the schema uses
`onDelete: SetNull`, so the trail survives without identifying the person. No academic or financial
content is stored in audit metadata.

## Transport and browser hardening

`apps/web/next.config.ts` sets, on every path:

| Header                       | Value                                       |
| ---------------------------- | ------------------------------------------- |
| `X-Content-Type-Options`     | `nosniff`                                   |
| `X-Frame-Options`            | `DENY`                                      |
| `Referrer-Policy`            | `strict-origin-when-cross-origin`           |
| `Cross-Origin-Opener-Policy` | `same-origin`                               |
| `Permissions-Policy`         | camera, microphone and geolocation disabled |
| `Strict-Transport-Security`  | production only, 2 years, includeSubDomains |

`poweredByHeader` is off. There is no Content-Security-Policy yet.

External links in `packages/ui` and the pages use `rel="noopener noreferrer nofollow"`. React escapes
output by default; the code does not use `dangerouslySetInnerHTML` anywhere.

## Input validation

All form input passes a Zod schema from `packages/validation` before it reaches Prisma. Enumerations,
lengths and numeric ranges are bounded there (for example, application fee at most 1,000,000, subject
results at most 40, notes truncated to 4000 characters). Identifiers are checked to exist before being
written as foreign keys. Prisma parameterises all queries; the only raw SQL is the search query in
`apps/web/lib/search.ts`, which binds the query string with a tagged template.

## Secrets

- `.env` and `.env.*` are gitignored; `.env.example` holds placeholders only.
- `apps/web/lib/env.ts` validates the environment with Zod on first use and throws without echoing
  values.
- No secret is exposed to the browser: there is no `NEXT_PUBLIC_` variable anywhere and no server key is
  read in a client component.
- `api/health` and the account page report only whether AI and email are configured.
- Docker Compose requires `AUTH_SECRET` from the shell rather than defaulting it.

## File storage

Not implemented. `STORAGE_DRIVER` accepts `local` or `s3` and is validated, but no code writes or reads
files, `ApplicationDocument.storageKey` is never populated, and there is no upload endpoint. The account
page states this to the user.

When uploads land, the required controls are: content sniffing rather than trusting `mimeType` or the
extension, size limits before buffering, randomised storage keys, signed short-lived URLs, per-user
authorisation checks on every read, and no plaintext copy kept after processing.

## AI assistant

`api/assistant` is the only path that sends student-supplied text off the deployment. Controls:

- Authentication before any work, then a per-user limit of 20 messages per hour through `rateLimit`.
- The provider client is server-only; `GEMINI_API_KEY` is read in `lib/env.ts` and never reaches a
  client bundle. With no key the route returns 503 before touching a model.
- Retrieval is a parameterised Prisma query built from filtered keywords. No model output goes into
  SQL, and the model has no tools, no database client and no write path.
- The message body is capped at 2,000 characters by `assistantMessageSchema`.
- The system prompt treats catalogue text as data, and the UI warns against pasting identifiers.
  Prompt injection cannot escalate beyond producing a wrong sentence, because nothing downstream acts
  on model output.

Residual risks, accepted for now: a retrieved source record could contain hostile text and steer a
reply; answers are not evaluated against a benchmark; conversation retention has no automatic expiry.
None of these can change data or grant access.

## Not done yet

| Gap                          | Consequence today                                                                                                             |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Explicit CSRF tokens         | Writes rely on `SameSite=Lax` cookies and the framework's server-action handling; no token is issued or verified in this code |
| Content-Security-Policy      | No defence in depth against injected script                                                                                   |
| Email verification           | Any address can be registered; the column exists but is unused                                                                |
| Password reset               | No flow at all, so a forgotten password means a lost account                                                                  |
| 2FA                          | Not implemented                                                                                                               |
| Session management UI        | Cannot revoke one device; password change revokes all                                                                         |
| Trusted proxy configuration  | Rate limiting trusts `x-forwarded-for` blindly                                                                                |
| Encrypted uploads            | No uploads, so no control needed yet                                                                                          |
| Backup and restore procedure | Application does not manage backups                                                                                           |
| Dependency scanning in CI    | CI runs typecheck, tests, build and formatting only                                                                           |

## Review checklist for a new route or action

1. Does it call `requireUser` (or `getCurrentUser`), and does it handle the unauthenticated case before
   touching the database?
2. Is every query scoped by `profileId`, `userId`, or an ownership lookup on the specific row?
3. Is the input parsed by a schema in `packages/validation` rather than read field by field?
4. If it mutates several rows, is it inside `db.$transaction`?
5. Does it call `audit(...)` when it changes account, academic, application or budget state?
6. Does it leak anything in an error message: a hash, a token, a raw database error, another user's
   identifier?
7. If it returns a redirect, does the target pass through `safeInternalPath`?
8. If it renders user-supplied text, is it escaped (no `dangerouslySetInnerHTML`)?
9. Does it need a rate limit, and is the bucket key specific enough to be useful?
10. Is the claim it makes on screen true of the data behind it? An unverified record must not render as
    verified.
