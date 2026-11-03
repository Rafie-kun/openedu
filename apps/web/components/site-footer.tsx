import Link from "next/link";

const COLUMNS = [
  {
    title: "Explore",
    links: [
      { href: "/universities", label: "Universities" },
      { href: "/programmes", label: "Programmes" },
      { href: "/scholarships", label: "Scholarships" },
      { href: "/pathways", label: "Alternative pathways" },
    ],
  },
  {
    title: "Plan",
    links: [
      { href: "/guidance", label: "Application guidance" },
      { href: "/visas", label: "Student visas" },
      { href: "/budget", label: "Budget planner" },
      { href: "/applications", label: "Application tracker" },
    ],
  },
  {
    title: "Trust",
    links: [
      { href: "/legal/privacy", label: "Privacy" },
      { href: "/legal/terms", label: "Terms" },
      { href: "/legal/disclaimer", label: "Admissions disclaimer" },
      { href: "/legal/ai", label: "AI disclosure" },
      { href: "/legal/data-retention", label: "Data retention" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line/70 py-8 text-sm text-ink-soft">
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-lg text-ink">OpenEdu</p>
          <p className="mt-2 max-w-xs text-xs leading-relaxed">
            Requirements, deadlines and funding change constantly. Every important claim on this
            site links back to the source it came from — check that source before you act.
          </p>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em]">
            open source · built by Rafie-kun
          </p>
        </div>
        {COLUMNS.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink">
              {column.title}
            </p>
            <ul className="mt-2 space-y-1">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-ink hover:underline hover:underline-offset-4"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <p className="mt-8 text-xs">
        OpenEdu is not a university, an admissions service, a funding body, or an immigration
        adviser. It does not submit applications or make decisions on your behalf.
      </p>
    </footer>
  );
}
