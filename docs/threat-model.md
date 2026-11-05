# Threat model

Assets, most sensitive first: student profile data (date of birth, nationality, residence, financial need
band); academic records (qualifications, grades, predicted results, language scores); planning data
(applications, deadlines, fees, private notes, budgets, AI conversations); account data (email, password
hash, sessions, consents); catalogue integrity (a wrong requirement or deadline is a correctness problem with
real consequences, not just a data bug).

For each threat: likelihood and impact are judged against the current deployment shape (no uploads, no
payments, a single Next.js app over one Postgres instance); controls are what's actually in the code, checked
against the file named, not assumed from the design; remaining mitigation is what's still open.

## Account takeover

**Likelihood:** medium (credential stuffing against any public login is common). **Impact:** high — full
access to one student's academic and financial data.

Controls: scrypt password hashing (`apps/web/lib/crypto.ts`, N=16384/r=8/p=1, 64-byte key, 16-byte salt);
login rate limiting and lockout (`apps/web/lib/rate-limit.ts`); sessions are random 32-byte tokens, only
their hash stored (`apps/web/lib/session.ts`); no account-enumeration difference documented between "wrong
password" and "no such account" in the login path.

Remaining: no email verification, no password reset flow yet (Milestone 7) — an account with a typo'd email
has no recovery path and no way to prove the email is real. No MFA option.

## Password attacks

**Likelihood:** medium. **Impact:** high if successful. Controls: rate limiting on login and registration;
`PASSWORD_MIN`/`PASSWORD_MAX` enforced by `packages/validation`. Remaining: no breached-password check
(e.g. against a Pwned Passwords list); no password-strength meter beyond length.

## Session theft

**Likelihood:** low (requires XSS or physical device access, since the cookie is httpOnly). **Impact:**
high — a stolen token is a working session for 30 days. Controls: `httpOnly`, `SameSite=Lax`, `Secure` in
production, token hashed at rest so a database read alone doesn't yield a usable cookie. Remaining: no
single-session revocation UI ("sign out everywhere"); no session list on the account page; the cookie's fixed
30-day expiry isn't shortened by inactivity, so a stolen token stays valid for the full window regardless of
whether the real user is still active.

## Cross-user data access

**Likelihood:** low if every route is correct, but this is the single most consequential class of bug for
this product. **Impact:** high. Controls: every private page and server action calls `getCurrentUser()` or
`requireAdmin()` and scopes queries by the resolved `userId`/`profileId` — verified directly in
`apps/web/app/actions/*.ts` and the admin actions audited for Milestone 0, not assumed. Remaining: no
automated test asserts "user A's token cannot read user B's record" for every route; this exists only as
manual code-reading discipline today, which doesn't scale as routes are added (Milestone 10 should add this
as an explicit test category, per `docs/product-spec.md` section 25).

## Privilege escalation

**Likelihood:** low. **Impact:** high (full admin catalogue and review-queue control). Controls:
`role: "STUDENT" | "EDITOR" | "ADMIN"` on `User`, checked server-side by `requireAdmin()` before every admin
action — confirmed present on every action in `apps/web/app/actions/admin.ts` as of commit `3686392`.
Remaining: no audit of what `EDITOR` is actually permitted to do differently from `ADMIN` — the role exists
in the schema but `requireAdmin()`'s exact check needs re-confirming whenever a new admin route is added.

## Malicious or invalid uploads

**Likelihood/impact:** not applicable yet — no upload endpoint exists (`ApplicationDocument.storageKey` is
never populated). This becomes a live threat the moment Milestone 8 ships; see `docs/product-spec.md`
section 15 for the required controls (content sniffing, size limits, malware scanning, no public buckets)
before that work starts.

## SQL injection

**Likelihood:** low. **Impact:** would be critical. Controls: Prisma parameterises every query; the one raw
SQL in the codebase is the full-text search expression in `apps/web/lib/search.ts`, which interpolates no
user input into the SQL string — the search term is passed as a bound parameter to `websearch_to_tsquery`.

## XSS

**Likelihood:** low. **Impact:** could lead to session/account compromise. Controls: React escapes rendered
content by default; no `dangerouslySetInnerHTML` use found in `apps/web`. Remaining: no Content-Security-Policy
header is set in `apps/web/next.config.ts` — the existing security headers are `X-Content-Type-Options`,
`X-Frame-Options`, `Referrer-Policy`, `Cross-Origin-Opener-Policy`, `Permissions-Policy`, and HSTS in
production, but no `Content-Security-Policy`. A CSP would be defense-in-depth, not a fix for a known XSS, but
its absence is a real gap worth closing with a nonce-based policy rather than `unsafe-inline`.

## CSRF

**Likelihood:** low. **Impact:** could trigger an unwanted state change as a signed-in user. Controls: all
state-changing operations are Next.js Server Actions, which carry Next's built-in same-origin request
validation; `SameSite=Lax` on the session cookie additionally blocks the cookie from riding along on a
cross-site top-level navigation's POST. No separate custom CSRF token scheme exists, which is appropriate
given Server Actions already provide this protection — adding a redundant token system would not add real
protection.

## SSRF

**Likelihood/impact:** currently very low — the only server-side outbound requests to data the user
influences are: none. `sourceUrl` fields entered through the admin catalogue editors are stored and
displayed as links; nothing on the server ever fetches them. The only outbound fetches are to fixed,
hardcoded endpoints (Gemini's API, Frankfurter's API) that don't take a user-supplied URL. This should be
re-checked the moment any feature adds server-side fetching of a user-supplied URL (e.g. a future "preview
this source" admin tool).

## Prompt injection

**Likelihood:** medium — any text a retrieved catalogue row or a user message contains could try to steer the
model. **Impact:** low, by design. Controls: the assistant has no tools, no database client, and no write
path (`apps/web/lib/ai/index.ts`); the worst a successful injection can do is produce a wrong or misleading
sentence in a chat reply, which is still subject to the same "not a decision" framing as any AI output. The
deterministic matching engine, not the model, produces every eligibility result the assistant references.
Remaining: no evaluation set exists to measure how often this actually happens.

## Admin misuse

**Likelihood:** low (requires a compromised or malicious admin account). **Impact:** high for catalogue
integrity, low for private student data (admin tooling has no path into student records, by design —
confirmed by reading every `apps/web/app/admin/**` page, none of which query `StudentProfile` or its
relations). Controls: every catalogue mutation writes an `AuditLog` entry with actor, action, entity and
metadata. Remaining: no alerting on an unusual pattern of admin actions (e.g. mass archival in a short
window).

## Data-source poisoning

**Likelihood:** medium (any ingested source can publish bad data, intentionally or not). **Impact:** medium,
contained by design. Controls: the ingestion worker never writes directly to public catalogue tables — new
candidates always land in `ReviewQueueItem`/`SourceRecord` for human promotion (`workers/data-ingestion`,
confirmed against `docs/data-sources.md`). Remaining: no automated plausibility check (e.g. implausible grade
ranges, URLs outside the source's own domain) before a record reaches the review queue.

## API abuse

**Likelihood:** medium. **Impact:** low to medium (service degradation, inflated AI provider cost).
Controls: rate limiting via `apps/web/lib/rate-limit.ts` on login, registration, and the assistant endpoint
(20 messages/hour per user per `docs/security.md`). Remaining: **the rate limiter resolves the client's
identity from `X-Forwarded-For`/`X-Real-IP` with no trusted-proxy allowlist** (`apps/web/lib/rate-limit.ts`).
Any deployment not sitting behind a proxy that strips or overwrites client-supplied headers lets an attacker
set an arbitrary `X-Forwarded-For` value and get a fresh rate-limit bucket on every request — this needs a
documented trusted-proxy configuration (or switching to the platform's own verified client-IP mechanism)
before this protection can be relied on in production.

## Secrets exposure

**Likelihood:** low. **Impact:** high (API keys, `AUTH_SECRET`). Controls: `.env`/`.env.*` gitignored,
`.env.example` placeholder-only, `apps/web/lib/env.ts` validates and never echoes values, no `NEXT_PUBLIC_`
secret variable exists. Remaining: CI has no secret-scanning step (e.g. gitleaks/truffleHog) yet — see
`docs/security.md` for the full CI hardening list.

## Dependency and supply-chain attacks

**Likelihood:** medium (ambient risk for any npm/PyPI-based project). **Impact:** variable. Controls: lockfiles
committed (`pnpm-lock.yaml`, Python's dependency pins). Remaining: no automated dependency vulnerability
scan (`pnpm audit`/Dependabot/`pip-audit`) wired into CI yet.

## Backup exposure

**Likelihood/impact:** not assessable — backups aren't configured by the application; whatever the hosting
provider does is outside this codebase's control today. This is tracked as a launch blocker in
`docs/legal-review-checklist.md`, not resolved here.

## Accidental logging of private data

**Likelihood:** low today (little structured logging exists at all). **Impact:** would be high if it
happened. Controls: `console.error` calls found in the codebase log error objects and context labels, not
full request bodies or profile contents — spot-checked across `apps/web/app`. Remaining: no lint rule or test
actively prevents a future `console.log(user)`-style mistake; this is currently discipline, not enforcement.
