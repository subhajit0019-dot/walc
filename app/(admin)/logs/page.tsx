import React from "react";
import { db } from "@/db";
import { checkinLogs, clients } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { CheckinLogsTable } from "@/components/checkin-logs-table";
import { Activity } from "lucide-react";

export const revalidate = 0;

export default async function LogsPage() {
  let logs: any[] = [];

  try {
    const rows = await db
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
      .orderBy(desc(checkinLogs.createdAt))
      .limit(100);

    logs = rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error("Failed to load checkin logs:", error);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <Activity className="h-6 w-6 text-cyan-400" />
          <span>Real-Time Check-In Audit Logs</span>
        </h1>
        <p className="text-sm text-slate-400 font-mono mt-0.5">
          Live stream of cryptographic client handshake signals, IP geolocation telemetry, and status checks
        </p>
      </div>

      <CheckinLogsTable logs={logs} />
    </div>
  );
}
