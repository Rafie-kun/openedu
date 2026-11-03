import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card, EmptyState, SectionHeading, Window } from "@openedu/ui";
import {
  APPLICATION_STATUS_LABELS,
  formatDate,
  formatDateTime,
  formatMoney,
} from "@openedu/shared";
import { db } from "@openedu/database";
import {
  addApplicationNoteAction,
  deleteApplicationAction,
  updateApplicationStatusAction,
} from "@/app/actions/workspace";
import { NoteForm, StatusForm } from "@/components/application-forms";
import { requireUser } from "@/lib/session";
import { getOrCreateProfile } from "@/lib/student";

export const metadata: Metadata = { title: "Application" };
export const dynamic = "force-dynamic";

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser("/applications");
  const { id } = await params;
  const profile = await getOrCreateProfile(user.id);

  const application = await db.studentApplication.findFirst({
    where: { id, profileId: profile.id },
    include: {
      programme: { include: { university: true } },
      scholarship: { include: { provider: true } },
      notes: { orderBy: { createdAt: "desc" } },
      statusHistory: { orderBy: { changedAt: "desc" } },
      tasks: { orderBy: { dueAt: "asc" } },
      documents: { orderBy: { uploadedAt: "desc" } },
    },
  });

  if (!application) notFound();

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="tracker entry"
        title={application.title}
        actions={<Badge tone="info">{APPLICATION_STATUS_LABELS[application.status]}</Badge>}
      >
        <span className="text-sm text-ink-soft">
          Created {formatDate(application.createdAt)}
          {application.programme
            ? ` · linked to ${application.programme.title} at ${application.programme.university.name}`
            : application.scholarship
              ? ` · linked to ${application.scholarship.name}`
              : " · custom entry"}
        </span>
      </SectionHeading>

      <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-5">
          <Card>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft">
              move the status
            </p>
            <div className="mt-2">
              <StatusForm
                action={updateApplicationStatusAction}
                applicationId={application.id}
                current={application.status}
              />
            </div>
            <p className="mt-2 text-xs text-ink-soft">
              Status changes are recorded in the history below. Nothing is sent anywhere.
            </p>
          </Card>

          <Window title="status history" meta="your updates">
            {application.statusHistory.length === 0 ? (
              <p className="text-sm text-ink-soft">No status history recorded.</p>
            ) : (
              <ol className="space-y-2 text-sm">
                {application.statusHistory.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line/50 pb-2 last:border-0 last:pb-0"
                  >
                    <span>
                      <Badge>{APPLICATION_STATUS_LABELS[entry.status]}</Badge>
                      {entry.note ? <span className="ml-2 text-ink-soft">{entry.note}</span> : null}
                    </span>
                    <span className="font-mono text-[11px] text-ink-soft">
                      {formatDateTime(entry.changedAt)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </Window>

          <Window title="private notes" meta="only you can read these">
            <NoteForm action={addApplicationNoteAction} applicationId={application.id} />
            <div className="mt-4 space-y-3">
              {application.notes.length === 0 ? (
                <p className="text-sm text-ink-soft">No notes yet.</p>
              ) : (
                application.notes.map((note) => (
                  <div key={note.id} className="rounded border border-line bg-paper/60 px-3 py-2">
                    <p className="whitespace-pre-wrap text-sm text-ink">{note.body}</p>
                    <p className="mt-1 font-mono text-[10px] text-ink-soft">
                      {formatDateTime(note.createdAt)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Window>
        </div>

        <aside className="space-y-4">
          <Window title="key details" meta="as you entered them">
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-ink-soft">Deadline</dt>
                <dd>{application.deadline ? formatDate(application.deadline) : "Not set"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-ink-soft">Application fee</dt>
                <dd>
                  {application.feeAmount && application.feeCurrency
                    ? formatMoney(application.feeAmount, application.feeCurrency)
                    : "Not recorded"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-ink-soft">Tasks</dt>
                <dd>{application.tasks.length}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-ink-soft">Documents</dt>
                <dd>{application.documents.length}</dd>
              </div>
            </dl>
            {application.programme ? (
              <Link
                href={`/programmes/${application.programme.slug}`}
                className="mt-3 block quiet-link text-sm"
              >
                Recheck the programme requirements →
              </Link>
            ) : null}
            {application.scholarship ? (
              <Link
                href={`/scholarships/${application.scholarship.slug}`}
                className="mt-3 block quiet-link text-sm"
              >
                Recheck the scholarship conditions →
              </Link>
            ) : null}
          </Window>

          {application.documents.length > 0 ? (
            <Window title="documents" meta="on this entry">
              <ul className="space-y-2 text-sm">
                {application.documents.map((document) => (
                  <li key={document.id}>
                    {document.label}
                    <span className="block text-xs text-ink-soft">
                      {document.uploadedAt ? formatDate(document.uploadedAt) : "not uploaded"}
                    </span>
                  </li>
                ))}
              </ul>
            </Window>
          ) : (
            <Card>
              <p className="text-sm text-ink-soft">
                Document upload is not enabled in this deployment. Keep your files wherever you
                already store them and track the checklist here.
              </p>
            </Card>
          )}

          <Card>
            <form action={deleteApplicationAction}>
              <input type="hidden" name="applicationId" value={application.id} />
              <button
                type="submit"
                className="text-sm text-blush underline underline-offset-2 hover:no-underline"
              >
                Delete this tracker entry
              </button>
            </form>
            <p className="mt-2 text-xs text-ink-soft">
              This removes the entry, its notes and its history. It does not affect your profile.
            </p>
          </Card>

          <EmptyState
            title="A reminder"
            action={
              <Link href="/applications" className="quiet-link text-sm">
                Back to tracker
              </Link>
            }
          >
            OpenEdu does not submit applications, pay fees or accept offers. Those steps stay with
            you.
          </EmptyState>
        </aside>
      </div>
    </div>
  );
}
