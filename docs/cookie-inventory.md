# Cookie and storage inventory

Every cookie, browser storage mechanism, tracker, and third-party script actually present in `apps/web`, as
of commit `6bf47b6`. Checked by searching the whole `apps/web` tree for `localStorage`, `sessionStorage`,
`indexedDB`, analytics/ad SDK names (`gtag`, `google-analytics`, `posthog`, `mixpanel`, `segment`, `fbq`),
and any `Set-Cookie` beyond the session helper — none of those appeared anywhere except the one cookie below.

| Item                          | `openedu_session`                                                                                                                                                                         |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Category                      | Strictly necessary                                                                                                                                                                        |
| Purpose                       | Authenticate the signed-in session so private pages and server actions can identify the user                                                                                              |
| Provider                      | First-party (OpenEdu itself)                                                                                                                                                              |
| Contains personal information | A random token only. The token has no meaning outside this database; the user it maps to is looked up server-side from a hash, never read from the cookie's value                         |
| Duration                      | 30 days from sign-in, fixed at creation. Not extended by activity — `apps/web/lib/session.ts` sets `expires` once in `createSession` and never updates the cookie afterwards              |
| Essential                     | Yes — there is no non-cookie way to keep a user signed in across requests in this implementation                                                                                          |
| Prior consent required        | No, under the ePrivacy "strictly necessary" exemption used by most jurisdictions that regulate cookies — a legal reviewer should confirm this holds for every market the operator targets |
| Implemented                   | Yes                                                                                                                                                                                       | `apps/web/lib/session.ts:36` (`store.set`), deleted on sign-out at `apps/web/lib/session.ts:96` |
| Technical evidence            | `httpOnly: true`, `sameSite: "lax"`, `secure: true` in production, `path: "/"`, `expires` set to creation time + 30 days                                                                  |

## Everything else checked and not found

| Mechanism                                       | Present?                                                                             |
| ----------------------------------------------- | ------------------------------------------------------------------------------------ |
| `localStorage`                                  | No use anywhere in `apps/web`                                                        |
| `sessionStorage`                                | No use anywhere in `apps/web`                                                        |
| IndexedDB                                       | No use anywhere in `apps/web`                                                        |
| Service worker storage / offline cache          | No service worker registered                                                         |
| Tracking pixels                                 | None                                                                                 |
| Analytics (first- or third-party)               | None configured or coded                                                             |
| Advertising technology                          | None                                                                                 |
| Third-party scripts loaded in the page          | None — `next.config.ts` has no external script allowance beyond the app's own bundle |
| Embedded third-party content (iframes, widgets) | None                                                                                 |
| External SDKs that read or write device storage | None                                                                                 |

User-facing preferences (theme, locale, notification settings) are stored as columns on `UserPreference`
in PostgreSQL, scoped to the signed-in account, not in a cookie or browser storage — they require no consent
banner because they aren't on-device tracking.

## Consent banner decision

No optional cookie category exists. A consent banner for cookie categories is not implemented and, per the
current reading in `apps/web/lib/legal.ts` (`/legal/cookies`), is not required for a single strictly-necessary
authentication cookie in most frameworks a legal reviewer is likely to check — but this reading itself is a
launch blocker pending qualified review (see `docs/legal-review-checklist.md`).

If any future work adds an optional cookie, analytics tool, or advertising technology, a consent management
system must exist and be wired in **before** that script loads, covering: category explanations, necessary
cookies always on, optional categories off by default, a fair choice between accept and reject, granular
per-category toggles, saved and changeable preferences, a versioned and timestamped consent record (the
schema's `ConsentRecord`/`ConsentKind` already has the shape for this — `ANALYTICS` and `MARKETING` kinds
exist and are unused today), and the script must not run before that consent is recorded. This file must be
updated in the same change that adds the technology.
