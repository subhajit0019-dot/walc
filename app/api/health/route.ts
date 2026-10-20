import { NextResponse } from "next/server";
import { db, ensureTablesExist } from "@/db";
import { clients } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const connStr = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
  const hasDbUrl = Boolean(connStr && !connStr.includes("placeholder"));
  let dbStatus = hasDbUrl ? "connecting" : "not_configured";
  let clientCount = 0;
  let clientList: any[] = [];
  let dbError: string | null = null;

  if (hasDbUrl) {
    try {
      await ensureTablesExist();
      const rows = await db.select().from(clients).limit(20);
      dbStatus = "connected";
      clientCount = rows.length;
      clientList = rows.map((r) => ({ id: r.id, name: r.name, exeName: r.exeName }));
    } catch (e: any) {
      dbStatus = "error";
      dbError = e?.message || String(e);
    }
  }

  return NextResponse.json({
    status: "ok",
    hasDbUrl,
    dbStatus,
    dbError,
    clientCount,
    clientList,
    timestamp: new Date().toISOString(),
  });
}
