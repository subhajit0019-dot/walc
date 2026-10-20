"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Download,
  Edit3,
  Power,
  Copy,
  Check,
  Search,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Ban,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { formatDate } from "@/lib/utils";

interface ClientItem {
  id: string;
  name: string;
  status: "active" | "suspended" | "revoked";
  exeName: string;
  cheatName: string;
  enableAuth: boolean;
  enableMaintenanceCheck: boolean;
  expiresAt: string | null;
  createdAt: string;
}

export function ClientTable({ initialClients }: { initialClients: ClientItem[] }) {
  const [clients, setClients] = useState<ClientItem[]>(initialClients);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.exeName.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStatusToggle = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "active" ? "suspended" : "active";
    try {
      const res = await fetch(`/api/admin/clients/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setClients((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status: nextStatus as any } : c))
        );
      }
    } catch (e) {
      console.error("Status toggle failed:", e);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, exe or ID..."
              className="pl-9 bg-slate-900/60"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-lg border border-slate-700 bg-slate-900/80 px-3 text-sm text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="revoked">Revoked</option>
          </select>
        </div>

        <Link href="/clients/new">
          <Button variant="glow" className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            <span>Deploy New Client</span>
          </Button>
        </Link>
      </div>

      {/* Table Container */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-md overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs uppercase font-mono text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Client & Exe</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Security & Auth</th>
                <th className="px-6 py-3.5">Created</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No clients found matching your search criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((client) => (
                  <tr
                    key={client.id}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-white flex items-center gap-2">
                          <span>{client.name}</span>
                          <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/50 px-1.5 py-0.5 rounded border border-cyan-800/50">
                            {client.exeName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-[11px] font-mono text-slate-500">
                            {client.id.substring(0, 18)}...
                          </code>
                          <button
                            type="button"
                            onClick={() => handleCopy(client.id)}
                            className="text-slate-500 hover:text-cyan-400 transition-colors"
                            title="Copy full client UUID"
                          >
                            {copiedId === client.id ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          client.status === "active"
                            ? "success"
                            : client.status === "suspended"
                            ? "warning"
                            : "destructive"
                        }
                      >
                        {client.status.toUpperCase()}
                      </Badge>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-xs space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500">Auth:</span>
                          <span
                            className={
                              client.enableAuth ? "text-emerald-400 font-medium" : "text-amber-400"
                            }
                          >
                            {client.enableAuth ? "KeyAuth Enabled" : "Bypass (Free)"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500">Killswitch:</span>
                          <span
                            className={
                              client.enableMaintenanceCheck
                                ? "text-cyan-400"
                                : "text-slate-500"
                            }
                          >
                            {client.enableMaintenanceCheck ? "Active" : "Disabled"}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-xs font-mono text-slate-400">
                      {formatDate(client.createdAt)}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/api/download/${client.id}`}
                          title="Export Client Config JSON"
                          className={
                            client.status !== "active"
                              ? "pointer-events-none opacity-40"
                              : ""
                          }
                        >
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 text-cyan-400 hover:text-white hover:bg-cyan-500/20"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </a>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleStatusToggle(client.id, client.status)}
                          title={
                            client.status === "active"
                              ? "Trigger Remote Killswitch"
                              : "Restore Access"
                          }
                          className={`h-8 w-8 ${
                            client.status === "active"
                              ? "text-slate-400 hover:text-amber-400"
                              : "text-emerald-400 hover:bg-emerald-500/10"
                          }`}
                        >
                          <Power className="h-4 w-4" />
                        </Button>

                        <Link href={`/clients/${client.id}`}>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-8 gap-1.5 text-xs"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            <span>Edit</span>
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
