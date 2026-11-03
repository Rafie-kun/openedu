export interface LegalSection {
  heading: string;
  body?: string[];
  list?: string[];
}

export interface LegalDocument {
  slug: string;
  title: string;
  summary: string;
  updated: string;
  sections: LegalSection[];
}

const UPDATED = "2 November 2026";

// drafts, not legal advice. Each document says what the code actually does today.
export const LEGAL_DOCUMENTS: LegalDocument[] = [
  {
    slug: "terms",
    title: "Terms of service",
    summary: "The agreement between you and whoever operates this installation of OpenEdu.",
    updated: UPDATED,
    sections: [
      {
        heading: "What this service is",
        body: [
          "OpenEdu is an information and planning tool. It stores an academic profile you enter, compares it against recorded requirements, and keeps track of opportunities you save.",
          "It is not a university, an admissions service, a scholarship provider, a recruitment agent or an immigration adviser. Nothing on the platform is an offer, a decision or professional advice.",
        ],
      },
      {
        heading: "Your account",
        list: [
          "Give accurate information where the platform relies on it, especially qualifications and grades.",
          "Keep your password to yourself. Every action taken with your session is treated as yours.",
          "One person per account. Do not create accounts to get around rate limits.",
          "If you are under the age of majority where you live, use the platform with a parent or guardian involved.",
        ],
      },
      {
        heading: "Acceptable use",
        list: [
          "Do not attempt to access another person's profile, applications, notes or exports.",
          "Do not automate bulk collection of catalogue data, probe for vulnerabilities, or interfere with other users.",
          "Do not use the platform to submit false information to a third party; the platform does not submit anything for you anyway.",
        ],
      },
      {
        heading: "Availability and accuracy",
        body: [
          "The catalogue is incomplete and some records are unverified. Verification status and check dates are shown wherever they are known, and an empty field means the platform does not know the answer.",
          "The service may change or be unavailable. No uptime, completeness or accuracy guarantee is given.",
        ],
      },
      {
        heading: "Your content",
        body: [
          "You keep ownership of what you enter. You give the operator permission to store and process it to run the features you use, and to produce an export or deletion when you ask.",
          "Public catalogue data is not your content and is governed by its own sources and licences.",
        ],
      },
      {
        heading: "Liability",
        body: [
          "To the extent the law allows, the operator is not liable for decisions you make from information on the platform, including application, funding, travel and visa decisions. Check the original official source before acting.",
          "Nothing here excludes liability that cannot lawfully be excluded.",
        ],
      },
      {
        heading: "Ending the agreement",
        body: [
          "You can delete your account at any time from the account page. The operator may suspend an account that attacks the service or other users.",
        ],
      },
      {
        heading: "Governing law and operator details",
        body: [
          "Draft. The legal entity, contact address and governing jurisdiction must be completed before public launch. This section cannot be filled in honestly until the operator is known.",
        ],
      },
    ],
  },
  {
    slug: "privacy",
    title: "Privacy notice",
    summary: "What the platform stores about you, why, and what you can do about it.",
    updated: UPDATED,
    sections: [
      {
        heading: "Who is responsible",
        body: [
          "The operator of this installation is the data controller. Their identity and contact details are not configured in this build and must be added before public launch.",
        ],
      },
      {
        heading: "What is collected",
        list: [
          "Account: email address, display name, password hash, consent records, notification preferences.",
          "Profile: optional date of birth, country of residence, nationality, intended study level and subject, financial need band, preferred destinations.",
          "Academic: qualifications, subjects, grades, awarding bodies, exam sessions, predicted or achieved status, language test scores.",
          "Planning: saved opportunities, application tracker entries, deadlines, fees, private notes, budget plans and cost lines.",
          "Technical: a hash of your IP address and your browser user agent on sessions, plus rate-limit counters. The raw IP address is not stored.",
        ],
      },
      {
        heading: "What is not collected",
        list: [
          "Passport, national ID or visa document numbers. Do not enter them; the platform has no field for them.",
          "Payment card details. The platform does not take payments.",
          "Uploaded documents. Document storage is not enabled in this build.",
          "Advertising identifiers or third-party analytics. None are configured.",
        ],
      },
      {
        heading: "Why it is processed",
        list: [
          "To provide the account and the planning features you asked for.",
          "To evaluate recorded requirements against your profile, which is a calculation, not a decision.",
          "To keep the service secure: sessions, rate limits, audit records of sensitive actions.",
          "To send notifications you opted into, where an email provider is configured.",
        ],
      },
      {
        heading: "Who else sees it",
        body: [
          "The operator's hosting and database providers process data on their infrastructure. Where an AI provider or email provider is configured by the operator, the relevant request content is sent to that provider; the account page shows whether either is enabled in this deployment.",
          "The platform does not sell personal data and does not share it for advertising.",
        ],
      },
      {
        heading: "International transfers",
        body: [
          "Hosting, database, email and AI providers may process data outside your country. The operator is responsible for putting a lawful transfer mechanism in place and documenting it here before launch.",
        ],
      },
      {
        heading: "Your rights",
        list: [
          "Download a JSON export of your profile, qualifications, saved items, applications, notes, budgets and notifications from the account page.",
          "Correct your profile and academic records directly in the workspace.",
          "Delete your account, which removes your profile and related records immediately.",
          "Withdraw notification consent by changing your preferences.",
          "Ask the operator a question about your data using the contact route below.",
        ],
      },
      {
        heading: "Children and teenagers",
        body: [
          "The platform is intended for students who may be under 18. It collects the minimum needed for planning, does not use student data for advertising, and expects anyone below the age of majority in their country to use it with a guardian involved. Age-of-consent rules differ by jurisdiction and must be reviewed by the operator before launch.",
        ],
      },
      {
        heading: "Security",
        body: [
          "Passwords are hashed with scrypt and never stored in plain text. Sessions use random tokens stored only as hashes in an httpOnly cookie. Private records are checked against the signed-in account on the server before they are read or changed. No system is perfectly secure, so avoid entering anything you would not want exposed in a breach.",
        ],
      },
    ],
  },
  {
    slug: "cookies",
    title: "Cookie notice",
    summary: "This build sets one cookie. There is no advertising or analytics tracking to consent to.",
    updated: UPDATED,
    sections: [
      {
        heading: "The only cookie",
        body: [
          "openedu_session is a strictly necessary cookie. It holds a random session token so the server can tell that you are signed in. It is httpOnly, SameSite=Lax, expires after 30 days of inactivity, and is marked Secure in production.",
        ],
      },
      {
        heading: "Preferences stored in the database",
        body: [
          "Theme, locale and notification settings are stored against your account, not in cookies. They are not used for tracking.",
        ],
      },
      {
        heading: "Analytics and advertising",
        body: [
          "None are configured in this build. If an operator adds an analytics or advertising tool later, it must not run before valid consent and this notice must be updated first.",
        ],
      },
      {
        heading: "Removing the cookie",
        body: [
          "Signing out deletes the session. Clearing cookies in your browser also removes it; you will simply need to sign in again.",
        ],
      },
    ],
  },
  {
    slug: "ai",
    title: "AI usage disclosure",
    summary: "Where an AI assistant could appear, what it may do, and what it may never decide.",
    updated: UPDATED,
    sections: [
      {
        heading: "Current state",
        body: [
          "The AI assistant is not enabled in this build. There is a provider abstraction and a consent record type, but no conversation interface, and no requests are sent to any model provider.",
        ],
      },
      {
        heading: "What it will not do",
        list: [
          "It will not decide eligibility. Eligibility is produced by the deterministic rules engine from recorded requirements.",
          "It will not invent scholarships, deadlines, fees or immigration rules.",
          "It will not submit applications, sign declarations, pay fees or contact institutions.",
          "It will not receive uploaded documents, and it will not have unrestricted database access.",
          "It will not see another student's records.",
        ],
      },
      {
        heading: "How retrieval would work",
        body: [
          "Answers would be grounded in catalogue records and the source links attached to them, and would cite those records. When the needed information is not in the catalogue, the correct answer is that it is not available, followed by a link to the official source.",
        ],
      },
      {
        heading: "Your choice",
        body: [
          "If the assistant is enabled by an operator, using it is optional and requires consent for that specific purpose. The rest of the platform continues to work without it. Where it is disabled, the account page says so.",
        ],
      },
    ],
  },
  {
    slug: "disclaimer",
    title: "Admissions, funding and visa disclaimer",
    summary: "What an eligibility result does and does not mean.",
    updated: UPDATED,
    sections: [
      {
        heading: "Eligibility is not admission",
        body: [
          "An eligibility result compares the requirements the platform has recorded against what you entered. It is not an application, an assessment, an offer or a prediction. Only the institution or funder can decide.",
          "A student who meets every recorded requirement can still be rejected in a competitive process. OpenEdu does not calculate admission or funding probabilities and any number that looks like one is not from this platform.",
        ],
      },
      {
        heading: "Missing and unverified requirements",
        body: [
          "Requirements that are unverified, stale or not recorded downgrade a result to needing confirmation. Treat that as a prompt to read the official page, not as a soft yes.",
        ],
      },
      {
        heading: "Grades and equivalencies",
        body: [
          "The platform compares grades within the same grading scale. It does not invent conversions between qualifications. Where a university publishes its own equivalence, follow that document, not a third-party conversion table.",
        ],
      },
      {
        heading: "Funding",
        body: [
          "Scholarship records describe what a provider published on the date shown. Coverage components are recorded separately because \"fully funded\" rarely means every cost. Renewal conditions and continuation requirements are part of the award.",
        ],
      },
      {
        heading: "Visas and immigration",
        body: [
          "Visa records are a summary of official sources at a point in time. Immigration rules change, and the decision always belongs to the relevant authority. OpenEdu is not a legal or immigration adviser and does not guarantee any visa outcome.",
          "Never rely on this platform for a travel or payment decision without checking the government source linked on the record.",
        ],
      },
    ],
  },
  {
    slug: "data-retention",
    title: "Data retention and deletion",
    summary: "How long records stay, and what deleting an account actually removes.",
    updated: UPDATED,
    sections: [
      {
        heading: "Active account",
        body: [
          "Profile, academic records, saved opportunities, applications, notes and budget plans are kept while your account exists, because that is the service you asked for. Sessions expire 30 days after they are created; expired sessions are removed when encountered.",
        ],
      },
      {
        heading: "Rate-limit counters",
        body: [
          "Authentication attempts and other rate-limited actions leave timestamped counters keyed by a hash, not by your email or IP. They are short-lived by design and are not used for profiling.",
        ],
      },
      {
        heading: "Audit records",
        body: [
          "Sensitive actions such as account deletion and application changes write an audit entry with the action, entity and a hashed IP address. Deleting your account detaches those entries from your identity rather than erasing the security trail entirely. They contain no academic or financial content.",
        ],
      },
      {
        heading: "Account deletion",
        body: [
          "Deleting your account from the account page removes the user record immediately. Profiles, qualifications, language tests, saved items, applications, notes, budget plans, preferences, consents and sessions are removed with it through cascading deletes.",
          "Deletion is not reversible and there is no recovery window in this build.",
        ],
      },
      {
        heading: "Export before deleting",
        body: [
          "Download the JSON export first if you want a copy. The export includes the records above except password hashes, session tokens and audit entries.",
        ],
      },
      {
        heading: "Backups",
        body: [
          "Backups are the operator's responsibility and are not configured by the application itself. If backups exist, deletions propagate on the backup rotation schedule, which the operator must document before launch.",
        ],
      },
    ],
  },
  {
    slug: "contact",
    title: "Contact and legal enquiries",
    summary: "Where to raise a data question, a correction or a security report.",
    updated: UPDATED,
    sections: [
      {
        heading: "Data and legal questions",
        body: [
          "The operator's contact address is not configured in this build. It must be added here before public launch, together with the identity of the controller and any representative required in your jurisdiction.",
        ],
      },
      {
        heading: "Data corrections",
        body: [
          "Catalogue corrections are welcome and need a source link. Open an issue in the project repository with the record, the field, the proposed value and the official URL that supports it.",
        ],
      },
      {
        heading: "Security reports",
        body: [
          "Do not open a public issue for a vulnerability. Follow the process in SECURITY.md in the repository so the report can be handled privately.",
        ],
      },
    ],
  },
];

export function getLegalDocument(slug: string): LegalDocument | undefined {
  return LEGAL_DOCUMENTS.find((document) => document.slug === slug);
}
