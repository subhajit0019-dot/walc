import { NextResponse } from "next/server";
import { db } from "@/db";
import { clients, baseExes, checkinLogs } from "@/db/schema";
import { eq, count, gte, desc } from "drizzle-orm";

export async function GET() {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      totalClientsResult,
      activeClientsResult,
      suspendedClientsResult,
      revokedClientsResult,
      recentLogsResult,
      latestExeResult,
    ] = await Promise.all([
      db.select({ count: count() }).from(clients),
      db.select({ count: count() }).from(clients).where(eq(clients.status, "active")),
      db.select({ count: count() }).from(clients).where(eq(clients.status, "suspended")),
      db.select({ count: count() }).from(clients).where(eq(clients.status, "revoked")),
      db.select({ count: count() }).from(checkinLogs).where(gte(checkinLogs.createdAt, oneDayAgo)),
      db.select().from(baseExes).where(eq(baseExes.isActive, true)).limit(1),
    ]);

    return NextResponse.json({
      totalClients: totalClientsResult[0]?.count ?? 0,
      activeClients: activeClientsResult[0]?.count ?? 0,
      suspendedClients: suspendedClientsResult[0]?.count ?? 0,
      revokedClients: revokedClientsResult[0]?.count ?? 0,
      recentCheckins24h: recentLogsResult[0]?.count ?? 0,
      activeBaseExe: latestExeResult[0] || null,
    });
  } catch (error) {
    console.error("GET /api/admin/stats error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 });
  }
}
