import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { and, eq, lte } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized cron invocation" }, { status: 401 });
    }

    const now = new Date();
    const expiredClients = await db
      .update(clients)
      .set({
        status: "suspended",
        updatedAt: now,
      })
      .where(and(eq(clients.status, "active"), lte(clients.expiresAt, now)))
      .returning({ id: clients.id, name: clients.name });

    return NextResponse.json({
      success: true,
      expiredCount: expiredClients.length,
      clients: expiredClients,
      executedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("Cron expire-clients error:", error);
    return NextResponse.json({ error: "Cron execution failed" }, { status: 500 });
  }
}
