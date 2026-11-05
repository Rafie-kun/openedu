# Roadmap

The phase sequence from the original master spec, kept as the ordering reference. `docs/status.md` tracks
which phase is actually done, partial, or not started, and names the gap; this file only records the
intended order and scope so a session doesn't have to re-derive it. See also `docs/implementation-state.md`
for the live single-item "what's next".

**Phase 0 — Repository inspection and architecture.** Inspect the existing repository; identify the current
framework and dependencies; review existing files and conventions; identify existing functionality worth
preserving; check environment configuration and database setup; identify incomplete or broken features and
security/maintainability issues. Create or update the architecture and development documentation. Never
delete working code or restructure the repository unnecessarily.

**Phase 1 — Project foundation.** Monorepo configuration; Next.js application; Tailwind and design
foundation; PostgreSQL; Prisma; environment validation; Docker development configuration; initial CI
workflows; basic tests; shared UI components.

**Phase 2 — Authentication and student profiles.** Registration and login; session management; profile
onboarding; country and education preferences; academic history; student dashboard; account privacy
settings.

**Phase 3 — Qualification and grade database.** Qualification types; awarding bodies; subjects; grade
scales; academic records; predicted and achieved grades; qualification validation; documented
equivalencies.

**Phase 4 — University and scholarship database.** University, programme and scholarship data models;
source registry; verification metadata; official source links; search and filters; basic administration.

**Phase 5 — Eligibility and matching engine.** Structured requirements; deterministic eligibility
evaluation; explainable match results; missing-information handling; alternative pathway recommendations;
matching tests.

**Phase 6 — Automatic data ingestion.** Python workers; Redis job queue; source adapters; parsing;
normalisation; validation; deduplication; change detection; verification workflows; administrative review;
logging and monitoring. Never claim an integration is automated until it's been tested against the source's
real access method and terms.

**Phase 7 — Application guidance and workspace.** Application guides; official portal links; document
checklists; application tracker; deadline calendar; saved opportunities; notifications.

**Phase 8 — Visa centre and budget planner.** Country-specific visa information; official source tracking;
visa updates; cost estimates; currency conversion; financial planning; destination comparison.

**Phase 9 — AI assistant.** Gemini provider integration; retrieval from verified platform records;
citations; controlled tools; user consent; usage limits; error handling; AI privacy controls.

**Phase 10 — Final refinement and release.** Accessibility review; security review; performance
optimisation; backup and recovery validation; documentation; open-source contribution setup; deployment
configuration; end-to-end testing; production readiness review.

## Post-spec milestones (added once the phases above were substantially built)

These extend phase 4, 6, 8 and 10 with concrete, ordered work items rather than restating the phases:

- **M0 — Sourced catalogue child-record editors.** Done; see `docs/status.md`.
- **M1 — Documentation and token-efficiency reorganisation.** This pass: `AGENTS.md` trimmed,
  `docs/product-spec.md`, `docs/roadmap.md`, `docs/implementation-state.md` added.
- **M2 — Privacy, legal and security foundations.** Cookie inventory, data-flow mapping, threat model,
  legal-review checklist, and reconciling `apps/web/lib/legal.ts` with actual behaviour.
- **M3 — Real catalogue pilot.** A small, genuinely sourced set of programmes and scholarships across
  several countries, entered through the admin editors from M0. Requires explicit go-ahead before starting
  (data entry and sourcing decisions, not just code).
- **M4 — Persistent eligibility and rule versioning.** Write `MatchResult`/`MatchRequirementResult` instead
  of evaluating per request only.
- **M5 — Qualification coverage and verified equivalencies.** More qualification systems, with sourced
  equivalencies only.
- **M6 — Redis-backed ingestion and scheduling.** Replace the manual CLI with a scheduled queue.
- **M7 — Email, account lifecycle and notifications.** Verification, password reset, notification
  generation.
- **M8 — Secure document upload and storage.** Not started until the storage/security design is ready.
- **M9 — Visa centre and global country directory.** Build the user-facing and admin layer on the existing
  `VisaCategory`/`VisaRequirement`/`VisaSource` models.
- **M10 — Accessibility, testing, backups, production readiness.** Playwright suite, WCAG 2.2 AA pass,
  backup/restore procedure, CI hardening.
- **M11 — AI assistant quality.** Only after the catalogue (M3) has enough real data to retrieve against.
