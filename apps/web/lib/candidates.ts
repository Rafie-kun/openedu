export interface CandidateDraft {
  name: string;
  city: string;
  countryCode: string;
  websiteUrl: string;
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function draftFromPayload(payload: Record<string, unknown> | null): CandidateDraft {
  if (!payload) return { name: "", city: "", countryCode: "", websiteUrl: "" };
  return {
    name: text(payload.displayName) || text(payload.name),
    city: text(payload.city),
    countryCode: text(payload.countryCode).toUpperCase(),
    websiteUrl: text(payload.website),
  };
}

export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function uniqueSlug(base: string, taken: Iterable<string>): string {
  const root = base || "institution";
  const used = new Set(taken);
  if (!used.has(root)) return root;
  for (let suffix = 2; suffix < 100; suffix += 1) {
    const candidate = `${root}-${suffix}`;
    if (!used.has(candidate)) return candidate;
  }
  return `${root}-${Date.now()}`;
}
