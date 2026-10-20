"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, LogOut, Terminal, Cpu } from "lucide-react";
import { Button } from "./ui/button";

export function AdminNavbar() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (e) {
      console.error("Logout failed:", e);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-white text-base">
                  CURSED ENGINE
                </span>
                <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-cyan-400 border border-cyan-500/30">
                  KERNEL
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Multi-Client Management Panel
              </p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Ed25519 Engine Live</span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1.5 text-cyan-400">
              <Cpu className="h-3.5 w-3.5" />
              <span>Neon Postgres</span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 gap-2 font-mono text-xs"
          >
            <LogOut className="h-4 w-4" />
            <span>Disconnect</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
