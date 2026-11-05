# Legal review checklist

What exists in `apps/web/lib/legal.ts` is drafted to be honest about the system's actual behaviour, not
legal advice and not a compliance claim. This file lists what a qualified reviewer still has to decide before
public launch. Nothing below should be answered by guessing or by this codebase alone.

## Blocking — cannot launch publicly without these

1. **Operator identity and jurisdiction.** `/legal/terms` and `/legal/privacy` both state plainly that the
   controller's legal identity, postal address, and governing jurisdiction are not configured. Every other
   legal question below depends on knowing which country's (or countries') law applies.
2. **Lawful basis per purpose.** `docs/data-flow.md` lists every processing purpose; none has a reviewed
   lawful basis. In particular: is "acceptance of Terms" being used as a catch-all basis for processing that
   should instead rest on legitimate interest, contract necessity, or explicit consent? The current design
   records `TERMS` and `PRIVACY` acknowledgement at registration and nothing else — a reviewer needs to
   confirm that's sufficient, or specify which purposes need their own consent record.
3. **AI processing consent.** Sending a message, the recent thread, and optionally the academic summary to
   Gemini is gated by a per-message UI checkbox, not a recorded, versioned `ConsentRecord` the way `TERMS`
   and `PRIVACY` are. A reviewer needs to decide whether that's adequate or whether `AI_PROCESSING` (already
   in the `ConsentKind` enum, unused) needs to be written per the same pattern.
4. **International transfers.** Gemini, Frankfurter, and the hosting/database provider can all process data
   outside a given student's country. No transfer mechanism is documented anywhere because the operator and
   its providers' locations aren't fixed yet.
5. **Minors.** The platform has no age gate, no minimum-age check at registration, and no parental-consent
   flow. `dateOfBirth` is an optional profile field, not collected at signup. `/legal/ai` and the account
   page both state that a guardian "should" be involved for under-18 users — a reviewer needs to determine,
   per target market, whether that statement is sufficient or whether an actual age-verification or
   parental-consent mechanism is legally required (e.g. under COPPA-equivalent rules) before the product can
   be offered to that market at all.
6. **Backup retention and propagation.** `docs/privacy.md` and `/legal/data-retention` both say deletion
   does not currently reach backups, because backups aren't configured by the application. Before launch, the
   operator's actual backup provider and retention schedule need to be documented, and the privacy notice
   needs a true statement of how long a deleted account's data can persist in a backup.
7. **Cookie consent reading.** `docs/cookie-inventory.md` concludes that the single strictly-necessary
   session cookie likely doesn't require a consent banner under common ePrivacy-style frameworks. A reviewer
   needs to confirm this holds for every jurisdiction the operator intends to serve, since some frameworks
   define "strictly necessary" more narrowly than others.
8. **Sensitive data categories.** Financial need band and, in some jurisdictions, nationality or date of
   birth may qualify as a special/sensitive category requiring a stricter basis than ordinary personal data.
   A reviewer needs to classify each field collected in `StudentProfile` against the relevant regime.

## Needs review, not necessarily blocking

- Whether the Terms' liability-limitation language is enforceable in the operator's eventual jurisdiction,
  and whether it needs carve-outs the current draft doesn't have.
- Whether the open-source licence chosen for the codebase is compatible with every dataset the catalogue
  ends up sourcing from (see `docs/data-sources.md` for per-source licence notes as they're collected).
- Whether `/legal/disclaimer`'s "not an immigration adviser" framing is strong enough once the visa centre
  (Milestone 9) actually displays destination-specific content.
- Whether account export (`/api/account/export`) satisfies the specific portability format a given
  jurisdiction requires, beyond "machine-readable JSON."

## What this codebase already does correctly, for the reviewer's context

- No legal page invents an operator address, registration number, or jurisdiction — every blocker above is
  stated as a blocker in the page itself, not silently glossed over.
- No targeted advertising, no data sale, and no secondary use of academic/financial data exists in the code
  to review — there's nothing to carve an exception for.
- Consent, once given, is versioned (`ConsentRecord.version`) so a future Terms change doesn't silently
  retroact onto an old acceptance.
- Account deletion and export are both implemented and exercised by tests; a reviewer can check their actual
  behaviour against `apps/web/app/api/account/export/route.ts` and the deletion action rather than taking a
  description on faith.
