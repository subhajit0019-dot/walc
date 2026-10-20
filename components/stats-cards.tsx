import React from "react";
import { Users, ShieldCheck, ShieldAlert, Activity, FileCode } from "lucide-react";
import { Card, CardContent } from "./ui/card";

interface StatsProps {
  stats: {
    totalClients: number;
    activeClients: number;
    suspendedClients: number;
    revokedClients: number;
    recentCheckins24h: number;
    activeBaseExe: {
      version: string;
      filename: string;
      fileHash: string;
      fileSize: number;
    } | null;
  };
}

export function StatsCards({ stats }: StatsProps) {
  const cards = [
    {
      title: "Total Clients",
      value: stats.totalClients,
      description: "Deployed custom profiles",
      icon: Users,
      color: "text-cyan-400",
      glow: "shadow-cyan-500/10",
      border: "border-cyan-500/20",
    },
    {
      title: "Active Builds",
      value: stats.activeClients,
      description: "Running with valid signature",
      icon: ShieldCheck,
      color: "text-emerald-400",
      glow: "shadow-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      title: "Suspended / Revoked",
      value: stats.suspendedClients + stats.revokedClients,
      description: "Remotely terminated via API",
      icon: ShieldAlert,
      color: "text-rose-400",
      glow: "shadow-rose-500/10",
      border: "border-rose-500/20",
    },
    {
      title: "24h Check-in Signals",
      value: stats.recentCheckins24h,
      description: "Cryptographic handshakes",
      icon: Activity,
      color: "text-indigo-400",
      glow: "shadow-indigo-500/10",
      border: "border-indigo-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <Card key={i} className={`border ${c.border} shadow-lg ${c.glow} bg-slate-900/60`}>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">
                  {c.title}
                </p>
                <div className="text-2xl font-bold tracking-tight text-white mt-1">
                  {c.value}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">{c.description}</p>
              </div>
              <div className={`p-3 rounded-xl bg-slate-950/80 border border-slate-800 ${c.color}`}>
                <Icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
