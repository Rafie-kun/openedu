import type { Metadata } from "next";
import Link from "next/link";
import { Window } from "@openedu/ui";
import { updateProfileAction } from "@/app/actions/profile";
import { ProfileForm } from "@/components/profile-form";
import { requireUser } from "@/lib/session";
import { getOrCreateProfile, listCountries, listSubjects } from "@/lib/student";

export const metadata: Metadata = { title: "Profile" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireUser("/profile");
  const [profile, countries, subjects] = await Promise.all([
    getOrCreateProfile(user.id),
    listCountries(),
    listSubjects(),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">workspace</p>
        <h1 className="mt-1 font-display text-3xl text-ink">Profile</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          These details drive eligibility checks. Only supply what you are comfortable sharing — missing
          information shows up as “not supplied”, not as a failure.
        </p>
      </div>

      <Window title="academic and personal details" meta={user.email}>
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

      <p className="text-sm text-ink-soft">
        Manage sign-in and deletion in{" "}
        <Link href="/account" className="quiet-link">
          account settings
        </Link>
        .
      </p>
    </div>
  );
}
