import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { checkinLogs, clients } from "@/db/schema";
import { desc, eq, count, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "30")));
    const offset = (page - 1) * limit;

    const conditions = [];
    if (clientId) {
      conditions.push(eq(checkinLogs.clientId, clientId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, totalResult] = await Promise.all([
      db
        .select({
          id: checkinLogs.id,
          clientId: checkinLogs.clientId,
          clientName: clients.name,
          clientExeName: clients.exeName,
          ipAddress: checkinLogs.ipAddress,
          userAgent: checkinLogs.userAgent,
          status: checkinLogs.status,
          createdAt: checkinLogs.createdAt,
        })
        .from(checkinLogs)
        .leftJoin(clients, eq(checkinLogs.clientId, clients.id))
        .where(whereClause)
        .orderBy(desc(checkinLogs.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ total: count() })
        .from(checkinLogs)
        .where(whereClause),
    ]);

    const total = totalResult[0]?.total ?? 0;

    return NextResponse.json({
      logs: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/admin/logs error:", error);
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}
