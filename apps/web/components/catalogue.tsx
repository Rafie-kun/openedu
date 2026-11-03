import Link from "next/link";
import type { ReactNode } from "react";
import { Badge, Card, Input, LinkButton } from "@openedu/ui";
import { VerificationBadge } from "@openedu/ui";
import { formatDate, formatMoney } from "@openedu/shared";

export function FilterForm({
  action,
  q,
  children,
  resetHref,
}: {
  action: string;
  q?: string;
  children?: ReactNode;
  resetHref: string;
}) {
  return (
    <form
      action={action}
      method="get"
      role="search"
      className="rounded-md border border-line bg-panel/80 p-3"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="q" className="mb-1 block text-xs font-medium text-ink-soft">
            Search
          </label>
          <Input
            id="q"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Name, city or subject"
            maxLength={120}
          />
        </div>
        {children}
        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-md border border-plum-strong bg-plum-strong px-4 py-2 text-sm font-medium text-paper hover:bg-plum"
          >
            Search
          </button>
          <Link
            href={resetHref}
            className="rounded-md border border-line px-3 py-2 text-sm text-ink-soft hover:border-ink/40"
          >
            Reset
          </Link>
        </div>
      </div>
    </form>
  );
}

export function Pagination({
  total,
  page,
  pageSize,
  basePath,
  params,
}: {
  total: number;
  page: number;
  pageSize: number;
  basePath: string;
  params: Record<string, string | undefined>;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;

  const build = (target: number) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) search.set(key, value);
    }
    if (target > 1) search.set("page", String(target));
    const suffix = search.toString();
    return suffix ? `${basePath}?${suffix}` : basePath;
  };

  return (
    <nav aria-label="Pagination" className="mt-6 flex items-center justify-between text-sm">
      <p className="font-mono text-xs text-ink-soft">
        page {page} of {pages} · {total} record{total === 1 ? "" : "s"}
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link
            href={build(page - 1)}
            className="rounded border border-line px-3 py-1.5 hover:bg-panel"
          >
            Previous
          </Link>
        ) : null}
        {page < pages ? (
          <Link
            href={build(page + 1)}
            className="rounded border border-line px-3 py-1.5 hover:bg-panel"
          >
            Next
          </Link>
        ) : null}
      </div>
    </nav>
  );
}

export function UniversityCard({
  university,
}: {
  university: {
    slug: string;
    name: string;
    city: string;
    type: string;
    verificationStatus: Parameters<typeof VerificationBadge>[0]["status"];
    lastCheckedAt: Date | null;
    country: { name: string; iso2: string };
    _count: { programmes: number };
  };
}) {
  return (
    <Card as="article" className="flex h-full flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg leading-tight text-ink">{university.name}</h3>
          <VerificationBadge status={university.verificationStatus} />
        </div>
        <p className="mt-1 text-sm text-ink-soft">
          {university.city}, {university.country.name}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge>{university.type.toLowerCase()}</Badge>
          <Badge>
            {university._count.programmes} programme{university._count.programmes === 1 ? "" : "s"}
          </Badge>
          {university.lastCheckedAt ? (
            <Badge>checked {formatDate(university.lastCheckedAt)}</Badge>
          ) : null}
        </div>
      </div>
      <div className="mt-4">
        <LinkButton href={`/universities/${university.slug}`} variant="secondary" size="sm">
          View institution
        </LinkButton>
      </div>
    </Card>
  );
}

export function ProgrammeCard({
  programme,
}: {
  programme: {
    slug: string;
    title: string;
    degreeLevel: string;
    durationMonths: number | null;
    languageOfInstruction: string | null;
    verificationStatus: Parameters<typeof VerificationBadge>[0]["status"];
    university: { name: string; country: { name: string } };
  };
}) {
  return (
    <Card as="article" className="flex h-full flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg leading-tight text-ink">{programme.title}</h3>
          <VerificationBadge status={programme.verificationStatus} />
        </div>
        <p className="mt-1 text-sm text-ink-soft">
          {programme.university.name} · {programme.university.country.name}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge>{programme.degreeLevel.replaceAll("_", " ").toLowerCase()}</Badge>
          {programme.durationMonths ? <Badge>{programme.durationMonths} months</Badge> : null}
          {programme.languageOfInstruction ? (
            <Badge>{programme.languageOfInstruction}</Badge>
          ) : null}
        </div>
      </div>
      <div className="mt-4">
        <LinkButton href={`/programmes/${programme.slug}`} variant="secondary" size="sm">
          Requirements and check
        </LinkButton>
      </div>
    </Card>
  );
}

export function ScholarshipCard({
  scholarship,
}: {
  scholarship: {
    slug: string;
    name: string;
    degreeLevels: string[];
    verificationStatus: Parameters<typeof VerificationBadge>[0]["status"];
    provider: { name: string };
    hostCountry: { name: string } | null;
    deadlines: Array<{ label: string; closesAt: Date | null }>;
    fundingComponents: Array<{
      component: string;
      coverage: string;
      amount: { toString(): string } | null;
      currencyCode: string | null;
    }>;
  };
}) {
  const deadline = scholarship.deadlines[0];
  const specified = scholarship.fundingComponents.filter(
    (component) => component.coverage !== "UNSPECIFIED",
  );

  return (
    <Card as="article" className="flex h-full flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg leading-tight text-ink">{scholarship.name}</h3>
          <VerificationBadge status={scholarship.verificationStatus} />
        </div>
        <p className="mt-1 text-sm text-ink-soft">
          {scholarship.provider.name}
          {scholarship.hostCountry ? ` · ${scholarship.hostCountry.name}` : ""}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {scholarship.degreeLevels.slice(0, 3).map((level) => (
            <Badge key={level}>{level.replaceAll("_", " ").toLowerCase()}</Badge>
          ))}
          {specified.slice(0, 2).map((component) => (
            <Badge key={component.component} tone="info">
              {component.component.toLowerCase().replaceAll("_", " ")}
              {component.amount
                ? ` · ${formatMoney(component.amount, component.currencyCode ?? "USD")}`
                : ""}
            </Badge>
          ))}
          {specified.length === 0 ? (
            <Badge tone="warning">funding breakdown unspecified</Badge>
          ) : null}
        </div>
        <p className="mt-3 text-xs text-ink-soft">
          {deadline
            ? `${deadline.label}: ${deadline.closesAt ? formatDate(deadline.closesAt) : "date not recorded"}`
            : "No deadline recorded"}
        </p>
      </div>
      <div className="mt-4">
        <LinkButton href={`/scholarships/${scholarship.slug}`} variant="secondary" size="sm">
          Eligibility and funding
        </LinkButton>
      </div>
    </Card>
  );
}
