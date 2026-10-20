import React from "react";
import { Badge } from "./ui/badge";
import { formatDate } from "@/lib/utils";
import { ShieldCheck, ShieldAlert, AlertOctagon } from "lucide-react";

interface LogItem {
  id: string;
  clientId: string;
  clientName: string | null;
  clientExeName: string | null;
  ipAddress: string;
  userAgent: string | null;
  status: string;
  createdAt: string;
}

export function CheckinLogsTable({ logs }: { logs: LogItem[] }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-md overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950/80 text-xs uppercase font-mono text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-6 py-3.5">Client Profile</th>
              <th className="px-6 py-3.5">IP Address</th>
              <th className="px-6 py-3.5">Handshake Status</th>
              <th className="px-6 py-3.5">User Agent</th>
              <th className="px-6 py-3.5 text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                  No check-in handshake signals recorded yet.
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const isSuccess = log.status === "active";
                const isReplay = log.status === "replay_detected";

                return (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="font-semibold text-white">
                        {log.clientName || "Unknown Client"}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">
                        {log.clientId.substring(0, 16)}...
                      </div>
                    </td>

                    <td className="px-6 py-3.5">
                      <code className="text-xs font-mono text-cyan-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {log.ipAddress}
                      </code>
                    </td>

                    <td className="px-6 py-3.5">
                      <Badge
                        variant={
                          isSuccess
                            ? "success"
                            : isReplay
                            ? "destructive"
                            : log.status === "suspended"
                            ? "warning"
                            : "destructive"
                        }
                        className="gap-1.5"
                      >
                        {isSuccess ? (
                          <ShieldCheck className="h-3 w-3" />
                        ) : isReplay ? (
                          <AlertOctagon className="h-3 w-3" />
                        ) : (
                          <ShieldAlert className="h-3 w-3" />
                        )}
                        <span>{log.status.toUpperCase()}</span>
                      </Badge>
                    </td>

                    <td className="px-6 py-3.5 text-xs text-slate-400 font-mono max-w-[200px] truncate">
                      {log.userAgent || "CursedClient"}
                    </td>

                    <td className="px-6 py-3.5 text-xs font-mono text-slate-400 text-right">
                      {formatDate(log.createdAt)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
