import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, LinkButton, SectionHeading, Window } from "@edubuf/ui";
import { db } from "@edubuf/database";
import {
  changePasswordAction,
  deleteAccountAction,
} from "@/app/actions/profile";
import { updateNotificationPreferencesAction } from "@/app/actions/workspace";
import {
  DeleteAccountForm,
  NotificationPreferencesForm,
  PasswordChangeForm,
} from "@/components/application-forms";
import { requireUser } from "@/lib/session";
import { env, isAiConfigured, isEmailConfigured } from "@/lib/env";
import { formatDateTime } from "@edubuf/shared";

export const metadata: Metadata = { title: "Account" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await requireUser("/account");
  const [preferences, consents, sessions] = await Promise.all([
    db.userPreference.findUnique({ where: { userId: user.id } }),
    db.consentRecord.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    db.session.count({ where: { userId: user.id, expiresAt: { gt: new Date() } } }),
  ]);

  const config = env();

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="workspace" title="Account and privacy">
        Sign-in, consent records and the data you can take with you or delete. No dark patterns, no
        &quot;are you sure&quot; loops.
      </SectionHeading>

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <Window title="identity" meta={user.email}>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wide text-ink-soft">Display name</dt>
              <dd>{user.displayName}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-ink-soft">Role</dt>
              <dd>
                <Badge>{user.role.toLowerCase()}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-ink-soft">Active sessions</dt>
              <dd>{sessions}</dd>
            </div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            <LinkButton href="/profile" variant="secondary" size="sm">
              Edit profile
            </LinkButton>
            <LinkButton href="/qualifications" variant="secondary" size="sm">
              Qualifications
            </LinkButton>
            <LinkButton href="/api/account/export" variant="ghost" size="sm">
              Download my data
            </LinkButton>
          </div>
          <p className="mt-3 text-xs text-ink-soft">
            The export is a JSON file built from your profile, qualifications, saved items and tracker
            entries at the moment you request it.
          </p>
        </Window>

        <Window title="notifications" meta="what reaches you">
          <NotificationPreferencesForm
            action={updateNotificationPreferencesAction}
            initial={{
              email: preferences?.emailNotifications ?? false,
              deadlineReminders: preferences?.deadlineReminders ?? true,
              dataChangeAlerts: preferences?.dataChangeAlerts ?? true,
            }}
          />
          <p className="mt-3 text-xs text-ink-soft">
            Email delivery is {isEmailConfigured() ? "configured" : "not configured in this deployment"}.
            In-app notifications work either way.
          </p>
        </Window>

        <Window title="change password" meta="sessions are revoked">
          <PasswordChangeForm action={changePasswordAction} />
        </Window>

        <Window title="what this deployment runs" meta="honest status">
          <ul className="space-y-2 text-sm">
            <li className="flex items-center justify-between gap-2">
              <span>AI assistant</span>
              <Badge tone={isAiConfigured() ? "success" : "neutral"}>
                {isAiConfigured() ? "configured" : "not configured"}
              </Badge>
            </li>
            <li className="flex items-center justify-between gap-2">
              <span>Email delivery</span>
              <Badge tone={isEmailConfigured() ? "success" : "neutral"}>
                {isEmailConfigured() ? "configured" : "not configured"}
              </Badge>
            </li>
            <li className="flex items-center justify-between gap-2">
              <span>File storage</span>
              <Badge tone="neutral">{config.STORAGE_DRIVER}</Badge>
            </li>
            <li className="flex items-center justify-between gap-2">
              <span>Rate limiting</span>
              <Badge tone={config.RATE_LIMIT_DISABLED ? "warning" : "success"}>
                {config.RATE_LIMIT_DISABLED ? "disabled" : "database-backed"}
              </Badge>
            </li>
          </ul>
          <p className="mt-3 text-xs text-ink-soft">
            Document upload is not enabled, so no files are stored by this deployment.
          </p>
        </Window>

        <Window title="consent record" meta="versioned">
          {consents.length === 0 ? (
            <p className="text-sm text-ink-soft">No consent records found for this account.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {consents.map((record) => (
                <li key={record.id} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line/50 pb-2 last:border-0 last:pb-0">
                  <span>
                    {record.kind.replaceAll("_", " ").toLowerCase()}{" "}
                    <span className="text-ink-soft">v{record.version}</span>
                  </span>
                  <span className="font-mono text-[11px] text-ink-soft">
                    {record.granted ? "granted" : "withdrawn"} · {formatDateTime(record.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-ink-soft">
            Read the{" "}
            <Link href="/legal/privacy" className="quiet-link">
              privacy notice
            </Link>{" "}
            and{" "}
            <Link href="/legal/data-retention" className="quiet-link">
              retention policy
            </Link>
            .
          </p>
        </Window>

        <Card className="border-blush/40">
          <h2 className="font-display text-xl text-ink">Delete account</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Deletion is immediate and permanent for your profile data. There is no soft-delete window in
            this deployment.
          </p>
          <div className="mt-4">
            <DeleteAccountForm action={deleteAccountAction} />
          </div>
        </Card>
      </div>
    </div>
  );
}
