import type { Metadata } from "next";
import { Badge, EmptyState, SectionHeading, Select } from "@openedu/ui";
import { FilterForm, Pagination, ProgrammeCard } from "@/components/catalogue";
import { db } from "@openedu/database";
import { searchProgrammes } from "@/lib/search";

export const metadata: Metadata = { title: "Programmes" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

function single(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function ProgrammesPage({
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
    db.country.findMany({ orderBy: { name: "asc" }, select: { iso2: true, name: true } }),
    searchProgrammes({ q, country, level, page, pageSize: PAGE_SIZE }),
  ]);

  return (
    <div>
      <SectionHeading
        eyebrow="catalogue"
        title="Programmes"
        actions={<Badge tone="info">{result.total} in catalogue</Badge>}
      >
        Each programme is checked against its own requirements, not its university&apos;s general
        admission page. Where a requirement has no source or no check date, the result says so.
      </SectionHeading>

      <FilterForm action="/programmes" q={q} resetHref="/programmes">
        <div className="sm:w-44">
          <label htmlFor="country" className="mb-1 block text-xs font-medium text-ink-soft">
            Country
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
            <option value="CERTIFICATE">Certificate</option>
          </Select>
        </div>
      </FilterForm>

      {result.rows.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No programmes matched">
            The catalogue only lists programmes whose official page has been recorded. Nothing is
            generated to fill the gap.
          </EmptyState>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.rows.map((programme) => (
            <ProgrammeCard key={programme.id} programme={programme} />
          ))}
        </div>
      )}

      <Pagination
        total={result.total}
        page={page}
        pageSize={PAGE_SIZE}
        basePath="/programmes"
        params={{ q, country, level }}
      />
    </div>
  );
}
