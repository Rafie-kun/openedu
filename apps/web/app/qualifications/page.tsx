import type { Metadata } from "next";
import { Badge, Callout, Card, EmptyState, Window } from "@openedu/ui";
import {
  addLanguageTestAction,
  addQualificationAction,
  deleteLanguageTestAction,
  deleteQualificationAction,
} from "@/app/actions/profile";
import { LanguageTestForm, QualificationForm } from "@/components/qualification-form";
import { requireUser } from "@/lib/session";
import {
  getOrCreateProfile,
  listSubjects,
  loadLanguageTests,
  loadQualificationOptions,
  loadQualifications,
} from "@/lib/student";
import { QUALIFICATION_LEVEL_LABELS, formatDate } from "@openedu/shared";

export const metadata: Metadata = { title: "Qualifications" };
export const dynamic = "force-dynamic";

export default async function QualificationsPage() {
  const user = await requireUser("/qualifications");
  const profile = await getOrCreateProfile(user.id);

  const [qualifications, languageTests, options, subjects] = await Promise.all([
    loadQualifications(profile.id),
    loadLanguageTests(profile.id),
    loadQualificationOptions(),
    listSubjects(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">academic record</p>
        <h1 className="mt-1 font-display text-3xl text-ink">Qualifications and grades</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          Add each qualification separately. Your grades stay on their original scale and session, so a
          Cambridge A* and an IB 7 are never blended into a made-up GPA.
        </p>
      </div>

      <Callout tone="info" title="Why the platform keeps scales separate">
        <p>
          Two examination systems cannot be compared reliably without a documented equivalency. OpenEdu
          only compares a grade with a requirement recorded on the same scale, and shows “not supplied”
          when it cannot. The university&apos;s own entry requirements remain the authority.
        </p>
      </Callout>

      <section aria-labelledby="existing-heading" className="space-y-4">
        <h2 id="existing-heading" className="font-display text-2xl text-ink">
          On your record
        </h2>

        {qualifications.length === 0 ? (
          <EmptyState title="No qualifications yet">
            Add the qualification you are studying or have finished. Even an in-progress record makes
            checks more useful, because predicted results are shown separately.
          </EmptyState>
        ) : (
          <div className="space-y-4">
            {qualifications.map((qualification) => (
              <Card key={qualification.id} as="article">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-lg text-ink">
                      {qualification.qualificationType.name}
                    </h3>
                    <p className="text-xs text-ink-soft">
                      {QUALIFICATION_LEVEL_LABELS[qualification.qualificationType.level]} ·{" "}
                      {qualification.awardingBody?.name ?? "Awarding body not specified"}
                      {qualification.sessionYear ? ` · ${qualification.sessionYear}` : ""}
                      {qualification.sessionSeries ? ` ${qualification.sessionSeries}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      tone={
                        qualification.status === "COMPLETED" || qualification.status === "AWARDED"
                          ? "success"
                          : "warning"
                      }
                    >
                      {qualification.status.replaceAll("_", " ").toLowerCase()}
                    </Badge>
                    {qualification.overallGradeLabel ? (
                      <Badge tone="info">overall {qualification.overallGradeLabel}</Badge>
                    ) : null}
                  </div>
                </div>

                {qualification.subjectResults.length > 0 ? (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <caption className="sr-only">
                        Subjects recorded for {qualification.qualificationType.name}
                      </caption>
                      <thead>
                        <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-soft">
                          <th scope="col" className="py-1 pr-3 font-medium">
                            Subject
                          </th>
                          <th scope="col" className="py-1 pr-3 font-medium">
                            Grade
                          </th>
                          <th scope="col" className="py-1 font-medium">
                            Result
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {qualification.subjectResults.map((result) => (
                          <tr key={result.id} className="border-b border-line/50 last:border-0">
                            <td className="py-1.5 pr-3">{result.subject.name}</td>
                            <td className="py-1.5 pr-3 font-mono">{result.gradeLabel}</td>
                            <td className="py-1.5 text-ink-soft">
                              {result.kind.toLowerCase()}
                              {result.kind !== "ACHIEVED" ? " · not a final result" : ""}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-ink-soft">No subject-level results recorded.</p>
                )}

                {qualification.notes ? (
                  <p className="mt-3 rounded border border-line bg-paper/60 px-3 py-2 text-xs text-ink-soft">
                    {qualification.notes}
                  </p>
                ) : null}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
                  <p className="text-xs text-ink-soft">
                    Scale: {qualification.gradeScale?.name ?? "not specified"}
                  </p>
                  <form action={deleteQualificationAction}>
                    <input type="hidden" name="qualificationId" value={qualification.id} />
                    <button
                      type="submit"
                      className="rounded border border-blush/50 px-2.5 py-1 text-xs text-blush hover:bg-blush/10"
                    >
                      Remove
                    </button>
                  </form>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="add-heading">
        <Window title="add qualification" meta="your record only">
          <h2 id="add-heading" className="sr-only">
            Add a qualification
          </h2>
          {options.types.length === 0 ? (
            <Callout tone="warning">
              No qualification types are loaded. Run <code>pnpm db:seed</code> to load the reference
              data.
            </Callout>
          ) : (
            <QualificationForm
              action={addQualificationAction}
              types={options.types}
              awardingBodies={options.awardingBodies}
              subjects={subjects}
            />
          )}
        </Window>
      </section>

      <section id="language" aria-labelledby="language-heading" className="space-y-4">
        <h2 id="language-heading" className="font-display text-2xl text-ink">
          Language tests
        </h2>
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <Card>
            {languageTests.length === 0 ? (
              <p className="text-sm text-ink-soft">
                No language test recorded. Programmes with a language requirement will show it as not
                supplied rather than assuming you meet it.
              </p>
            ) : (
              <ul className="space-y-3">
                {languageTests.map((test) => (
                  <li key={test.id} className="flex items-start justify-between gap-3 border-b border-line/60 pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium text-ink">
                        {test.testCode} · <span className="font-mono">{test.score}</span>
                      </p>
                      <p className="text-xs text-ink-soft">
                        {test.testDate ? `Taken ${formatDate(test.testDate)}` : "Test date not recorded"}
                        {test.expiresAt ? ` · expires ${formatDate(test.expiresAt)}` : ""}
                      </p>
                    </div>
                    <form action={deleteLanguageTestAction}>
                      <input type="hidden" name="languageTestId" value={test.id} />
                      <button
                        type="submit"
                        className="rounded border border-blush/50 px-2 py-1 text-xs text-blush hover:bg-blush/10"
                      >
                        Remove
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <LanguageTestForm action={addLanguageTestAction} />
          </Card>
        </div>
      </section>
    </div>
  );
}
