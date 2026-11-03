import Link from "next/link";
import { LinkButton } from "@openedu/ui";
import { logoutAction } from "@/app/actions/auth";
import type { CurrentUser } from "@/lib/session";
import { LogoutButton } from "./auth-forms";

const NAV = [
  { href: "/universities", label: "Universities" },
  { href: "/programmes", label: "Programmes" },
  { href: "/scholarships", label: "Scholarships" },
  { href: "/guidance", label: "Guidance" },
  { href: "/visas", label: "Visas" },
];

export function SiteHeader({ user }: { user: CurrentUser | null }) {
  return (
    <header className="border-b border-line/70 pb-4 pt-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <Link href="/" className="group flex items-center gap-3">
          <span
            aria-hidden
            className="grid h-9 w-9 place-items-center rounded-[6px] border border-plum-strong bg-plum-strong font-mono text-sm text-paper shadow-[2px_2px_0_0_rgba(36,31,46,0.35)]"
          >
            EB
          </span>
          <span>
            <span className="block font-display text-xl leading-none text-ink">OpenEdu</span>
            <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
              study planning workspace
            </span>
          </span>
        </Link>

        <nav aria-label="Main" className="order-3 w-full sm:order-2 sm:w-auto">
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-soft">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-ink hover:underline hover:underline-offset-4">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="order-2 flex items-center gap-2 sm:order-3">
          {user ? (
            <>
              <LinkButton href="/dashboard" variant="secondary" size="sm">
                Workspace
              </LinkButton>
              <LogoutButton action={logoutAction} />
            </>
          ) : (
            <>
              <LinkButton href="/login" variant="ghost" size="sm">
                Sign in
              </LinkButton>
              <LinkButton href="/register" size="sm">
                Start
              </LinkButton>
            </>
          )}
        </div>
      </div>

      {user ? (
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft">
          signed in as {user.displayName}
        </p>
      ) : null}
    </header>
  );
}
