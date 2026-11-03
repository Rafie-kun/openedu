import type { Metadata } from "next";
import Link from "next/link";
import { Callout, Window } from "@openedu/ui";
import { updateProfileAction } from "@/app/actions/profile";
import { ProfileForm } from "@/components/profile-form";
import { requireUser } from "@/lib/session";
import { getOrCreateProfile, listCountries, listSubjects } from "@/lib/student";

export const metadata: Metadata = { title: "Set up your profile" };
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await requireUser("/onboarding");
  const [profile, countries, subjects] = await Promise.all([
    getOrCreateProfile(user.id),
    listCountries(),
    listSubjects(),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-5 py-6">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">step 2 of 2</p>
        <h1 className="mt-1 font-display text-3xl text-ink">The short version of your situation</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Everything here is optional except what a specific requirement needs. You can change it later
          without losing anything.
        </p>
      </div>

      {countries.length === 0 ? (
        <Callout tone="warning" title="Reference data is not loaded">
          The country and subject lists are empty. Run <code>pnpm db:seed</code> against your database,
          then reload this page.
        </Callout>
      ) : null}

      <Window title="student profile" meta="private">
        <ProfileForm
          action={updateProfileAction}
          countries={countries.map((country) => ({ id: country.id, name: country.name }))}
          subjects={subjects.map((subject) => ({ id: subject.id, name: subject.name }))}
          initial={{
            displayName: profile.displayName ?? user.displayName,
            dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.toISOString().slice(0, 10) : "",
            countryOfResidenceId: profile.countryOfResidenceId ?? "",
            nationalityCountryId: profile.nationalityCountryId ?? "",
            intendedDegreeLevel: profile.intendedDegreeLevel ?? "",
            intendedSubjectId: profile.intendedSubjectId ?? "",
            financialNeedLevel: profile.financialNeedLevel ?? "",
            preferredCountryIds: profile.preferredDestinations.map((item) => item.countryId),
          }}
        />
      </Window>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-panel/70 px-4 py-3 text-sm">
        <p className="text-ink-soft">
          Next: add at least one qualification so requirement checks have something to compare.
        </p>
        <Link href="/qualifications" className="quiet-link font-medium">
          Add a qualification →
        </Link>
      </div>
    </div>
  );
}
