import { db } from "@/db";
import { getGatewayProfile } from "@/lib/gateway-profile";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  let databaseOk = true;

  try {
    await db.execute(sql`select 1`);
  } catch {
    databaseOk = false;
  }

  return Response.json(
    {
      ok: databaseOk,
      database: {
        ok: databaseOk,
      },
      profile: getGatewayProfile(),
    },
    {
      status: databaseOk ? 200 : 503,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
