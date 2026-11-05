import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = {
  title: "Administration",
  robots: { index: false, follow: false },
};

const TABS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/review", label: "Review queue" },
  { href: "/admin/catalogue", label: "Catalogue" },
  { href: "/admin/sources", label: "Sources" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <nav aria-label="Administration">
          <ul className="flex flex-wrap gap-4 text-sm text-ink-soft">
            {TABS.map((tab) => (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  className="hover:text-ink hover:underline hover:underline-offset-4"
                >
                  {tab.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft">
          {user.role.toLowerCase()} · {user.email}
        </p>
      </div>
      {children}
    </div>
  );
}
