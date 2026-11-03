import { db } from "@openedu/database";

async function matchingUniversityIds(query: string): Promise<string[]> {
  if (!query) return [];
  const rows = await db.$queryRaw<Array<{ id: string }>>`
    SELECT u.id
    FROM "University" u
    JOIN "Country" c ON c.id = u."countryId"
    WHERE to_tsvector(
            'simple',
            coalesce(u.name, '') || ' ' ||
            coalesce(u."officialName", '') || ' ' ||
            coalesce(u.city, '') || ' ' ||
            coalesce(c.name, '')
          ) @@ websearch_to_tsquery('simple', ${query})
       OR u.name ILIKE '%' || ${query} || '%'
    LIMIT 200
  `;
  return rows.map((row) => row.id);
}

export interface UniversityFilters {
  q?: string;
  country?: string;
  level?: string;
  type?: string;
  page: number;
  pageSize: number;
}

export async function searchUniversities(filters: UniversityFilters) {
  const q = filters.q?.trim() ?? "";
  const ids = await matchingUniversityIds(q);

  const where = {
    verificationStatus: { not: "ARCHIVED" as const },
    ...(q ? { id: { in: ids } } : {}),
    ...(filters.country ? { country: { iso2: filters.country } } : {}),
    ...(filters.type ? { type: filters.type as "PUBLIC" | "PRIVATE" | "OTHER" } : {}),
    ...(filters.level
      ? { programmes: { some: { degreeLevel: filters.level as never } } }
      : {}),
  };

  const [total, rows] = await Promise.all([
    db.university.count({ where }),
    db.university.findMany({
      where,
      include: { country: true, _count: { select: { programmes: true } } },
      orderBy: [{ name: "asc" }],
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
  ]);

  return { total, rows };
}

export async function searchProgrammes(filters: UniversityFilters) {
  const q = filters.q?.trim() ?? "";
  const where = {
    verificationStatus: { not: "ARCHIVED" as const },
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { subjectArea: { contains: q, mode: "insensitive" as const } },
            { university: { name: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
    ...(filters.country ? { university: { country: { iso2: filters.country } } } : {}),
    ...(filters.level ? { degreeLevel: filters.level as never } : {}),
  };

  const [total, rows] = await Promise.all([
    db.programme.count({ where }),
    db.programme.findMany({
      where,
      include: { university: { include: { country: true } } },
      orderBy: [{ title: "asc" }],
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
  ]);

  return { total, rows };
}

export async function searchScholarships(filters: {
  q?: string;
  country?: string;
  level?: string;
  page: number;
  pageSize: number;
}) {
  const q = filters.q?.trim() ?? "";
  const where = {
    verificationStatus: { not: "ARCHIVED" as const },
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { provider: { name: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
    ...(filters.country ? { hostCountry: { iso2: filters.country } } : {}),
    ...(filters.level ? { degreeLevels: { has: filters.level as never } } : {}),
  };

  const [total, rows] = await Promise.all([
    db.scholarship.count({ where }),
    db.scholarship.findMany({
      where,
      include: {
        provider: true,
        hostCountry: true,
        deadlines: { orderBy: { closesAt: "asc" }, take: 1 },
        fundingComponents: true,
      },
      orderBy: [{ name: "asc" }],
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
  ]);

  return { total, rows };
}
