import { db } from "@openedu/database";

const SOURCE = "Frankfurter";
const ENDPOINT = "https://api.frankfurter.app/latest";
const MAX_AGE_MS = 1000 * 60 * 60 * 12;

export const SUPPORTED_CURRENCIES = [
  "AUD",
  "BGN",
  "BRL",
  "CAD",
  "CHF",
  "CNY",
  "CZK",
  "DKK",
  "EUR",
  "GBP",
  "HKD",
  "HUF",
  "IDR",
  "ILS",
  "INR",
  "ISK",
  "JPY",
  "KRW",
  "MXN",
  "MYR",
  "NOK",
  "NZD",
  "PHP",
  "PLN",
  "RON",
  "SEK",
  "SGD",
  "THB",
  "TRY",
  "USD",
  "ZAR",
] as const;

export interface RateSnapshot {
  base: string;
  rateDate: string;
  fetchedAt: Date;
  rates: Record<string, number>;
  source: string;
  stale: boolean;
}

interface FrankfurterPayload {
  amount?: number;
  base?: string;
  date?: string;
  rates?: Record<string, unknown>;
}

export function parseRatesPayload(
  payload: unknown,
  expectedBase: string,
): { date: string; rates: Record<string, number> } | null {
  if (!payload || typeof payload !== "object") return null;
  const body = payload as FrankfurterPayload;

  if (body.base !== expectedBase) return null;
  if (typeof body.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) return null;
  if (!body.rates || typeof body.rates !== "object") return null;

  const rates: Record<string, number> = {};
  for (const [code, value] of Object.entries(body.rates)) {
    if (!/^[A-Z]{3}$/.test(code)) continue;
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) continue;
    rates[code] = value;
  }

  if (Object.keys(rates).length === 0) return null;
  return { date: body.date, rates };
}

export function convertAmount(
  amount: number,
  from: string,
  to: string,
  snapshot: Pick<RateSnapshot, "base" | "rates"> | null,
): number | null {
  if (!Number.isFinite(amount)) return null;
  if (from === to) return amount;
  if (!snapshot || snapshot.base !== to) return null;
  const rate = snapshot.rates[from];
  if (!rate || !Number.isFinite(rate)) return null;
  return amount / rate;
}

async function readStored(base: string): Promise<RateSnapshot | null> {
  const currency = await db.currency.findUnique({
    where: { code: base },
    include: {
      baseRates: {
        include: { quoteCurrency: { select: { code: true } } },
        orderBy: [{ rateDate: "desc" }, { fetchedAt: "desc" }],
      },
    },
  });

  if (!currency || currency.baseRates.length === 0) return null;

  const latest = new Map<string, { rate: number; rateDate: Date; fetchedAt: Date }>();
  for (const row of currency.baseRates) {
    const code = row.quoteCurrency.code;
    if (latest.has(code)) continue;
    latest.set(code, {
      rate: Number(row.rate.toString()),
      rateDate: row.rateDate,
      fetchedAt: row.fetchedAt,
    });
  }

  const rates: Record<string, number> = {};
  let newestFetched = new Date(0);
  let newestRateDate = new Date(0);
  for (const [code, value] of latest) {
    rates[code] = value.rate;
    if (value.fetchedAt > newestFetched) newestFetched = value.fetchedAt;
    if (value.rateDate > newestRateDate) newestRateDate = value.rateDate;
  }

  return {
    base,
    rateDate: newestRateDate.toISOString().slice(0, 10),
    fetchedAt: newestFetched,
    rates,
    source: SOURCE,
    stale: false,
  };
}

async function fetchAndStore(base: string): Promise<RateSnapshot | null> {
  const response = await fetch(`${ENDPOINT}?from=${encodeURIComponent(base)}`, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Frankfurter returned HTTP ${response.status}`);
  }

  const parsed = parseRatesPayload(await response.json(), base);
  if (!parsed) {
    throw new Error("Frankfurter returned an unexpected payload");
  }

  const fetchedAt = new Date();
  const rateDate = new Date(`${parsed.date}T00:00:00.000Z`);

  const baseCurrency = await db.currency.upsert({
    where: { code: base },
    update: {},
    create: { code: base, name: base },
  });

  const quoteCodes = Object.keys(parsed.rates);
  const existing = await db.currency.findMany({
    where: { code: { in: quoteCodes } },
    select: { code: true },
  });
  const existingCodes = new Set(existing.map((row) => row.code));

  for (const code of quoteCodes) {
    if (!existingCodes.has(code)) {
      await db.currency.create({ data: { code, name: code } });
    }
  }

  const quotes = await db.currency.findMany({
    where: { code: { in: quoteCodes } },
    select: { id: true, code: true },
  });

  const writes = quotes.flatMap((quote) => {
    const rate = parsed.rates[quote.code];
    if (rate === undefined) return [];

    return [
      db.exchangeRate.upsert({
        where: {
          baseCurrencyId_quoteCurrencyId_rateDate_sourceName: {
            baseCurrencyId: baseCurrency.id,
            quoteCurrencyId: quote.id,
            rateDate,
            sourceName: SOURCE,
          },
        },
        update: { rate, fetchedAt },
        create: {
          baseCurrencyId: baseCurrency.id,
          quoteCurrencyId: quote.id,
          rate,
          rateDate,
          sourceName: SOURCE,
          fetchedAt,
        },
      }),
    ];
  });

  if (writes.length > 0) {
    await db.$transaction(writes);
  }

  return {
    base,
    rateDate: parsed.date,
    fetchedAt,
    rates: parsed.rates,
    source: SOURCE,
    stale: false,
  };
}

export async function getRates(base: string): Promise<RateSnapshot | null> {
  const code = base.toUpperCase();
  if (!/^[A-Z]{3}$/.test(code)) return null;

  const stored = await readStored(code);
  if (stored && Date.now() - stored.fetchedAt.getTime() < MAX_AGE_MS) {
    return stored;
  }

  try {
    return await fetchAndStore(code);
  } catch (error) {
    console.warn("exchange-rate-fetch-failed", {
      base: code,
      message: error instanceof Error ? error.message : "unknown",
    });
    return stored ? { ...stored, stale: true } : null;
  }
}
