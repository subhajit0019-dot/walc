"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  PlusCircle,
  FileCode2,
  Activity,
  KeyRound,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    title: "Overview",
    items: [
      {
        name: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "Client Fleet",
    items: [
      {
        name: "All Clients",
        href: "/clients",
        icon: Users,
      },
      {
        name: "Deploy New Client",
        href: "/clients/new",
        icon: PlusCircle,
      },
    ],
  },
  {
    title: "Binary Management",
    items: [
      {
        name: "Base EXE Engine",
        href: "/base-exe",
        icon: FileCode2,
      },
      {
        name: "Check-in Logs",
        href: "/logs",
        icon: Activity,
      },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 border-r border-slate-800 bg-slate-950/40 p-4 min-h-[calc(100vh-4rem)] flex flex-col justify-between">
      <div className="space-y-6">
        {NAV_ITEMS.map((section, idx) => (
          <div key={idx} className="space-y-2">
            <h4 className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 font-mono">
              {section.title}
            </h4>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href) && item.href !== "/clients/new");
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all group",
                      isActive
                        ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-500/10"
                        : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 transition-colors",
                        isActive ? "text-cyan-400" : "text-slate-500 group-hover:text-slate-300"
                      )}
                    />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <KeyRound className="h-4 w-4 text-cyan-400" />
          <span>Security Protocol</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Ed25519 digital signatures enforce zero-trust binary execution. Remote killswitch fails closed on tampered responses.
        </p>
      </div>
    </aside>
  );
}
