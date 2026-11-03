const DEFAULT_LOCALE = "en-GB";

export function isIsoCurrency(code: string): boolean {
  return /^[A-Z]{3}$/.test(code);
}

// Prisma Decimal shows up here as an object with toString, so accept that shape too
export function formatMoney(
  amount: number | string | { toString(): string } | null | undefined,
  currency: string,
  locale = DEFAULT_LOCALE,
): string {
  if (amount === null || amount === undefined || amount === "") return "Not specified";
  const numeric = typeof amount === "number" ? amount : Number(amount.toString());
  if (!Number.isFinite(numeric)) return "Not specified";
  if (!isIsoCurrency(currency)) return `${numeric.toFixed(2)} ${currency}`;
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(numeric);
  } catch {
    return `${numeric.toFixed(2)} ${currency}`;
  }
}

export function formatDate(
  value: Date | string | null | undefined,
  locale = DEFAULT_LOCALE,
): string {
  if (!value) return "Not specified";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Not specified";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatDateTime(
  value: Date | string | null | undefined,
  locale = DEFAULT_LOCALE,
): string {
  if (!value) return "Not specified";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Not specified";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(date);
}

export function daysUntil(
  value: Date | string | null | undefined,
  now = new Date(),
): number | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// blocks protocol-relative and backslash tricks on ?next=
export function safeInternalPath(
  candidate: string | null | undefined,
  fallback = "/dashboard",
): string {
  if (!candidate) return fallback;
  if (!candidate.startsWith("/")) return fallback;
  if (candidate.startsWith("//")) return fallback;
  if (candidate.includes("\\")) return fallback;
  if (candidate.includes("\n") || candidate.includes("\r")) return fallback;
  return candidate;
}

export function normaliseWhitespace(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join("") || "?";
}
