export interface ProfileCompletenessInput {
  nationalityCountryId: string | null;
  countryOfResidenceId: string | null;
  intendedDegreeLevel: string | null;
  intendedSubjectId: string | null;
  preferredDestinationCount: number;
  qualificationCount: number;
  languageQualificationCount: number;
}

export interface ProfileGap {
  key: string;
  label: string;
  href: string;
  why: string;
}

export interface ProfileCompleteness {
  percent: number;
  gaps: ProfileGap[];
  completed: number;
  total: number;
}

const CHECKS: Array<{
  key: string;
  label: string;
  href: string;
  why: string;
  isDone: (input: ProfileCompletenessInput) => boolean;
}> = [
  {
    key: "nationality",
    label: "Nationality",
    href: "/profile",
    why: "Some scholarships are restricted to specific nationalities.",
    isDone: (input) => Boolean(input.nationalityCountryId),
  },
  {
    key: "residence",
    label: "Country of residence",
    href: "/profile",
    why: "Residence can affect tuition rates and funding.",
    isDone: (input) => Boolean(input.countryOfResidenceId),
  },
  {
    key: "level",
    label: "Intended degree level",
    href: "/profile",
    why: "Used to filter programmes and scholarships by level.",
    isDone: (input) => Boolean(input.intendedDegreeLevel),
  },
  {
    key: "subject",
    label: "Intended subject",
    href: "/profile",
    why: "Needed for subject-specific matches and pathways.",
    isDone: (input) => Boolean(input.intendedSubjectId),
  },
  {
    key: "destinations",
    label: "Preferred study destinations",
    href: "/profile",
    why: "Keeps recommendations focused on places you would actually go.",
    isDone: (input) => input.preferredDestinationCount > 0,
  },
  {
    key: "qualifications",
    label: "At least one qualification",
    href: "/qualifications",
    why: "Eligibility checks compare recorded qualifications and grades.",
    isDone: (input) => input.qualificationCount > 0,
  },
  {
    key: "language",
    label: "Language test result",
    href: "/qualifications#language",
    why: "Programmes usually have a language requirement.",
    isDone: (input) => input.languageQualificationCount > 0,
  },
];

export function profileCompleteness(input: ProfileCompletenessInput): ProfileCompleteness {
  const pending = CHECKS.filter((check) => !check.isDone(input));
  const completed = CHECKS.length - pending.length;
  return {
    percent: Math.round((completed / CHECKS.length) * 100),
    completed,
    total: CHECKS.length,
    gaps: pending.map(({ key, label, href, why }) => ({ key, label, href, why })),
  };
}
