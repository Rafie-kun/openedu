import type { Metadata } from "next";
import { Badge, EmptyState, SectionHeading, Select } from "@openedu/ui";
import { FilterForm, Pagination, UniversityCard } from "@/components/catalogue";
import { db } from "@openedu/database";
import { searchUniversities } from "@/lib/search";

export const metadata: Metadata = { title: "Universities" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

function single(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function UniversitiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = single(params.q) ?? "";
  const country = single(params.country) ?? "";
  const level = single(params.level) ?? "";
  const type = single(params.type) ?? "";
  const page = Math.max(1, Number.parseInt(single(params.page) ?? "1", 10) || 1);

  const [countries, result] = await Promise.all([
    db.country.findMany({ orderBy: { name: "asc" }, select: { iso2: true, name: true } }),
    searchUniversities({ q, country, level, type, page, pageSize: PAGE_SIZE }),
  ]);

  return (
    <div>
      <SectionHeading
        eyebrow="catalogue"
        title="Universities"
        actions={<Badge tone="info">{result.total} in catalogue</Badge>}
      >
        Search across institutions in the catalogue. Every record shows its verification state; a
        name appearing here is not proof of accreditation or recognition.
      </SectionHeading>

      <FilterForm action="/universities" q={q} resetHref="/universities">
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
            <option value="UNDERGRADUATE">Undergraduate</option>
            <option value="POSTGRADUATE">Postgraduate</option>
            <option value="DOCTORAL">Doctoral</option>
            <option value="FOUNDATION">Foundation</option>
            <option value="DIPLOMA">Diploma</option>
          </Select>
        </div>
        <div className="sm:w-36">
          <label htmlFor="type" className="mb-1 block text-xs font-medium text-ink-soft">
            Type
          </label>
          <Select id="type" name="type" defaultValue={type}>
            <option value="">Any</option>
            <option value="PUBLIC">Public</option>
            <option value="PRIVATE">Private</option>
          </Select>
        </div>
      </FilterForm>

      {result.rows.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="Nothing matched">
            The catalogue only contains institutions that have been entered from a source. Try a
            broader search, or browse{" "}
            <a href="/programmes" className="quiet-link">
              programmes
            </a>
            .
          </EmptyState>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.rows.map((university) => (
            <UniversityCard key={university.id} university={university} />
          ))}
        </div>
      )}

      <Pagination
        total={result.total}
        page={page}
        pageSize={PAGE_SIZE}
        basePath="/universities"
        params={{ q, country, level, type }}
      />
    </div>
  );
}
