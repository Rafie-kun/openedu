import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, EmptyState, SectionHeading } from "@edubuf/ui";
import { formatDateTime } from "@edubuf/shared";
import { db } from "@edubuf/database";
import { markNotificationsReadAction } from "@/app/actions/workspace";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Notifications" };
export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await requireUser("/notifications");

  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const unread = notifications.filter((item) => item.readAt === null).length;

  return (
    <div>
      <SectionHeading
        eyebrow="workspace"
        title="Notifications"
        actions={
          unread > 0 ? (
            <form action={markNotificationsReadAction}>
              <button
                type="submit"
                className="rounded-md border border-line bg-panel px-3 py-2 text-sm text-ink hover:border-ink/40"
              >
                Mark all read
              </button>
            </form>
          ) : null
        }
      >
        Deadlines, saved-record changes and profile gaps you opted into. Nothing promotional.
      </SectionHeading>

      {notifications.length === 0 ? (
        <EmptyState title="No notifications yet">
          EduBuf only writes here for events tied to your own records. An empty list is normal for a new
          account.
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {notifications.map((notification) => (
            <Card as="li" key={notification.id} className="py-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-ink">{notification.title}</p>
                  <p className="mt-1 text-sm text-ink-soft">{notification.body}</p>
                  {notification.link ? (
                    <Link href={notification.link} className="mt-1 inline-block text-sm quiet-link">
                      Open the record
                    </Link>
                  ) : null}
                </div>
                <div className="text-right">
                  <Badge tone={notification.readAt ? "neutral" : "info"}>
                    {notification.readAt ? "read" : "unread"}
                  </Badge>
                  <p className="mt-1 font-mono text-[10px] text-ink-soft">
                    {formatDateTime(notification.createdAt)}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}
