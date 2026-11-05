# Product specification

The full requirements for OpenEdu. `AGENTS.md` keeps only the rules a session needs on every turn and
points here for everything else. `docs/status.md` says what of this is actually built; this file says
what the product is supposed to be. Section numbers below correspond to the original master spec section
numbers for continuity in old notes.

## 2. Product vision

Create a centralised global platform where a student can:

1. Create an account and establish an academic profile.
2. Enter their qualifications, subjects, grades, examination boards, and academic history.
3. Find universities and degree programmes across different countries.
4. Discover scholarships, financial aid, grants, and other funding opportunities.
5. Understand whether they meet the requirements of a programme or scholarship.
6. See exactly why an opportunity matches or does not match their circumstances.
7. Discover alternative educational pathways when their grades or circumstances do not meet conventional
   entry requirements.
8. Compare countries, universities, programmes, tuition fees, living costs, and other expenses.
9. Understand student visa requirements using current official government information.
10. Learn how to apply through university and centralised application systems.
11. Organise applications, deadlines, required documents, and progress.
12. Use an AI assistant to understand complex information and navigate the platform.
13. Receive relevant updates when opportunities, requirements, deadlines, or other information change.

The experience should feel like a complete educational planning workspace rather than a collection of
unrelated tools.

### Core product principle

A student should never have to guess why a university, scholarship, or programme was recommended. Every
recommendation must have an understandable explanation, and every important factual claim should have a
traceable source. The platform must support students with excellent grades, average grades, low grades,
incomplete qualifications, non-traditional qualifications, and limited financial resources. Do not make
students feel that their educational opportunities end because they do not have perfect grades.

Do not build a Bangladesh-only platform. Bangladesh is one supported country among many. The product must
be internationally neutral and useful to students regardless of nationality.

## 4. The five foundations, in order

1. **Authentication and student profiles** — registration, login, account management, onboarding, and a
   profile that supports different education systems and qualification types without repeated data entry.
2. **Qualification and grade database** — a structured qualification and grading system that represents
   education systems worldwide, since grades cannot be compared reliably without knowing the qualification,
   awarding body, grading scale, subject, examination session, and entry requirements involved.
3. **University and scholarship database** — the core global datasets, with data models, source tracking,
   official links, verification status, and administrative tools. Never populate it with invented
   institutions, fabricated scholarships, or guessed requirements.
4. **Eligibility and matching engine** — deterministic, explainable, using the student's actual
   qualifications and circumstances. Explains what is met, what is missing, what needs confirmation. AI is
   never responsible for determining eligibility.
5. **Automatic data ingestion and verification** — collects from permitted sources, detects changes,
   validates records, preserves provenance, and flags anything needing human review. Never silently
   publishes unverified or potentially incorrect information.

Do not build the AI chatbot, decorative dashboards, elaborate visa pages, or advanced features before these
five foundations are functional.

## 5. Platform structure

**Home and student dashboard** — profile completion; recommended universities, programmes and
scholarships; upcoming deadlines; saved opportunities; active applications and progress; profile gaps; new
or changed opportunities; notifications; recently viewed records. Useful even with an incomplete profile;
clearly distinguish verified information, incomplete profile information, and recommendations needing
further investigation.

**University explorer** — searchable by country, city, name, subject area, degree level, programme name,
public/private status, institution type, tuition range, language of instruction, admission requirements,
available scholarships, international student support, application route, accreditation. A profile page
needs: official name and aliases, country and location, official website, institution type, programmes,
degree levels, tuition, admission requirements, international application information, language
requirements, deadlines where available, scholarships, official application links, accreditation
information, source and last verification date. Never imply accreditation or recognition without evidence
from an authoritative source.

**Degree programme explorer** — university-level and programme-level information stay separate where
requirements, fees or deadlines differ per programme. Covers undergraduate, foundation, diploma, associate,
postgraduate, master's, doctoral, professional qualifications, and transfer/progression pathways. A
programme record: title, university, subject classification, degree type, duration, delivery mode,
location, entry qualifications, required subjects, grade requirements, language requirements, tuition and
fees, deadlines, official URL, provenance and verification status.

**Scholarship and financial aid explorer** — government, university-funded, private, charitable, need-based,
merit-based, subject-specific, research, international-student and regional/country-specific funding. A
record needs: official name, provider, eligible countries/regions, eligibility criteria (nationality,
academic, qualification, subject, age, financial need), degree levels, funding amount and coverage,
application requirements and documents, process, opening/closing dates, renewal conditions, funding
duration, official URL, source, last checked date, verification status.

_Funding breakdown_ — never label a scholarship simply "fully" or "partially" funded. Represent components
separately: tuition, stipend, accommodation, meals, health insurance, airfare, visa fees, travel allowance,
books, research or other allowances. An unspecified component stays unknown, never assumed included.

## 6. Global qualifications and grading

One of the most important technical components. Support, without treating the list as exhaustive: Cambridge
AS/A Levels and IGCSE/O Levels, Pearson Edexcel International GCSEs and A Levels, IB, AP, SAT/ACT, national
secondary and upper-secondary qualifications, BTEC and other vocational qualifications, foundation
programmes, diplomas, associate degrees, and other recognised international qualifications. The architecture
must allow adding a new qualification system without redesigning the application.

A qualification record may need: name, awarding organisation, country/region, level, subject, grade, grade
scale, min/max possible grades, examination session, completion status, date awarded, official
documentation, relevant equivalency reference, source and verification information.

Student profile requirements: add multiple qualifications and subjects; enter predicted and achieved grades;
mark in progress; record sessions; update grades later; record incomplete qualifications; mix education
systems; distinguish official results from predicted grades. Never force one universal GPA or percentage
system.

**Qualification equivalencies** — never create arbitrary equivalencies between grading systems. Only
convert when supported by authoritative or clearly documented references, and always preserve the original
grade alongside any converted comparison. An equivalency record needs: original qualification and grade,
comparison/target system, methodology, source, reliability or limitation, date last checked. Where no
reliable equivalency exists, show the original qualification and point to the university's own entry
requirements — do not pretend every university evaluates qualifications identically.

## 7. Eligibility and matching engine

Deterministic, rules-based, using structured data. AI may explain results in plain language but never
replaces the underlying checks.

**Inputs** — nationality; country of residence where relevant; qualifications, subjects, achieved and
predicted grades, completion status; degree level; intended subject; desired destination; financial
circumstances where voluntarily supplied and relevant; language qualifications; other explicit admission or
scholarship requirements. Only collect what a clear product purpose needs.

**Outcomes**:

- _Eligible_ — all recorded mandatory requirements appear satisfied from currently available, sufficiently
  verified data. Not a guarantee of admission or an award.
- _Potentially eligible_ — main requirements appear met, but one or more conditions are unknown, incomplete,
  conditional, or need confirmation.
- _Not currently eligible_ — one or more mandatory requirements appear unmet; explain what's missing and any
  alternative pathway.
- _Unverified_ — the opportunity or an important requirement has insufficient, outdated, or conflicting
  source information; never present this as confirmed eligibility.

**Explainability** — every result needs: requirements met, requirements not met, information not supplied,
conditions needing confirmation, source per requirement, last verification date, relevant official link,
possible next steps.

**Competitiveness vs. eligibility** — keep separate. Meeting minimum requirements does not mean the
selection process isn't competitive. Never invent an admission probability or scholarship success
percentage, and never imply eligibility guarantees acceptance, funding, a visa, or any other outcome.

## 8. Pathways for lower grades or non-traditional backgrounds

A defining feature. Do not build a system that only recommends prestigious options to students with
excellent grades. Where supported by actual institutional information, explore: foundation and pre-university
programmes, diploma pathways, community colleges, associate degrees, university transfer routes, credit
transfer, alternative/conditional entry, retakes and resits, recognition of prior learning, vocational
qualifications, mature-student admission, inter-institution pathways.

For each suggested alternative explain: what it involves, what qualification it leads to, whether it
progresses to a degree and whether that progression is guaranteed or conditional, relevant grade
requirements, approximate verified costs, study duration, recognition limitations, official sources. Never
suggest a pathway guarantees admission elsewhere unless an official progression agreement confirms it. Show
realistic options and next steps, not a rejection dressed up as advice.

## 9. Application guidance and workspace

Cover centralised application systems (UCAS, Common App, Coalition for College, Uni-assist, OUAC, other
national/regional portals) and direct university applications; never assume every institution participates
in a centralised platform. A guide needs: what the system is, who uses it, countries/institutions covered,
registration steps, required information, grade-entry guidance, personal statement/essay guidance, reference
requirements, document requirements, verified fee information, deadlines, official application and support
links. Summarise application terminology in original wording; never copy copyrighted guidance wholesale.

**Workspace** — saved universities/programmes/scholarships; application tracker; status; deadlines; document
checklist; personal notes; reference checklist; fee tracking; interview preparation resources; decision and
offer tracking; reminders. Statuses: interested, researching, preparing, ready to apply, submitted, awaiting
decision, interview, offer received, rejected, withdrawn, enrolled. Never auto-submit applications, sign
declarations, make payments, or impersonate applicants — the user stays in control.

## 10. Global student visa and immigration centre

Destination-based, supporting multiple countries rather than one hardcoded set of rules. Per destination:
relevant visa category, eligibility, required documents, financial evidence, tuition payment requirements,
health insurance, language requirements where relevant, medical/other official requirements, fees,
biometrics, processing information when available, work restrictions, dependants where applicable, duration,
renewal/extension, post-study options where officially documented.

**Source policy** — rules come from government immigration departments, embassies/consulates, official
government visa portals, official legislation/policy publications. Never use an unofficial blog as the
authority for a requirement.

**Freshness** — every material requirement needs: official source URL, date collected, last verified date,
last successful check, publication/effective date when available, verification status, change history.
Flag information that may have changed. The platform is not legal advice and does not guarantee a visa
outcome — always point to the relevant government source for final confirmation.

## 11. International budget planner and cost comparison

Covers tuition, accommodation, food, transport, utilities, internet/mobile, books and materials, insurance,
visa fees, application fees, flights, personal expenses, other costs the user can customise. Features:
monthly and annual budget, total programme cost, first-year cost, one-time expenses, estimated scholarship
deductions, tuition deposits, currency conversion, destination comparison, affordability calculations.
Clearly distinguish university-published costs, official government estimates, third-party estimates, and
user-entered estimates — never present estimated living costs as guaranteed.

**Currency conversion** — ISO 4217 codes; begin with a documented exchange-rate source such as Frankfurter,
subject to its terms. Show original amount and currency, converted amount and currency, source, rate date,
last updated timestamp. Cache sensibly, handle an unavailable service, and never imply a displayed rate is a
guaranteed bank or payment-provider rate.

## 12. AI student assistant

A Gemini-powered assistant, optional, layered on top of verified data. Helps users understand requirements,
compare opportunities, interpret unfamiliar qualifications and application instructions, understand visa
information, plan finances, find alternative pathways, navigate the platform, spot missing information, and
build preparation checklists.

**Architecture** — a provider abstraction, server-side calls only, retrieval-augmented generation against
relevant structured records and verified source material, with citations to platform records and original
sources.

**Safety and accuracy** — never invent scholarships, requirements, deadlines, or immigration rules; never
claim eligibility without referring to the structured eligibility result; clearly distinguish verified facts
from estimates and general guidance; admit when information is unavailable; recommend checking the official
source for important decisions. No unrestricted database access — controlled tools and server-side functions
with explicit permissions only; never arbitrary SQL, another user's private records, secrets, or a bypass of
application permissions; never let it submit applications, make payments, sign documents, or otherwise
legally or financially commit a student.

**Availability** — the platform must stay useful with Gemini unavailable or unconfigured. Search, profiles,
eligibility, saved opportunities, and other non-AI features keep working.

## 13. Automatic data collection, updating and verification

Python workers and scheduled jobs, not manually inserted records. Pipeline stages: source discovery and
registration, fetching, parsing, schema validation, normalisation, deduplication, entity matching, change
detection, source comparison, conflict detection, review/approval where required, publishing, logging, error
recovery, scheduled rechecking.

**Source registry** — name, organisation, category, URL, source type, access method, licence/usage terms,
permission status, data fields provided, update frequency, last successful/attempted collection, reliability
classification, active/inactive status, known limitations.

**Source categories to research** — universities (WHED subject to licensing, official university sites and
catalogues, education ministries, accreditation bodies), research/institutional identity (ROR, OpenAlex —
never treated as proof of accreditation), scholarships (official government/university/foundation pages),
immigration (official government portals and legislation), currencies (a documented service such as
Frankfurter).

**Before integrating a source**, verify: API existence, public access permission, rate limits, attribution
requirements, licensing and commercial-use restrictions, caching and redistribution rules, whether automated
collection is allowed. Never bypass authentication, paywalls, anti-bot systems, or contractual/robots
restrictions. Visible-on-a-webpage does not mean licensed for bulk collection or redistribution. Prefer
official APIs, downloadable datasets, and permitted feeds; use manual administration where automated
extraction isn't permitted.

**Verification and publication** — every important record needs: original source, source URL, collection
timestamp, last checked timestamp, relevant publication/effective date, verification status, data version,
change history. Statuses: verified, partially verified, pending review, conflicting sources, stale,
unverified, archived. When sources disagree, do not silently prefer the most recent value — identify the
conflict, retain history, require review. Only use confidence classifications with a documented methodology;
never invent confidence percentages.

**Change detection** — track changes to scholarship deadlines and eligibility, funding amounts, entry
requirements, programme availability, tuition, visa requirements, application links, and other important
fields. Keep previous versions. Make the pipeline idempotent.

**Scheduling** — configurable by source type, importance, rate limits, and expected change frequency;
prioritise deadline- and policy-sensitive records; allow manual admin recheck; retry/backoff, rate-limit
handling, timeouts, dead-letter handling, job logs, monitoring. A record is not "current" merely because the
ingestion service runs on a schedule — it needs an actual, meaningful check and verification status.

## 15. Authentication, privacy and security requirements

Design security and privacy in from the start. (Actual implementation and current gaps:
[`docs/security.md`](security.md) and [`docs/privacy.md`](privacy.md).)

- **Authentication** — secure registration and login, modern password hashing, secure sessions, logout,
  password reset, email verification where applicable, rate limiting, account deletion, authentication error
  handling. Use a reputable approach rather than implementing cryptographic primitives from scratch.
- **Authorisation** — every private record needs server-side ownership and permission checks. A student must
  never reach another student's profile, grades, financial information, documents, applications, private
  notes, or AI conversations. Never rely on hiding a frontend control as an access-control mechanism.
- **Public/private separation** — public catalogue data and private student data must stay separate enough
  that ingestion or admin tooling cannot accidentally expose private information.
- **Document protection** — encrypted storage, restricted access, short-lived signed URLs where appropriate,
  strict authorisation checks; consider client-side encryption with user-controlled keys where the design
  supports it. Be honest about the security model: if the server receives plaintext to process a document,
  do not claim the operator can't access it. Never send personal documents to an AI provider without clear
  consent and a documented purpose.
- **Minor users** — the platform may be used by under-18s. Design onboarding, consent and processing with
  applicable child/teen privacy obligations in mind; collect the minimum necessary; never use sensitive
  student information for targeted advertising; do not assume one global age-of-consent rule; seek
  jurisdiction-specific legal advice before launch.
- **Security controls** — address SQL injection, XSS, CSRF, SSRF, broken access control, insecure uploads,
  session compromise, brute force, credential exposure, rate-limit abuse, dependency vulnerabilities, secrets
  leakage, unsafe redirects, logging of sensitive data. Use secure headers, input validation, output
  encoding, safe file validation, secure cookies, least-privilege service permissions, and security tests for
  sensitive routes and ownership boundaries.

## 17. Legal, consent and user rights requirements

At minimum: Terms of Service, Privacy Policy, Cookie Policy, Cookie Preferences, AI Usage Disclosure,
Scholarship and Admission Disclaimer, Visa and Immigration Disclaimer, Data Retention Policy, Account
Deletion and Data Export information, Contact and Legal Enquiries. These must accurately describe the actual
system — never claim a protection or capability that doesn't exist. (Current state, launch blockers, and the
actual pages: [`docs/privacy.md`](privacy.md), [`docs/legal-review-checklist.md`](legal-review-checklist.md).)

Implement data minimisation, purpose limitation, retention limits, consent records where applicable, access
and correction workflows, account deletion, data export, secure handling of international transfers, and
clear third-party-provider disclosures. Assess applicable requirements (GDPR, UK GDPR, relevant US state
laws, children's privacy legislation) rather than presenting a generic template as a compliance guarantee.

Distinguish necessary, functional, analytics and advertising cookies/technologies. Never activate optional
tracking before valid consent where consent is required; let users change preferences; no invasive
advertising or profiling by default. Provide draft legal pages for review and clearly document what needs
qualified legal advice before public launch.

## 18. Administration and moderation

Administrators maintain university, programme and scholarship records; review data-source status and
ingestion runs; see failed jobs; review conflicting information; approve pending records; correct inaccurate
public information; archive outdated opportunities; trigger source rechecks; review change history; manage
reference data and source integrations. Strict role-based access control. Admin access to private student
records is not included by default; any operational exception needs a separately authorised, logged, limited
process. Never build an unrestricted admin interface exposing every student's information.

## 19. Notifications and reminders

Cover: approaching application or scholarship deadlines, changed requirements on a saved record, a changed
university programme, a new relevant opportunity, missing profile information affecting matching, a due
application task, a saved record gone stale or unverified. Start with in-app notifications; add email through
a configurable provider if needed. Let users configure preferences and frequency; avoid excessive or
misleading alerts.

## 20. Design direction and user experience

Distinctive, polished, nostalgic, atmospheric, and accessible. Original visual identity inspired by nostalgic
desktop interfaces, early-internet aesthetics, pixel-art environments, and games like OMORI in atmosphere
only — never reproduce OMORI's exact interface, art, characters, assets, typography, maps, layouts, or other
copyrighted material. Possible characteristics: muted/atmospheric colours, pixel-inspired details, desktop-
window motifs, soft gradients and textures, controlled animation, original icons/illustrations, thoughtful
typography, distinctive cards/panels, retro dashboard elements, modern spacing and readable layouts. Style
must never compromise readability or accessibility.

Responsive across desktop, laptop, tablet, mobile, with consistent design tokens, reusable components, clear
loading/empty/error/success/confirmation states. Never use decorative placeholders that look like genuine
university or scholarship information.

**Accessibility** — target WCAG 2.2 AA where practical: keyboard navigation, semantic HTML, contrast,
screen-reader labels, accessible forms, focus indicators, reduced-motion support, responsive text, accessible
tables and controls.

## 21. Additional features, once the foundations work

Global country directory (education system overview, common qualification types, higher education
structure, main application routes, general guidance, official government links); university comparison;
scholarship comparison; destination- and programme-specific document checklist built from verified
requirements; recognition/accreditation checker via relevant national authorities (no legal/professional
recognition guarantees); application fee planner distinguishing verified fees from estimates; timezone-aware
deadline calendar; personal notes and saved searches; maps where reliable geographic data supports them;
offline-friendly experience for non-sensitive guidance only — never cache private documents or sensitive data
insecurely.

## 22. Performance, reliability and maintainability

**Performance** — server-side rendering where appropriate, pagination, indexes, efficient queries, caching,
background processing, image optimisation, lazy loading, sensible response sizes. Never load thousands of
institutions or scholarships into the browser at once.

**Reliability** — structured logging, error monitoring, job monitoring, retries, health checks, database
backups and restore procedures, graceful handling of external API failures, timeouts, rate limiting, sensible
fallbacks.

**Observability** — track system health without unnecessarily collecting private content: API failures,
database performance, ingestion failures, failed source checks, queue length, job completion, stale data, AI
availability, notification delivery failures. Never log secrets, passwords, tokens, or unnecessary personal
information.

## 23. Open-source requirements

README, licence, contribution guidelines, code of conduct, security policy, issue and PR templates,
environment setup instructions, architecture and data-source documentation, development scripts, Docker
configuration, `.env.example`. Being open source does not mean every data source or dataset can be
redistributed — check each dependency's and dataset's licence, document attribution requirements, and never
publish private user information, API keys, credentials, or production database dumps. Document the licence
trade-off before choosing one.

## 25. Testing and acceptance requirements

Every major feature needs meaningful tests:

- **Authentication** — registration, login, logout, password reset, session expiry, protected routes, access
  control.
- **Qualifications** — multiple systems represented without losing original grades or incorrectly converting
  between grading scales.
- **Matching** — fully satisfied, missing mandatory, unknown, conditional, incomplete qualifications,
  predicted vs. achieved, subject-specific requirements, nationality restrictions, conflicting source data,
  stale records. Results must carry the relevant source and rule version.
- **Data ingestion** — valid and invalid records, duplicates, updates, missing fields, conflicting values,
  failed requests, rate limits, retries, interrupted jobs, repeated ingestion, source removal/deactivation.
- **Privacy and security** — one user cannot reach another's data; sensitive document access; authorisation;
  upload validation; secret handling; private API routes.
- **UI/end-to-end** — register → complete a profile → enter qualifications and grades → search universities →
  search scholarships → view eligibility explanations → save an opportunity → create an application tracker
  entry → review a budget estimate → manage account privacy settings.

**Definition of done** — working functionality, appropriate validation, error handling, loading/empty
states, database integration where required, authorisation checks where required, tests, documentation when
necessary. A feature displayed on screen is not complete on that basis alone. Never ship fake success
messages, non-functional buttons, or misleading demo content in a production feature.
