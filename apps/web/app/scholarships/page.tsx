import type { Metadata } from "next";
import { Badge, Callout, EmptyState, SectionHeading, Select } from "@openedu/ui";
import { FilterForm, Pagination, ScholarshipCard } from "@/components/catalogue";
import { db } from "@openedu/database";
import { searchScholarships } from "@/lib/search";

export const metadata: Metadata = { title: "Scholarships" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

function single(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function ScholarshipsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = single(params.q) ?? "";
  const country = single(params.country) ?? "";
  const level = single(params.level) ?? "";
  const page = Math.max(1, Number.parseInt(single(params.page) ?? "1", 10) || 1);

  const [countries, result] = await Promise.all([
    db.country.findMany({
      where: { scholarshipsHosted: { some: {} } },
      orderBy: { name: "asc" },
      select: { iso2: true, name: true },
    }),
    searchScholarships({ q, country, level, page, pageSize: PAGE_SIZE }),
  ]);

  return (
    <div>
      <SectionHeading
        eyebrow="catalogue"
        title="Scholarships and funding"
        actions={<Badge tone="info">{result.total} in catalogue</Badge>}
      >
        Funding is broken into components instead of a single &quot;fully funded&quot; label. Where a
        provider has not stated a component, it stays unspecified.
      </SectionHeading>

      <Callout tone="info" title="Funding language is often looser than it looks">
        <p>
          &quot;Full tuition&quot; and &quot;fully funded&quot; are not the same thing. Each record here
          separates tuition, stipend, accommodation, travel and other components, and keeps the original
          provider wording alongside the breakdown.
        </p>
      </Callout>

      <div className="mt-4">
        <FilterForm action="/scholarships" q={q} resetHref="/scholarships">
          <div className="sm:w-44">
            <label htmlFor="country" className="mb-1 block text-xs font-medium text-ink-soft">
              Host country
            </label>
            <Select id="country" name="country" defaultValue={country}>
              <option value="">Any</option>
              {countries.map((item) => (
                <option key={item.iso2} value={item.iso2}>
                  {item.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="sm:w-44">
            <label htmlFor="level" className="mb-1 block text-xs font-medium text-ink-soft">
              Degree level
            </label>
            <Select id="level" name="level" defaultValue={level}>
              <option value="">Any</option>
              <option value="FOUNDATION">Foundation</option>
              <option value="UNDERGRADUATE">Undergraduate</option>
              <option value="POSTGRADUATE">Postgraduate</option>
              <option value="DOCTORAL">Doctoral</option>
              <option value="DIPLOMA">Diploma</option>
            </Select>
          </div>
        </FilterForm>
      </div>

      {result.rows.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No scholarships matched">
            The catalogue only lists funding whose official page has been recorded and reviewed. It is
            deliberately empty rather than filled with invented awards.
          </EmptyState>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.rows.map((scholarship) => (
            <ScholarshipCard key={scholarship.id} scholarship={scholarship} />
          ))}
        </div>
      )}

      <Pagination
        total={result.total}
        page={page}
        pageSize={PAGE_SIZE}
        basePath="/scholarships"
        params={{ q, country, level }}
      />
    </div>
  );
}
