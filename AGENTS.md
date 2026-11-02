# MASTER DEVELOPMENT PROMPT (OpenCode Edition) — GLOBAL UNIVERSITY, SCHOLARSHIP AND STUDENT APPLICATION PLATFORM

> **How to use this file in OpenCode**
> 1. Save this entire file as `AGENTS.md` in the project root. OpenCode auto-loads `AGENTS.md` as persistent project instructions on every session (it also reads an optional global `~/.config/opencode/AGENTS.md` — don't duplicate content there, keep personal/global preferences separate from this project spec).
> 2. Paste **Section 0** below into your first message to the agent (or just say "read AGENTS.md and start Phase 0") to kick off work.
> 3. Keep this file updated as the single source of truth — do not also paste the whole spec into chat on every session; that burns tokens for no benefit once it's in `AGENTS.md`.

---

# 0. OpenCode Session Bootstrap (read this first, every session)

You are running inside **OpenCode**, not a generic chat session. Before writing code:

1. Confirm you have read this `AGENTS.md` in full. If the project already has a different `AGENTS.md`, merge rather than overwrite — preserve any existing project-specific notes.
2. Check for `opencode.json` / `opencode.jsonc` at the project root. If it does not exist, create one with the permission, agent, and MCP configuration described in **Section 30** below. If it exists, extend it — do not blindly replace it.
3. Identify which **mode** you are running in (`primary` vs `subagent`). If you are a primary agent and the task has independent, boundable pieces (e.g. "build the qualification schema" and "build the scholarship schema" and "write ingestion tests"), delegate the independent pieces to subagents as defined in Section 30.3 instead of doing everything serially in one giant context.
4. Do not re-explain this entire spec to yourself in your own output. Reference section numbers (e.g. "per Section 7, matching engine") instead of restating requirements.
5. Proceed to **Section 28 (Initial Execution Instructions)** once bootstrap is confirmed.

---

# 1. Your role and overall objective

Act as a senior full-stack software engineer, software architect, database engineer, data engineer, UI/UX designer, security engineer, and technical product developer.

Your task is to build a complete, production-minded, open-source global university and scholarship platform. This is not a simple scholarship search website, a static university directory, or an AI chatbot wrapped in a frontend.

Build a genuinely useful platform that helps students worldwide understand their educational opportunities, find universities and scholarships, assess their eligibility, compare study destinations, plan their finances, and navigate applications.

The platform must support students from different countries, education systems, academic backgrounds, financial circumstances, and levels of academic achievement.

It must not be designed or branded as a Bangladesh-only platform. Bangladesh is one supported country among many. The product must be internationally neutral and useful to students regardless of nationality.

Use `Rafie-kun` as the GitHub owner attribution where appropriate. Do not make the product itself revolve around the developer's identity.

Most importantly, prioritise accuracy, transparency, accessibility, privacy, explainability, and long-term maintainability over superficial features.

Do not build a flashy interface that hides unreliable information. The quality of the underlying educational data and matching system is the platform's most important differentiator.

---

# 2. Product vision

Create a centralised global platform where a student can:

1. Create an account and establish an academic profile.
2. Enter their qualifications, subjects, grades, examination boards, and academic history.
3. Find universities and degree programmes across different countries.
4. Discover scholarships, financial aid, grants, and other funding opportunities.
5. Understand whether they meet the requirements of a programme or scholarship.
6. See exactly why an opportunity matches or does not match their circumstances.
7. Discover alternative educational pathways when their grades or circumstances do not meet conventional entry requirements.
8. Compare countries, universities, programmes, tuition fees, living costs, and other expenses.
9. Understand student visa requirements using current official government information.
10. Learn how to apply through university and centralised application systems.
11. Organise applications, deadlines, required documents, and progress.
12. Use an AI assistant to understand complex information and navigate the platform.
13. Receive relevant updates when opportunities, requirements, deadlines, or other information change.

The experience should feel like a complete educational planning workspace rather than a collection of unrelated tools.

## Core product principle

A student should never have to guess why a university, scholarship, or programme was recommended.

Every recommendation must have an understandable explanation, and every important factual claim should have a traceable source.

The platform must support students with excellent grades, average grades, low grades, incomplete qualifications, non-traditional qualifications, and limited financial resources.

Do not make students feel that their educational opportunities end because they do not have perfect grades.

---

# 3. Recommended starting technology stack

Use the following stack as the project's default architecture. Do not randomly change technologies or introduce unnecessary dependencies.

| Component            | Required choice             |
| --------------------- | --------------------------- |
| Main coding language | TypeScript                  |
| Data automation      | Python                      |
| Frontend             | Next.js + React             |
| Styling              | Tailwind CSS + custom CSS   |
| Backend              | Next.js APIs initially      |
| Database             | PostgreSQL                  |
| ORM                   | Prisma                      |
| Background jobs      | Python workers + Redis      |
| AI                    | Gemini API                  |
| Search                | PostgreSQL full-text search |
| File storage          | S3-compatible storage       |
| Monorepo              | pnpm + Turborepo            |
| Containers            | Docker                      |
| CI/CD                 | GitHub Actions              |
| TypeScript testing    | Vitest                      |
| End-to-end testing    | Playwright                  |
| Python testing        | pytest                      |

### Technology implementation rules

**TypeScript** — Use TypeScript throughout the frontend and Next.js backend. Use strict type checking (`strict: true` in `tsconfig.json`) and avoid `any` unless there is a documented technical reason (leave a one-line comment explaining why when you do).

**Next.js and React** — Use Next.js App Router and React. Prefer server components where appropriate and client components only when interactive behaviour requires them.

**Tailwind and custom CSS** — Use Tailwind for consistent layout and component styling. Use custom CSS for distinctive visual effects, backgrounds, pixel-inspired visuals, animations, and details that would be awkward to implement with utility classes alone.

**Next.js APIs** — Start with Next.js route handlers and server-side services for application APIs. Do not introduce a separate backend framework (Express, Fastify, NestJS, etc.) without a demonstrated need.

**PostgreSQL and Prisma** — Use PostgreSQL as the primary relational database and Prisma as the ORM. Use migrations, constraints, indexes, proper relationships, and transactions.

**Python and Redis** — Use Python workers for data ingestion, parsing, validation, normalisation, change detection, scheduled updates, and other background tasks. Use Redis for job queues and caching where appropriate. Do not duplicate the same business logic across Python and TypeScript without a clear reason — if a rule must exist in both (e.g. grade-scale validation), generate one from a shared schema (e.g. JSON Schema) rather than hand-maintaining two copies.

**Gemini API** — Use Gemini through a provider abstraction so that the application is not permanently dependent on a single AI vendor. The main platform must continue to function when AI is disabled, unavailable, or unconfigured.

**Search** — Start with PostgreSQL full-text search and appropriate indexes. Do not introduce Elasticsearch, OpenSearch, or another search service until actual scale or search requirements justify it.

**Storage** — Use an S3-compatible storage interface for user documents and other files. Make the storage provider configurable.

**Monorepo** — Use pnpm workspaces and Turborepo to organise the TypeScript applications and packages. Keep the Python worker organised within the same repository, with its own dependency management (`pyproject.toml`) and tests.

**Docker** — Provide Dockerfiles and Docker Compose configuration for local development and essential services.

**GitHub Actions** — Use GitHub Actions for automated testing, linting, type checking, build validation, security checks, and deployment workflows.

**Testing** — Use Vitest for unit and component tests, Playwright for end-to-end tests, and pytest for Python workers.

### Do not over-engineer

The project must be modular, but modularity does not mean introducing unnecessary microservices. Start with a well-structured monorepo and a modular application architecture. Split services only when there is a concrete reason.

### Language and tooling boundaries (explicit, for the agent)

- **Write in TypeScript**: all of `apps/web`, `apps/admin`, `packages/*` (UI, shared types, matching engine, validation).
- **Write in Python**: everything under `workers/data-ingestion` (source adapters, parsers, normalisers, schedulers, pytest suite).
- **Never** write application business logic in Bash/PowerShell beyond simple dev/setup scripts (`scripts/*.sh` / `scripts/*.ps1` for bootstrapping, migrations, seeding).
- **Never** introduce a second frontend framework, a second ORM, a second job queue, or a second AI provider SDK without first documenting why in `docs/architecture.md` (an ADR-style entry) and getting the change reviewed in a PR.
- **Update dependencies** only via `pnpm up --interactive` (TS) or `pip-compile`/`uv lock` (Python) in a dedicated PR, never as a drive-by change bundled into a feature PR. Run the full test suite after any dependency bump before merging.
- **Do not** auto-upgrade major framework versions (Next.js, Prisma, React major bumps) without a dedicated migration PR and a note in `docs/architecture.md`.

---

# 4. The five things to build first

These five foundations must be implemented and validated before spending significant development time on secondary features.

Build them in this order:

## Priority 1 — Authentication and student profiles
Implement secure registration, login, account management, onboarding, and student profiles. Users must be able to enter and update their academic and personal application information without repeatedly completing the same forms. The profile must support different education systems and qualification types.

## Priority 2 — Qualification and grade database
Build a structured qualification and grading system that can represent education systems across the world. This is essential because grades cannot be compared reliably without understanding the qualification, awarding body, grading scale, subject, examination session, and relevant entry requirements.

## Priority 3 — University and scholarship database
Establish the core global university, programme, and scholarship datasets. Build the data models, source tracking, official links, verification status, and administrative tools needed to maintain these datasets. Do not populate the database with invented institutions, fabricated scholarships, or guessed requirements.

## Priority 4 — Eligibility and matching engine
Build a deterministic, explainable matching engine using the student's actual qualifications and circumstances. The system must explain why an opportunity is relevant, what requirements are satisfied, what is missing, and what needs manual confirmation. Do not make the AI model responsible for determining eligibility.

## Priority 5 — Automatic data ingestion and verification
Build the automated data collection and updating pipeline. The platform must be capable of collecting information from permitted sources, detecting changes, validating records, preserving their origins, and flagging information that requires human review. The pipeline must not silently publish unverified or potentially incorrect information.

### Foundation-first development rule

Do not start by building the AI chatbot, decorative dashboards, elaborate visa pages, or advanced features before these five foundations are functional. The quality of the university and scholarship database, qualification models, and matching engine determines whether the platform is genuinely useful. Once the foundations work, build the application guidance, visa centre, budget planner, AI assistant, and additional features on top of them.

---

# 5. Platform structure and main sections

## A. Home and student dashboard

Create a personalised dashboard showing: academic profile completion; recommended universities; recommended degree programmes; matching scholarships; upcoming deadlines; saved opportunities; active applications; application progress; important profile gaps; new or changed opportunities; relevant notifications; recently viewed universities and scholarships.

The dashboard should be useful even when the user has not completed their entire profile. Clearly distinguish verified information, incomplete profile information, and recommendations that require further investigation.

## B. University explorer

Create a searchable global university directory. Users must be able to search and filter universities using: country; city or region; university name; subject area; degree level; programme name; public or private status; institution type; tuition range; language of instruction; admission requirements; available scholarships; international student support; application route; accreditation or recognition information.

University profile pages should contain: official institution name; alternative names; country and location; official website; institution type; available programmes; degree levels; tuition information; admission requirements; international application information; language requirements; application deadlines where available; scholarship opportunities; official application links; accreditation and recognition information; data source and last verification date.

Do not imply that a university is accredited or officially recognised without evidence from an authoritative source.

## C. Degree programme explorer

University-level information and programme-level information must be separate where appropriate. A university may have different entry requirements, tuition fees, language requirements, and deadlines across its programmes.

Allow users to explore: undergraduate degrees; foundation programmes; diplomas; associate degrees; postgraduate degrees; master's degrees; doctoral programmes; professional qualifications; transfer and progression pathways.

A programme should ideally contain: programme title; university; subject classification; degree type; study duration; delivery mode; location; entry qualifications; required subjects; grade requirements; English-language requirements; tuition and additional fees; application deadlines; official programme URL; data provenance and verification status.

## D. Scholarship and financial aid explorer

Create a global scholarship database. Include, where reliable and publicly available: government scholarships; university-funded scholarships; private scholarships; charitable and foundation grants; need-based financial aid; merit-based awards; subject-specific funding; research funding; international student funding; regional scholarships; country-specific scholarships.

Each scholarship should contain: official scholarship name; provider; country or eligible regions; eligibility criteria; eligible nationalities, where specified; academic requirements; qualification requirements; subject restrictions; age restrictions, when applicable; financial need requirements; degree levels; funding amount; funding coverage; application requirements; required documents; application process; opening date, where available; closing date; renewal conditions; duration of funding; official scholarship URL; data source; last checked date; verification status.

### Funding breakdown

Do not simply label a scholarship as fully funded or partially funded. Represent its components separately: tuition coverage; living stipend; accommodation; meals; health insurance; airfare; visa fees; travel allowance; books and study materials; research or other allowances.

If the scholarship does not specify a funding component, record it as unknown or unspecified rather than assuming it is included.

---

# 6. Global qualifications and grading system

This is one of the most important technical components.

Build a flexible qualification database capable of representing qualifications from different countries and examining bodies. Support, where applicable: Cambridge International AS and A Levels; Cambridge IGCSE and O Levels; Pearson Edexcel International GCSEs; Pearson Edexcel International A Levels; International Baccalaureate; AP examinations; SAT and ACT; national secondary school qualifications; national upper-secondary qualifications; BTEC and other vocational qualifications; foundation programmes; diplomas; associate degrees; other recognised international qualifications.

Do not treat the list as exhaustive. The architecture must allow new qualification systems to be added without redesigning the application.

### Qualification data requirements

A qualification record may need: qualification name; awarding organisation; country or region; qualification level; subject; grade; grade scale; minimum and maximum possible grades; examination session; qualification completion status; date awarded; official documentation; relevant equivalency reference; source and verification information.

### Academic profile requirements

Students must be able to: add multiple qualifications; add multiple subjects within a qualification; enter predicted grades; enter achieved grades; mark qualifications as in progress; record examination sessions; update grades later; record incomplete qualifications; add qualifications from different education systems; distinguish between official results and predicted grades.

Do not force every student into one universal GPA or percentage system.

### Qualification equivalencies

Never create arbitrary equivalencies between grading systems. Only provide conversions or equivalencies when supported by authoritative or clearly documented references. Preserve the original grades even when displaying a converted or approximate comparison.

Every equivalency must identify: original qualification; original grade; comparison or target system; equivalency methodology; source; reliability or limitation; date last checked.

Where a reliable equivalency does not exist, display the original qualification and direct the user to the university's own entry requirements. Do not pretend that every university evaluates qualifications identically.

---

# 7. Eligibility and matching engine

The matching engine is one of the most important features. Build it as a deterministic rules-based system using structured data. AI may explain the results in plain language, but it must not replace the underlying eligibility checks.

### Inputs

The matching system should consider: nationality; country of residence, where relevant; academic qualifications; subjects; achieved grades; predicted grades; qualification completion status; degree level; intended subject; desired study destination; financial circumstances, where voluntarily supplied and relevant; language qualifications; other explicit scholarship or admission requirements.

Only collect personal information when it is needed for a clear product purpose.

### Matching outcomes

**Eligible** — All recorded mandatory requirements appear to be satisfied based on currently available and sufficiently verified data. This is not a guarantee of admission or a scholarship award.

**Potentially eligible** — The student appears to meet the main requirements, but one or more conditions are unknown, incomplete, conditional, or need confirmation.

**Not currently eligible** — One or more mandatory requirements appear not to be met. Explain the relevant missing requirements and whether any alternative pathway may exist.

**Unverified** — The opportunity or one or more important requirements have insufficient, outdated, or conflicting source information. Do not present an unverified result as confirmed eligibility.

### Explainability

Every result should include: requirements met; requirements not met; information not supplied; conditions that require confirmation; source used for each requirement; last verification date; relevant official link; possible next steps.

Example: a student meets the required qualification level and subject prerequisites, but the university's language requirement has not been confirmed. The opportunity should be classified as potentially eligible, not fully eligible.

### Competitiveness versus eligibility

Keep these concepts separate. A student may meet the minimum requirements but still face a competitive selection process. Never invent an admission probability or scholarship success percentage. Do not imply that eligibility guarantees acceptance, funding, a visa, or any other outcome.

---

# 8. Pathways for students with lower grades or non-traditional backgrounds

This is a defining feature of the platform. Do not build a system that only recommends prestigious universities and scholarships to students with excellent grades. Students with lower grades must still receive realistic and useful guidance.

Where supported by actual institutional information, explore: foundation programmes; international foundation years; diploma pathways; pre-university programmes; community colleges; associate degrees; university transfer routes; credit transfer; alternative entry requirements; conditional admission; retaking examinations; resitting individual subjects; recognition of prior learning; vocational qualifications; mature-student admission; pathways from one institution to another.

For each suggested alternative, explain: what the pathway involves; what qualification it leads to; whether it provides progression to a degree; whether progression is guaranteed or conditional; relevant grade requirements; approximate costs, when verified; study duration; recognition limitations; official institutional sources.

Never suggest that a pathway guarantees admission to another university unless an official progression agreement confirms it. Do not shame students, exaggerate their opportunities, or make unsupported promises. The goal is to show realistic options and next steps rather than simply displaying a rejection.

---

# 9. Application guidance and application workspace

Create an application guidance centre that explains how to apply to universities in different countries. Cover centralised application systems and direct university applications where relevant, including: UCAS; Common App; Coalition for College; Uni-assist; OUAC; other national and regional application portals; direct university application systems.

Do not assume that every institution participates in a centralised platform.

### Application guides

Each guide should contain: what the application system is; who uses it; countries and institutions covered; registration instructions; required information; qualification and grade entry guidance; personal statement or essay guidance; reference requirements; document requirements; application fee information, where verified; important deadlines; official application URL; official help and support links.

Explain unfamiliar application terminology in accessible language. Do not copy copyrighted application guidance wholesale. Summarise it in original wording and link to official documentation.

### Application workspace

Allow students to manage their application process. Features should include: saved universities; saved programmes; saved scholarships; application tracker; application status; deadlines; required document checklist; personal notes; reference checklist; fee tracking; interview preparation resources; decision tracking; offer management; reminder notifications.

Possible statuses: interested; researching; preparing; ready to apply; submitted; awaiting decision; interview stage; offer received; rejected; withdrawn; enrolled.

Do not automatically submit applications, sign declarations, make payments, or impersonate applicants. The user must remain in control of their applications.

---

# 10. Global student visa and immigration centre

Build a destination-based student visa information centre. Support multiple destination countries rather than hardcoding one country's rules.

For each destination, provide structured information about: relevant student visa category; eligibility; required documents; financial evidence; tuition payment requirements; health insurance; English-language requirements, where relevant; medical or other official requirements; application fees; biometrics; processing information, when available; work restrictions; dependants, where applicable; visa duration; renewal and extension; post-study options, where officially documented.

### Visa source policy

Visa rules must come from official government or immigration sources. Prefer: government immigration departments; embassies and consulates; official government visa portals; official government legislation or policy publications. Do not use unofficial blogs as the authority for visa requirements.

### Visa data freshness

Every material visa requirement should have: official source URL; date collected; last verified date; last successful check; publication or effective date, when available; verification status; change history.

Clearly flag information that may have changed. Do not imply that the platform offers legal advice or guarantees a visa outcome. Direct users to the relevant government source for final confirmation.

---

# 11. International budget planner and cost comparison

Build an international student financial planning tool. Users should be able to estimate the cost of studying in different destinations.

Include: tuition fees; accommodation; food; transport; utilities; internet and mobile services; books and materials; insurance; visa fees; application fees; flights; personal expenses; other relevant costs. Allow users to customise their assumptions.

### Budget features

Include: monthly budget; annual budget; total programme cost; first-year cost; one-time expenses; estimated scholarship deductions; tuition deposits; currency conversions; cost comparisons between destinations; saving and affordability calculations.

Clearly distinguish university-published costs, official government estimates, third-party estimates, and user-entered estimates. Do not present estimated living costs as guaranteed expenses.

### Currency conversion

Use ISO 4217 currency codes. Begin with an appropriate documented exchange-rate source such as Frankfurter, subject to its terms and availability.

Display: original amount; original currency; converted amount; target currency; exchange-rate source; rate date; last updated timestamp.

Cache rates sensibly and handle unavailable services. Never imply that displayed conversion rates are guaranteed bank or payment-provider rates.

---

# 12. AI student assistant

Integrate a Gemini-powered assistant as an optional layer on top of the platform's verified data.

The assistant should help users: understand university requirements; understand scholarship eligibility; compare educational opportunities; understand unfamiliar qualifications; interpret application instructions; understand visa information; plan finances; find alternative pathways; navigate the platform; identify missing information; create application preparation checklists.

### AI architecture

Use an abstraction layer around the AI provider. Keep API calls server-side. Use retrieval-augmented generation where appropriate, retrieving relevant structured records and verified source material. The assistant must cite the relevant platform records and original sources.

### AI safety and accuracy

The AI must: never invent scholarships; never invent university requirements; never fabricate deadlines; never make up immigration rules; never claim that a student is eligible without referring to structured eligibility results; clearly distinguish verified facts from estimates and general guidance; admit when information is unavailable; recommend checking the original official source for important decisions.

The AI must not have unrestricted database access. Use controlled tools and server-side functions with explicit permissions. Never allow it to execute arbitrary SQL, access another user's private records, expose secrets, or bypass application permissions. Do not allow the AI to submit applications, make payments, sign documents, or perform other actions that legally or financially commit a student.

### AI availability

The platform must remain useful when Gemini is unavailable or no API key has been configured. Core search, profiles, eligibility calculations, saved opportunities, and other non-AI features must continue functioning.

---

# 13. Automatic data collection, updating and verification

This is a critical part of the product. Build a proper data ingestion and verification system rather than a collection of manually inserted records.

### Data pipeline

Use Python workers and scheduled background jobs. The pipeline should support: source discovery and registration; data fetching; parsing; schema validation; normalisation; deduplication; entity matching; change detection; source comparison; conflict detection; review and approval where required; publishing; logging; error recovery; scheduled rechecking.

### Source registry

Create a source registry that stores: source name; source organisation; source category; source URL; source type; access method; licence or usage terms; permission status; data fields provided; update frequency; last successful collection; last attempted collection; reliability classification; active or inactive status; known limitations.

### Data source categories

Investigate suitable authoritative or reputable sources, including:

**Universities and higher education institutions** — UNESCO World Higher Education Database (WHED), subject to its access conditions and licensing; official university websites; official institutional programme catalogues; national education ministries; national higher education authorities; national accreditation and recognition bodies; other licensed institutional datasets.

**Research and institutional identity** — Research Organization Registry (ROR); OpenAlex; other suitable open institutional or research datasets. Do not treat research database inclusion as proof of university accreditation.

**Scholarships** — Official government scholarship portals; official university scholarship pages; official foundation and funding-provider pages; other permitted and verifiable scholarship datasets.

**Immigration** — Official government immigration portals; government visa pages; official legislation and policy publications.

**Currencies** — A documented exchange-rate service such as Frankfurter, subject to API availability and terms.

Treat this list as a starting point for research, not a claim that every source provides a complete global database or unrestricted API access.

### Important source rules

Before integrating a source, verify: whether an API exists; whether public access is permitted; rate limits; attribution requirements; licensing restrictions; commercial-use restrictions; caching rules; redistribution rules; whether automated collection is allowed.

Do not bypass authentication, paywalls, anti-bot systems, access restrictions, or robots and contractual restrictions. Do not assume that information visible on a webpage is automatically licensed for bulk collection or redistribution. Prefer official APIs, downloadable datasets, permitted public feeds, and documented integrations. Where automated extraction is not permitted, use manual administration or an approved data import process.

### Verification and publication

Every important record must have provenance. Store: original source; source URL; collection timestamp; last checked timestamp; relevant publication or effective date; verification status; data version; change history.

Support statuses such as: verified; partially verified; pending review; conflicting sources; stale; unverified; archived.

When sources disagree, do not silently choose whichever value was collected most recently. Identify the conflict, retain the source history, and require appropriate review. Use confidence classifications only when the methodology is documented. Do not invent confidence percentages.

### Change detection

Detect changes to: scholarship deadlines; scholarship eligibility; funding amounts; university entry requirements; programme availability; tuition fees; visa requirements; application links; other important fields.

Keep previous versions so administrators can see what changed and when. Make the pipeline idempotent — running the same job repeatedly should not create duplicate records or unnecessary changes.

### Data update scheduling

Use configurable update schedules based on source type, importance, rate limits, and expected frequency of change. Prioritise deadline-sensitive and policy-sensitive records. Allow administrators to trigger a recheck manually. Include retry handling, backoff, rate-limit handling, timeouts, dead-letter or failed-job handling, job logs, and monitoring.

Do not describe a record as current merely because the ingestion service runs regularly. It must have a meaningful source check and verification status.

---

# 14. Database architecture

Use PostgreSQL with Prisma migrations. Design the database around clear domain boundaries and normalised relational records. At minimum, plan for the following entities and relationships.

**Identity and accounts** — User; Account; Session; UserPreference; ConsentRecord; Notification; AuditLog.

**Student profile** — StudentProfile; AcademicHistory; Qualification; QualificationType; AwardingBody; Subject; GradeScale; Grade; LanguageQualification; Country; NationalityRecord (where required and appropriate); FinancialPreference.

**Institutions and programmes** — University; UniversityAlias; Campus; Programme; ProgrammeSubject; DegreeType; AdmissionRequirement; LanguageRequirement; TuitionFee; InstitutionRecognition; InstitutionAccreditationRecord.

**Scholarships** — Scholarship; ScholarshipProvider; ScholarshipEligibilityRule; ScholarshipFundingComponent; ScholarshipDeadline; ScholarshipDocumentRequirement; ScholarshipApplicationMethod.

**Matching** — MatchResult; MatchRequirementResult; EligibilityEvaluation; MatchingRule; MatchingRuleVersion.

**Applications** — StudentApplication; ApplicationTask; ApplicationDocument; ApplicationDeadline; ApplicationNote; ApplicationStatusHistory.

**Data engineering** — DataSource; SourcePermission; IngestionJob; IngestionRun; SourceRecord; DataVersion; ChangeLog; VerificationRecord; ReviewQueueItem.

**Visa and financial data** — VisaCategory; VisaRequirement; VisaSource; CostEstimate; Currency; ExchangeRate; BudgetPlan.

**AI and platform operations** — AIConversation; AIMessage (subject to retention and privacy rules); AIUsageRecord; NotificationDelivery; FeatureFlag; SystemConfiguration.

### Database requirements

Use: foreign keys; unique constraints; appropriate indexes; transactions; safe migrations; consistent timestamps; soft deletion only where it is appropriate; explicit retention and deletion rules.

Avoid storing everything in a few enormous JSON columns. JSON can be used for genuinely variable source payloads or extensible data, but important entities and searchable fields should be structured. Separate public educational data from private student information.

---

# 15. Authentication, privacy and security

Security and privacy must be designed into the architecture from the beginning.

### Authentication

Provide: secure registration; secure login; password hashing using a modern password-hashing algorithm; secure session handling; logout; password reset; email verification where applicable; rate limiting; account deletion; authentication error handling.

Use a reputable authentication approach rather than implementing cryptographic authentication primitives yourself.

### Authorisation

Every private record must have server-side ownership and permission checks. A student must never be able to access another student's: profile; grades; financial information; uploaded documents; applications; private notes; AI conversations.

Do not rely on hiding frontend controls as an access-control mechanism.

### Public and private data separation

Public records include university and scholarship information intended for the public. Private records include student profiles, personal data, academic documents, financial information, applications, and private notes. Ensure that public data ingestion and administrative tools cannot accidentally expose private student information.

### Document protection

Use encrypted storage, restricted access, short-lived signed access URLs where appropriate, and strict authorisation checks. For highly sensitive uploaded files, consider client-side encryption with user-controlled keys where the product design supports it.

Be honest about the security model. If the server receives plaintext to process a document, do not claim that the server operator cannot access it. Do not send personal documents to AI providers without clear user consent and a documented purpose.

### Minor users

The platform may be used by students under the age of 18. Design onboarding, account handling, privacy, consent, and data processing with applicable child and teen privacy obligations in mind. Collect the minimum information necessary. Do not use sensitive student information for targeted advertising. Do not assume one age-of-consent rule applies worldwide. Build configurable controls and seek jurisdiction-specific legal advice before launch.

### Security controls

Follow established security guidance, including applicable OWASP application security practices. Address: SQL injection; cross-site scripting; cross-site request forgery; server-side request forgery; broken access control; insecure file uploads; session compromise; brute-force attacks; credential exposure; rate-limit abuse; dependency vulnerabilities; secrets leakage; unsafe redirects; logging of sensitive data.

Use secure headers, input validation, output encoding, safe file validation, secure cookies, and least-privilege service permissions. Add security tests for sensitive routes and ownership boundaries.

---

# 16. API keys and environment variables

**Never commit the Gemini API key or any other secret to the GitHub repository.** This is mandatory.

Use environment variables and keep local secret files out of version control.

Required rules:
- Add `.env` to `.gitignore`.
- Add `.env.local` and other applicable secret environment files to `.gitignore`.
- Provide `.env.example` with variable names and placeholder values only.
- Never commit real API keys.
- Never expose private API keys in browser-side code.
- Keep provider calls on the server.
- Validate required environment variables at startup.
- Provide helpful errors when optional integrations are not configured.
- Use deployment-provider secret management for production.
- Rotate any secret that is accidentally exposed.

Example environment configuration:

```env
DATABASE_URL=
REDIS_URL=

GEMINI_API_KEY=
AI_PROVIDER=gemini

S3_ENDPOINT=
S3_BUCKET=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=

AUTH_SECRET=
APP_URL=

# Optional integrations
EMAIL_PROVIDER_API_KEY=
```

Use only the variables actually required by the implementation. The `.env.example` file must never contain real credentials.

> **OpenCode note:** if you (the agent) need to read `.env` for debugging, remember OpenCode's default permission model requires explicit approval to read `.env` files — see Section 30.1. Never print secret values to chat/logs even once "allowed" to read the file.

---

# 17. Legal, consent and user rights

Create the necessary legal and transparency pages. At minimum: Terms of Service; Privacy Policy; Cookie Policy; Cookie Preferences; AI Usage Disclosure; Scholarship and Admission Disclaimer; Visa and Immigration Disclaimer; Data Retention Policy; Account Deletion and Data Export Information; Contact and Legal Enquiries.

These pages must accurately describe the actual system. Do not claim protections or capabilities that have not been implemented.

### Privacy principles

Implement: data minimisation; purpose limitation; retention limits; consent records where applicable; user access and correction workflows; account deletion; data export; secure handling of international data transfers; clear disclosures about third-party providers.

Assess applicable requirements such as GDPR, UK GDPR, relevant US state privacy laws, and children's privacy legislation where applicable. The exact obligations depend on the users, markets, processing activities, and legal circumstances. Do not present a generic privacy template as a guarantee of compliance.

### Cookies and analytics

Distinguish necessary, functional, analytics, and advertising cookies or similar technologies. Where consent is required, do not activate optional tracking before valid consent. Allow users to change their preferences. Do not include invasive advertising or user profiling by default.

### Legal review

Provide draft legal pages for review. Clearly document areas requiring qualified legal advice before public launch.

---

# 18. Administration and moderation dashboard

Build an administrative area for maintaining public platform data. Administrators should be able to: view university records; view programme records; review scholarship records; review data source status; inspect ingestion runs; see failed jobs; review conflicting information; approve pending records; correct inaccurate public information; archive outdated opportunities; trigger source rechecks; review data change history; manage controlled reference data; manage source integrations.

Use strict role-based access control. Administrator access to private student records must not be included by default. Where operational support requires access to sensitive information, implement a separately authorised, logged, and limited process with appropriate safeguards. Do not create an unrestricted admin interface that exposes every student's information.

---

# 19. Notifications and reminders

Create a notification system for important student and data events, e.g.: application deadlines approaching; scholarship deadlines approaching; saved scholarship requirements changed; university programme information changed; a new relevant opportunity is available; missing profile information affects matching; an application task is due; a saved record has become stale or unverified.

Support in-app notifications initially. Add email notifications through a configurable provider if needed. Allow users to configure notification preferences and frequency. Avoid sending excessive or misleading alerts.

---

# 20. Design direction and user experience

The interface should feel distinctive, polished, nostalgic, and atmospheric while remaining practical and accessible.

### Visual direction

Use an original visual identity inspired by nostalgic desktop interfaces, early internet aesthetics, pixel-art environments, and the atmospheric feel of games such as OMORI. Do not reproduce OMORI's exact interface, art, characters, assets, typography, maps, layouts, or other copyrighted material. Create an original design system that draws on broad visual inspiration without copying protected expression.

Possible design characteristics: muted and atmospheric colours; carefully selected pixel-inspired details; nostalgic desktop-window motifs; soft gradients and subtle textures; carefully controlled animations; original icons and illustrations; thoughtful typography; distinctive cards and panels; retro-inspired dashboard elements; modern spacing and readable layouts.

The visual style must not compromise readability or accessibility.

### UI requirements

Build a responsive experience for desktop, laptop, tablet, and mobile. Use consistent design tokens for colour, typography, spacing, borders, shadows, radii, components, and interactive states. Create reusable components. Use clear loading states, empty states, error states, success states, and confirmation flows. Never use decorative placeholders that look like genuine university or scholarship information. Avoid unnecessary visual clutter.

### Accessibility

Target WCAG 2.2 AA where practical. Include: keyboard navigation; semantic HTML; appropriate contrast; screen-reader labels; accessible forms; focus indicators; reduced-motion support; responsive text; accessible tables and interactive controls. Provide a practical reduced-motion experience.

---

# 21. Additional useful features

After the five foundations and essential platform flows are working, add these features in order of value and feasibility.

- **Global country directory** — education system overview; common qualification types; higher education structure; main application routes; general international student information; official government education links.
- **University comparison** — tuition, entry requirements, duration, location, application deadlines, language requirements, scholarship availability.
- **Scholarship comparison** — funding coverage, eligibility, deadlines, duration, renewal terms, application requirements.
- **Document checklist** — destination- and programme-specific, based on verified requirements.
- **Recognition and accreditation checker** — via relevant national authorities and official sources; no legal/professional recognition guarantees.
- **Application fee planner** — estimate costs of applying to multiple universities; distinguish verified fees from estimates.
- **Deadline calendar** — scholarship, university, and application deadlines; timezone-aware date handling.
- **Personal notes and saved searches** — save searches, filters, universities, scholarships, and notes.
- **Maps** — university locations and destination comparisons, where supported by reliable geographic data.
- **Offline-friendly experience** — frequently used guidance and selected non-sensitive information; never cache private documents or sensitive data insecurely.

---

# 22. Performance, reliability and maintainability

### Performance
Use server-side rendering where appropriate; pagination; database indexes; efficient query design; caching; background processing; image optimisation; lazy loading; sensible API response sizes. Avoid loading thousands of institutions or scholarships into the browser at once.

### Reliability
Implement structured logging; error monitoring; job monitoring; retry handling; health checks; database backups; restore procedures; graceful handling of external API failures; timeouts; rate limiting; appropriate service fallbacks.

### Observability
Track system health without unnecessarily collecting private user content. Monitor API failures, database performance, ingestion failures, failed source checks, queue length, job completion, stale data, AI service availability, notification delivery failures. Do not log secrets, passwords, access tokens, or unnecessary personal information.

### Documentation
Maintain documentation for architecture, database models, API routes, data sources, ingestion processes, matching rules, environment variables, local development, testing, deployment, security, and contribution guidelines.

---

# 23. Open-source requirements

The project must be structured so that other developers can contribute. Include: README; licence file; contribution guidelines; code of conduct; security policy; issue templates; pull request template; environment setup instructions; architecture documentation; data-source documentation; development scripts; Docker configuration; `.env.example`.

Do not assume that every data source or dataset can be redistributed just because the application is open source. Check the licence of each dependency and dataset. Keep third-party licences and attribution requirements documented. Never publish private user information, API keys, credentials, or production database dumps. Before selecting the project licence, document the trade-offs and confirm that it is compatible with the intended use of the code and its dependencies.

---

# 24. Suggested repository structure

Use pnpm and Turborepo for the TypeScript monorepo. A starting layout may look like this:

```text
global-education-platform/
│
├── apps/
│   ├── web/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── services/
│   │   └── styles/
│   │
│   └── admin/
│       ├── app/
│       ├── components/
│       └── features/
│
├── packages/
│   ├── ui/
│   ├── database/
│   ├── shared/
│   ├── validation/
│   ├── matching/
│   └── config/
│
├── workers/
│   └── data-ingestion/
│       ├── src/
│       │   ├── sources/
│       │   ├── parsers/
│       │   ├── normalizers/
│       │   ├── validators/
│       │   ├── matching/
│       │   ├── jobs/
│       │   └── monitoring/
│       ├── tests/
│       └── pyproject.toml
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── docs/
│   ├── architecture.md
│   ├── database.md
│   ├── data-sources.md
│   ├── matching-engine.md
│   ├── security.md
│   ├── privacy.md
│   └── development.md
│
├── scripts/
├── .github/
│   └── workflows/
├── .opencode/
│   └── agents/           # OpenCode subagent definitions, see Section 30.3
│
├── .env.example
├── .gitignore
├── docker-compose.yml
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── opencode.json         # OpenCode permissions / agents / MCP config, see Section 30
├── AGENTS.md             # this file
├── README.md
└── LICENSE
```

This is a proposed structure, not a requirement to create every directory immediately. Adapt it to the existing repository if a sound structure already exists. Do not create empty directories and placeholder files simply to imitate the diagram.

---

# 25. Testing and acceptance requirements

Every major feature must have meaningful tests.

**Authentication tests** — registration, login, logout, password reset, session expiry, protected routes, access control.

**Qualification tests** — multiple qualification systems represented without losing original grades or incorrectly converting between grading scales.

**Matching tests** — fully satisfied requirements; missing mandatory requirements; unknown requirements; conditional requirements; incomplete qualifications; predicted versus achieved grades; subject-specific requirements; nationality restrictions; conflicting source data; stale records. The matching engine must return explainable results with the relevant source and rule version.

**Data ingestion tests** — valid source records; invalid records; duplicate records; updated records; missing fields; conflicting values; failed requests; rate limits; retries; interrupted jobs; repeated ingestion; source removal or deactivation.

**Privacy and security tests** — one user cannot access another user's data; sensitive document access; authorisation; upload validation; secret handling; private API routes.

**UI and end-to-end tests** — the essential user journey: register → complete a student profile → enter qualifications and grades → search for universities → search for scholarships → view eligibility explanations → save an opportunity → create an application tracker entry → review a budget estimate → manage account privacy settings.

### Definition of done

A feature is not complete merely because it appears on the screen. It must include: working functionality; appropriate validation; error handling; loading and empty states; database integration where required; authorisation checks where required; tests; documentation when necessary.

Do not use fake success messages, non-functional buttons, or misleading demo content in production features.

---

# 26. Development roadmap

Follow this roadmap. Do not attempt to build every feature simultaneously.

**Phase 0 — Repository inspection and architecture.** Inspect the existing repository; identify the current framework and dependencies; review existing files and conventions; identify existing functionality worth preserving; check environment configuration; check database setup; identify incomplete or broken features; identify security and maintainability issues. Then create or update the architecture and development documentation. Do not delete working code or restructure the repository unnecessarily.

**Phase 1 — Project foundation.** Monorepo configuration; Next.js application; Tailwind and design foundation; PostgreSQL; Prisma; environment validation; Docker development configuration; initial CI workflows; basic tests; shared UI components.

**Phase 2 — Authentication and student profiles.** Registration and login; session management; profile onboarding; country and education preferences; academic history; student dashboard; account privacy settings.

**Phase 3 — Qualification and grade database.** Qualification types; awarding bodies; subjects; grade scales; academic records; predicted and achieved grades; qualification validation; documented equivalencies.

**Phase 4 — University and scholarship database.** University data models; programme data models; scholarship data models; source registry; verification metadata; official source links; search and filters; basic administration.

**Phase 5 — Eligibility and matching engine.** Structured requirements; deterministic eligibility evaluation; explainable match results; missing-information handling; alternative pathway recommendations; matching tests.

**Phase 6 — Automatic data ingestion.** Python workers; Redis job queue; source adapters; data parsing; normalisation; validation; deduplication; change detection; verification workflows; administrative review; logging and monitoring. Do not claim to have automated a source integration until it has been tested against the source's real access method and terms.

**Phase 7 — Application guidance and workspace.** Application guides; official portal links; document checklists; application tracker; deadline calendar; saved opportunities; notifications.

**Phase 8 — Visa centre and budget planner.** Country-specific visa information; official source tracking; visa updates; cost estimates; currency conversion; financial planning; destination comparison.

**Phase 9 — AI assistant.** Gemini provider integration; retrieval from verified platform records; citations; controlled tools; user consent; usage limits; error handling; AI privacy controls.

**Phase 10 — Final refinement and release.** Accessibility review; security review; performance optimisation; backup and recovery validation; documentation; open-source contribution setup; deployment configuration; end-to-end testing; production readiness review.

---

# 27. Coding-agent instructions: how to work efficiently in OpenCode

You are expected to implement the project, not just provide a plan. Do not return a long architecture report and stop.

### First action

Inspect the existing repository and understand what already exists. Do not ask the user to explain files that you can inspect yourself. After inspection, briefly report: existing stack; current repository structure; what is already implemented; what needs to change; any significant architectural issues. Then proceed with the first appropriate implementation phase.

### Implementation process

Work in small, testable increments. For each feature: identify its purpose → check the existing architecture → identify required data models and dependencies → implement the feature → add validation and security checks → add tests → run relevant checks → update documentation → summarise the actual changes.

Do not rewrite unrelated parts of the application. Do not replace working code simply because you prefer another approach. Do not build several incomplete versions of the same feature.

### Token and context efficiency (OpenCode-specific)

OpenCode does not have a magic "compaction" feature beyond standard context handling — the real levers are **delegation, scoping, and discipline**:

- **Use subagents for independent, boundable work.** Per Section 30.3, define subagents for: (a) data-ingestion source research/adapter-writing, (b) matching-engine rule design, (c) one-off large refactors or audits, (d) documentation generation. Running these as subagents keeps their exploration out of your primary context.
- **Scope MCP servers per-agent, not globally**, if/when you add any (Section 30.4) — each connected MCP server's tool list eats context on every turn even if unused.
- Maintain concise project documentation. Keep this `AGENTS.md` current with persistent development instructions.
- Maintain a current implementation status document (`docs/status.md`) and an architecture decision log (`docs/architecture.md`, ADR-style entries). Record important schema and API decisions there, not in chat.
- Read only relevant files when possible — use targeted search (grep/glob equivalents) instead of dumping entire directories or files you don't need.
- Avoid repeatedly printing entire source files back in your own output.
- Avoid repeatedly re-explaining the whole project to yourself — reference section numbers from this file instead of restating them.
- Use focused tool calls; batch independent read-only lookups together rather than serial round-trips.
- Keep one consistent source of truth for shared types and business rules (e.g. a single `packages/shared` for cross-cutting TypeScript types; a single JSON Schema if a rule must be mirrored into Python).
- Summarise completed work and outstanding issues at logical checkpoints (end of each Phase), updating `docs/status.md`.

Do not sacrifice correctness, security, testing, or documentation to save tokens — efficiency means not wasting tokens on restating/re-reading, not cutting corners on quality.

### Dependency discipline

Before adding a package: check whether an existing dependency already solves the problem; check whether the proposed package is maintained; check its licence; check its security status; avoid unnecessary dependencies. Do not introduce a new database, framework, service, or AI provider without a concrete reason (see also Section 3's language/tooling boundaries).

### Error handling

Do not hide failed commands or silently ignore errors. If a feature cannot be completed because an external service, API key, credential, or permission is unavailable: implement the safe underlying structure where possible; clearly identify the missing dependency; provide configuration instructions; do not fabricate successful integration results.

### Real implementation only

Never mark an unfinished feature as complete. Never replace a database integration with hardcoded fake data and claim it is working. Demo data must be clearly labelled and must never be mistaken for verified live records. Never invent source records, scholarship details, deadlines, university requirements, or immigration rules.

---

# 28. Initial execution instructions

Start now.

**Step 1:** Inspect the entire existing repository sufficiently to understand its current state. Preserve working functionality.

**Step 2:** Identify whether the existing stack matches the recommended stack (Section 3). Explain any necessary changes briefly.

**Step 3:** Establish the development documentation and architecture decisions, including: `AGENTS.md` (this file, already present); `docs/architecture.md`; `docs/development.md`; `docs/data-sources.md`; `docs/matching-engine.md`; `docs/security.md`; an implementation status document (`docs/status.md`). Use concise, maintainable documentation.

**Step 4:** Establish the monorepo, application foundation, database configuration, environment handling, `opencode.json` (Section 30), and automated checks as appropriate to the existing repository.

**Step 5:** Begin implementing the five foundational priorities in order (Section 4): (1) Authentication and student profiles; (2) Qualification and grade database; (3) University and scholarship database; (4) Eligibility and matching engine; (5) Automatic data ingestion and verification. Do not jump ahead to secondary features simply because they are more visually interesting.

**Step 6:** Test each foundation before building the next major layer.

**Step 7:** Continue through the roadmap (Section 26), maintaining a working application and updating the project documentation.

Do not require approval for every small implementation decision. Make reasonable engineering decisions consistent with this specification. Ask for user input only when an important decision genuinely requires information or access that cannot be obtained from the repository or available tools.

---

# 29. Final product standards

1. **Global by design** — serve students across countries and educational systems, not just one national audience.
2. **Accurate information** — important claims must be supported by traceable sources.
3. **Explainable matching** — students must understand why an opportunity matches their profile.
4. **Inclusive pathways** — students with lower grades or unconventional academic histories must receive realistic guidance.
5. **Privacy-first** — student profiles, grades, documents, applications, and financial information must be protected.
6. **Transparent data** — users must be able to see where important information came from and when it was last checked.
7. **Responsible automation** — data updates must respect source permissions, licensing, and verification requirements.
8. **AI as an assistant** — AI must improve usability without becoming an unreliable source of admissions, scholarship, or immigration decisions.
9. **Usable without AI** — the essential product must work without an AI API key.
10. **Accessible design** — the platform must work across devices and be designed for diverse users.
11. **Maintainable engineering** — the codebase must support future contributors and new data sources.
12. **Honest functionality** — do not claim that a feature, integration, database, or security control works until it has actually been implemented and tested.

## The most important success criterion

The project's success should not be measured by how many pages it has, how elaborate its animations are, or whether it includes a chatbot. It should be measured by whether a student can enter their actual qualifications and circumstances, discover relevant educational opportunities, understand their eligibility, identify what they need to improve or verify, and take a realistic next step.

**Build the infrastructure and data quality that make that possible.**

---

# 30. OpenCode configuration (`opencode.json`) — permissions, subagents, MCP, skills

This section tells the agent exactly how to configure OpenCode itself for this project. Create/maintain `opencode.json` at the repo root.

## 30.1 Permissions

Use an explicit allow/ask/deny policy. Default to `"ask"` for anything destructive or that touches secrets; allow routine, low-risk commands so you aren't interrupted constantly. **Rule evaluation order matters: the last matching rule wins**, so put broad defaults first and specific overrides after.

```json
{
  "$schema": "https://opencode.ai/config.json",
  "permission": {
    "*": "ask",
    "edit": "allow",
    "read": "allow",
    "glob": "allow",
    "grep": "allow",
    "webfetch": "ask",
    "bash": {
      "*": "ask",
      "git status": "allow",
      "git diff*": "allow",
      "git log*": "allow",
      "pnpm *": "allow",
      "npm run *": "allow",
      "python -m pytest*": "allow",
      "rm *": "deny",
      "git push*": "ask",
      "git reset --hard*": "deny"
    }
  }
}
```

Notes:
- Reading `.env` / `.env.local` should stay on `"ask"` (the default) — never widen this to `"allow"` globally; secrets must stay reviewed.
- Never set `bash: "allow"` wholesale. Enumerate the safe, repeated commands (test runners, linters, `git status`/`diff`/`log`, package-manager scripts) and leave everything else on `ask`, with explicit `deny` on destructive patterns (`rm -rf`, `git push --force`, `git reset --hard`).

## 30.2 `instructions` field

If you split documentation across multiple files beyond `AGENTS.md` (e.g. per-package `AGENTS.md` files in `apps/web/` or `workers/data-ingestion/`), register them so OpenCode loads them automatically:

```json
{
  "instructions": [
    "AGENTS.md",
    "apps/web/AGENTS.md",
    "workers/data-ingestion/AGENTS.md"
  ]
}
```

## 30.3 Subagents

Define subagents either as Markdown files under `.opencode/agents/<name>.md` (frontmatter = config, body = system prompt) or inline under an `agents` key in `opencode.json`. Use subagents for independent, boundable chunks of this project so their exploration/context stays isolated from your primary session. Suggested subagents for this project:

```
.opencode/agents/data-source-researcher.md   # researches a single data source's API/licence/terms before ingestion is built
.opencode/agents/matching-engine-writer.md   # implements/updates deterministic matching rules in packages/matching
.opencode/agents/ingestion-worker.md         # implements Python source adapters under workers/data-ingestion
.opencode/agents/doc-writer.md               # updates docs/*.md and AGENTS.md at phase checkpoints
```

Example `.opencode/agents/data-source-researcher.md`:

```markdown
---
description: Researches a single external data source (API availability, licence, rate limits, attribution rules) before any ingestion code is written. Never writes code — produces a findings note for docs/data-sources.md.
mode: subagent
model: anthropic/claude-sonnet-5
permission:
  webfetch: allow
  edit: deny
  bash: ask
---
You investigate one data source at a time per Section 13's "Important source rules" of AGENTS.md.
Output a structured note (API? public access? rate limits? licence? redistribution rules? automated collection allowed?) and append it to docs/data-sources.md. Never write ingestion code yourself — hand findings back to the primary agent.
```

A primary agent's own `permission.subagent` rules gate which subagents it is allowed to launch — keep that list scoped to the ones defined above rather than `"*"`.

## 30.4 MCP servers

Only add MCP servers you actually need, and scope them to the specific subagent that needs them rather than enabling them globally (every connected MCP server's tool list consumes context on every turn). Example shape if you add one later (e.g. a GitHub MCP server for issue management):

```json
{
  "mcp": {
    "github": {
      "type": "remote",
      "url": "https://mcp.github.com",
      "enabled": false
    }
  }
}
```

Leave `enabled: false` until actually needed for a task; turn on only for the session/agent that needs it.

## 30.5 Installing skills / plugins (OpenChamber and alternatives)

**OpenChamber** is a UI (desktop/web/VS Code) that runs *on top of* OpenCode — it is not itself a skill marketplace or package registry, and it requires OpenCode already installed. Do not expect it to be the mechanism that adds skills to this repo.

To actually install reusable skills/commands/plugins into this OpenCode project, use one of:

1. **The community skill installer** (adds entries directly to `opencode.json`/`.opencode/`):
   ```bash
   npx skills add <repo-url> --skill <skill-name>
   ```
   e.g. a plugin-installer skill:
   ```bash
   npx skills add https://github.com/igorwarzocha/opencode-workflows --skill plugin-installer
   ```
2. **npm-package plugins** declared in `opencode.json` and resolved on startup — check the plugin's own README for the exact config key it expects.
3. **Local plugin files** (`.js`/`.ts`) referenced from `opencode.json` for fully custom, repo-specific automation (e.g. a pre-commit check specific to this project's data-provenance rules).

Before installing any third-party skill/plugin: check its licence, check that it doesn't request broad `bash`/`webfetch` permissions it doesn't need, and read its source if it's small enough — do not install opaque plugins that would get wide tool permissions in a project that handles student PII.

Treat OpenCode's own docs as versioned and occasionally inconsistent between releases (legacy `opencode.ai/docs` vs newer `v2.opencode.ai` have disagreed on some config field names/defaults) — if a config key in this section doesn't validate against your installed OpenCode version, check `opencode --help` / the installed version's own schema (`$schema` URL in `opencode.json`) rather than assuming this document is wrong.
