import { headers } from "next/headers";
import { db } from "@edubuf/database";
import { env } from "./env";
import { hashIdentifier } from "./crypto";

export async function clientFingerprint(): Promise<string> {
  const config = env();
  const store = await headers();
  const forwarded = store.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || store.get("x-real-ip") || "local";
  return hashIdentifier(ip, config.AUTH_SECRET);
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export async function rateLimit(
  bucket: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  if (process.env.RATE_LIMIT_DISABLED === "true") {
    return { allowed: true, retryAfterSeconds: 0 };
  }

  const since = new Date(Date.now() - windowSeconds * 1000);
  const count = await db.rateLimitEvent.count({
    where: { bucketKey: bucket, createdAt: { gte: since } },
  });

  if (count >= limit) {
    return { allowed: false, retryAfterSeconds: windowSeconds };
  }

  await db.rateLimitEvent.create({ data: { bucketKey: bucket } });

  // cheap opportunistic cleanup, runs on ~2% of calls
  if (Math.random() < 0.02) {
    await db.rateLimitEvent
      .deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 86_400_000) } } })
      .catch(() => undefined);
  }

  return { allowed: true, retryAfterSeconds: 0 };
}
