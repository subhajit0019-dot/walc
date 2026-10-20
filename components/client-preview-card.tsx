"use client";

import React from "react";
import { Shield, Sparkles, Disc as Discord, AlertTriangle, Key } from "lucide-react";
import { Badge } from "./ui/badge";

interface PreviewData {
  cheatName: string;
  titlePart1: string;
  titlePart2: string;
  windowTitle: string;
  subtitle: string;
  loadingText: string;
  enableAuth: boolean;
  enableMaintenanceCheck: boolean;
  maintenanceTitle: string;
  maintenanceText: string;
  rpcEnabled: boolean;
  rpcState: string;
  rpcDetails: string;
  rpcButton1Label: string;
  status: "active" | "suspended" | "revoked";
}

export function ClientPreviewCard({ data }: { data: PreviewData }) {
  const isKilled = data.status === "suspended" || data.status === "revoked";

  return (
    <div className="space-y-4 sticky top-24">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          <span>Real-time Client Overlay Preview</span>
        </h4>
        <Badge
          variant={
            data.status === "active"
              ? "success"
              : data.status === "suspended"
              ? "warning"
              : "destructive"
          }
        >
          {data.status.toUpperCase()}
        </Badge>
      </div>

      {/* Mock DirectX 11 ImGui Window Frame */}
      <div className="rounded-xl border border-cyan-500/30 bg-slate-950/90 shadow-2xl shadow-cyan-950/40 overflow-hidden font-sans">
        {/* Titlebar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs font-mono text-slate-300 select-none">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50" />
            <span className="font-semibold text-slate-200">
              {data.windowTitle || "MeowGG"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 opacity-60">
            <span className="h-2 w-2 rounded-full bg-slate-600" />
            <span className="h-2 w-2 rounded-full bg-slate-600" />
            <span className="h-2 w-2 rounded-full bg-rose-500" />
          </div>
        </div>

        {/* Window Content */}
        <div className="p-6 space-y-6 relative min-h-[340px] flex flex-col justify-between">
          {/* If killed / maintenance mode is active */}
          {isKilled ? (
            <div className="rounded-lg border border-rose-500/30 bg-rose-950/40 p-4 text-center space-y-2">
              <div className="mx-auto w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h5 className="font-bold text-rose-300 text-sm">
                {data.maintenanceTitle || "Maintenance Notice"}
              </h5>
              <p className="text-xs text-rose-400/90">
                {data.maintenanceText || "EXE Under Maintenance. Contact Owner."}
              </p>
              <p className="text-[10px] font-mono text-rose-500/80 pt-2">
                [Client will instantly terminate via signed Ed25519 payload]
              </p>
            </div>
          ) : (
            <>
              {/* Shiny Header */}
              <div className="text-center space-y-1">
                <div className="text-3xl font-extrabold tracking-tight">
                  <span className="text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
                    {data.titlePart1 || "Meow"}
                  </span>
                  <span className="text-cyan-400 drop-shadow-[0_0_12px_rgba(56,189,248,0.7)] ml-0.5">
                    {data.titlePart2 || ".GG"}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono tracking-wide">
                  {data.subtitle || "Dev : Subhajit | MeowGG"}
                </p>
              </div>

              {/* Login / Auth Box Simulation */}
              <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5 text-cyan-400" />
                    <span>License Authentication:</span>
                  </span>
                  <span
                    className={`font-semibold font-mono ${
                      data.enableAuth ? "text-emerald-400" : "text-amber-400"
                    }`}
                  >
                    {data.enableAuth ? "REQUIRED" : "FREE BYPASS"}
                  </span>
                </div>

                <div className="h-8 rounded bg-slate-950/80 border border-slate-800 px-3 flex items-center text-xs text-slate-500 font-mono">
                  Enter License Key...
                </div>

                <button
                  type="button"
                  className="w-full h-8 rounded bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold text-xs tracking-wide shadow-md shadow-cyan-600/20 pointer-events-none"
                >
                  INITIALIZE CHEAT
                </button>
              </div>

              {/* Loading Notification Box */}
              <div className="rounded-lg border border-slate-800/80 bg-slate-900/40 px-3 py-2 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                  <span>{data.loadingText || "Connecting To DataBase"}</span>
                </div>
                <span className="text-slate-600">DX11 Hook</span>
              </div>
            </>
          )}

          {/* Discord RPC Preview */}
          {data.rpcEnabled && !isKilled && (
            <div className="pt-2 border-t border-slate-800/80">
              <div className="flex items-center gap-2 mb-2 text-[10px] font-mono text-indigo-400 uppercase tracking-wider">
                <Discord className="h-3 w-3" />
                <span>Discord Rich Presence Broadcast</span>
              </div>
              <div className="rounded-lg bg-indigo-950/30 border border-indigo-500/20 p-2.5 text-xs space-y-1">
                <div className="font-semibold text-white">
                  {data.cheatName || "MeowGG"}
                </div>
                <div className="text-slate-300 text-[11px] font-mono">
                  {data.rpcState || "MeowGG"}
                </div>
                <div className="text-slate-400 text-[10px]">
                  {data.rpcDetails || "discord.gg/meowgg"}
                </div>
                {data.rpcButton1Label && (
                  <div className="mt-2 text-center py-1 rounded bg-indigo-600/20 text-indigo-300 text-[10px] font-medium border border-indigo-500/30">
                    {data.rpcButton1Label}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
