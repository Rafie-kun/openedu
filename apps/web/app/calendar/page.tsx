import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Callout, Card, EmptyState, SectionHeading } from "@openedu/ui";
import {
  APPLICATION_STATUS_LABELS,
  VERIFICATION_LABELS,
  daysUntil,
  formatDate,
  verificationTone,
} from "@openedu/shared";
import type { VerificationStatusValue } from "@openedu/shared";
import { db } from "@openedu/database";
import { getOrCreateProfile } from "@/lib/student";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Deadline calendar" };
export const dynamic = "force-dynamic";

interface CalendarEvent {
  id: string;
  date: Date;
  title: string;
  context: string;
  href: string;
  source: "you" | "catalogue";
  verificationStatus?: string;
  statusNote?: string;
}

function monthKey(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function startOfToday(): Date {
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  return now;
}

export default async function CalendarPage() {
  const user = await requireUser("/calendar");
  const profile = await getOrCreateProfile(user.id);
  const start = startOfToday();

  const [applications, programmeDeadlines, scholarshipDeadlines] = await Promise.all([
    db.studentApplication.findMany({
      where: { profileId: profile.id },
      include: { tasks: { where: { dueAt: { gte: start }, completedAt: null } } },
    }),
    db.programmeDeadline.findMany({
      where: {
        closesAt: { gte: start },
        verificationStatus: { not: "ARCHIVED" },
        programme: { verificationStatus: { not: "ARCHIVED" } },
      },
      include: { programme: { include: { university: { select: { name: true } } } } },
      orderBy: { closesAt: "asc" },
      take: 100,
    }),
    db.scholarshipDeadline.findMany({
      where: {
        closesAt: { gte: start },
        verificationStatus: { not: "ARCHIVED" },
        scholarship: { verificationStatus: { not: "ARCHIVED" } },
      },
      include: {
        scholarship: { select: { slug: true, name: true, verificationStatus: true } },
      },
      orderBy: { closesAt: "asc" },
      take: 100,
    }),
  ]);

  const events: CalendarEvent[] = [];

  for (const application of applications) {
    if (application.deadline && application.deadline >= start) {
      events.push({
        id: `application-${application.id}`,
        date: application.deadline,
        title: application.title,
        context: `Your tracker · ${APPLICATION_STATUS_LABELS[application.status]}`,
        href: `/applications/${application.id}`,
        source: "you",
      });
    }

    for (const task of application.tasks) {
      if (!task.dueAt) continue;
      events.push({
        id: `task-${task.id}`,
        date: task.dueAt,
        title: task.title,
        context: `Task on ${application.title}`,
        href: `/applications/${application.id}`,
        source: "you",
        statusNote: task.isRequired ? "required" : "optional",
      });
    }
  }

  for (const deadline of programmeDeadlines) {
    if (!deadline.closesAt) continue;
    events.push({
      id: `programme-${deadline.id}`,
      date: deadline.closesAt,
      title: `${deadline.programme.title} — ${deadline.label}`,
      context: `${deadline.programme.university.name}${deadline.intake ? ` · ${deadline.intake}` : ""}`,
      href: `/programmes/${deadline.programme.slug}`,
      source: "catalogue",
      verificationStatus: deadline.verificationStatus,
    });
  }

  for (const deadline of scholarshipDeadlines) {
    if (!deadline.closesAt) continue;
    events.push({
      id: `scholarship-${deadline.id}`,
      date: deadline.closesAt,
      title: `${deadline.scholarship.name} — ${deadline.label}`,
      context: "Scholarship deadline recorded from the provider",
      href: `/scholarships/${deadline.scholarship.slug}`,
      source: "catalogue",
      verificationStatus: deadline.verificationStatus,
    });
  }

  events.sort((left, right) => left.date.getTime() - right.date.getTime());

  const grouped = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const key = monthKey(event.date);
    grouped.set(key, [...(grouped.get(key) ?? []), event]);
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="workspace"
        title="Deadline calendar"
        actions={
          <Link href="/applications/new" className="quiet-link text-sm">
            Add a tracker entry
          </Link>
        }
      >
        Your own deadlines sit next to deadlines recorded from institutions and providers. A
        catalogue deadline keeps its source and last-checked date, because dates move.
      </SectionHeading>

      <Callout tone="warning" title="Dates are shown as published">
        Catalogue deadlines use the date and timezone recorded with the source. OpenEdu does not
        adjust them for your timezone. Confirm the closing time on the official page before the
        final week.
      </Callout>

      {events.length === 0 ? (
        <EmptyState
          title="Nothing upcoming"
          action={
            <Link href="/applications/new" className="quiet-link text-sm">
              Add your first deadline
            </Link>
          }
        >
          Personal deadlines come from your tracker. Catalogue deadlines appear once a programme or
          scholarship has a recorded closing date.
        </EmptyState>
      ) : (
        <div className="space-y-8">
          {[...grouped.entries()].map(([month, monthEvents]) => (
            <section key={month} aria-labelledby={`month-${month}`}>
              <h2 id={`month-${month}`} className="font-display text-xl text-ink">
                {month}
              </h2>
              <ul className="mt-3 space-y-2">
                {monthEvents.map((event) => {
                  const remaining = daysUntil(event.date);
                  const soon = remaining !== null && remaining <= 14;

                  return (
                    <Card as="li" key={event.id} className="py-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            href={event.href}
                            className="text-sm font-medium text-ink hover:underline"
                          >
                            {event.title}
                          </Link>
                          <p className="text-xs text-ink-soft">{event.context}</p>
                          {event.verificationStatus ? (
                            <p className="mt-1">
                              <Badge
                                tone={verificationTone(
                                  event.verificationStatus as VerificationStatusValue,
                                )}
                              >
                                {VERIFICATION_LABELS[
                                  event.verificationStatus as VerificationStatusValue
                                ] ?? event.verificationStatus}
                              </Badge>
                            </p>
                          ) : null}
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-sm text-ink">{formatDate(event.date)}</p>
                          <p className="text-xs text-ink-soft">
                            {remaining === null
                              ? "date unknown"
                              : remaining <= 0
                                ? "today"
                                : `${remaining} day${remaining === 1 ? "" : "s"} left`}
                          </p>
                          {soon ? (
                            <Badge tone="warning">{remaining === 0 ? "today" : "soon"}</Badge>
                          ) : null}
                          {event.statusNote ? (
                            <p className="text-[11px] uppercase tracking-wide text-ink-soft">
                              {event.statusNote}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
