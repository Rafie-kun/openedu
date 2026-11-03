import { db } from "@edubuf/database";
import { isAiConfigured, isEmailConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

// no secrets here, only whether each optional integration has been configured
export async function GET() {
  let database: "ok" | "unreachable" = "ok";

  try {
    await db.$queryRaw`SELECT 1`;
  } catch {
    database = "unreachable";
  }

  const status = database === "ok" ? "ok" : "degraded";

  return Response.json(
    {
      status,
      checkedAt: new Date().toISOString(),
      checks: {
        database,
        ai: isAiConfigured() ? "configured" : "not configured",
        email: isEmailConfigured() ? "configured" : "not configured",
        storage: process.env.STORAGE_DRIVER === "s3" ? "s3" : "local",
        rateLimiting: process.env.RATE_LIMIT_DISABLED === "true" ? "disabled" : "enabled",
      },
    },
    {
      status: database === "ok" ? 200 : 503,
      headers: { "cache-control": "no-store" },
    },
  );
}
