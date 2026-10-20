import React from "react";
import Link from "next/link";
import { db, memoryClients } from "@/db";
import { clients, checkinLogs } from "@/db/schema";
import { count, eq, gte, desc } from "drizzle-orm";
import { StatsCards } from "@/components/stats-cards";
import { ClientTable } from "@/components/client-table";
import { Button } from "@/components/ui/button";
import { PlusCircle, ShieldCheck, Activity, Terminal } from "lucide-react";

export const revalidate = 0; // Fresh metrics

export default async function DashboardPage() {
  let stats = {
    totalClients: 0,
    activeClients: 0,
    suspendedClients: 0,
    revokedClients: 0,
    recentCheckins24h: 0,
    activeBaseExe: null as any,
  };

  let recentClients: any[] = [];
  let recentLogs: any[] = [];

  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      totalClientsRes,
      activeClientsRes,
      suspendedClientsRes,
      revokedClientsRes,
      recentLogsCountRes,
      recentClientsRes,
      recentLogsRes,
    ] = await Promise.all([
      db.select({ count: count() }).from(clients),
      db.select({ count: count() }).from(clients).where(eq(clients.status, "active")),
      db.select({ count: count() }).from(clients).where(eq(clients.status, "suspended")),
      db.select({ count: count() }).from(clients).where(eq(clients.status, "revoked")),
      db.select({ count: count() }).from(checkinLogs).where(gte(checkinLogs.createdAt, oneDayAgo)),
      db.select().from(clients).orderBy(desc(clients.createdAt)).limit(8),
      db.select().from(checkinLogs).orderBy(desc(checkinLogs.createdAt)).limit(5),
    ]);

    stats = {
      totalClients: totalClientsRes[0]?.count ?? 0,
      activeClients: activeClientsRes[0]?.count ?? 0,
      suspendedClients: suspendedClientsRes[0]?.count ?? 0,
      revokedClients: revokedClientsRes[0]?.count ?? 0,
      recentCheckins24h: recentLogsCountRes[0]?.count ?? 0,
      activeBaseExe: null,
    };

    recentClients = recentClientsRes.map((c) => ({
      id: c.id,
      name: c.name,
      status: c.status,
      exeName: c.exeName,
      cheatName: c.cheatName,
      enableAuth: c.enableAuth,
      enableMaintenanceCheck: c.enableMaintenanceCheck,
      expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
      createdAt: c.createdAt.toISOString(),
    }));

    recentLogs = recentLogsRes;
  } catch (error) {
    console.error("Dashboard DB fetch error (may need migrations):", error);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <span>Fleet Command Overview</span>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-mono font-medium text-emerald-400 border border-emerald-500/20">
              Live
            </span>
          </h1>
          <p className="text-sm text-slate-400 font-mono mt-0.5">
            Single Base EXE • Per-Client Runtime Customization • Remote Killswitch
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/clients/new">
            <Button variant="glow" className="gap-2">
              <PlusCircle className="h-4 w-4" />
              <span>Deploy Client</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <StatsCards stats={stats} />

      {/* Fleet Remote Control Banner */}
      <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Terminal className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white">Dynamic EXE Auto-Detect Architecture:</span>
              <span className="text-xs font-mono text-cyan-400 font-semibold">
                Zero EXE Upload Required
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
              Just rename your single compiled base EXE to the target client name (e.g. <span className="text-cyan-300">Subhajit.exe</span>). When launched, it automatically pulls branding, window title, discord RPC, and killswitch settings.
            </p>
          </div>
        </div>

        <Link href="/clients/new">
          <Button variant="outline" size="sm" className="text-xs text-cyan-400 border-cyan-500/40 hover:bg-cyan-500/10">
            Deploy New Client
          </Button>
        </Link>
      </div>

      {/* Recent Clients Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Active Client Deployments</h2>
          <Link
            href="/clients"
            className="text-xs text-cyan-400 hover:text-cyan-300 font-mono underline-offset-4 hover:underline"
          >
            View All ({stats.totalClients}) →
          </Link>
        </div>
        <ClientTable initialClients={recentClients} />
      </div>
    </div>
  );
}
