"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Lock, Mail, AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          honeypot,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to authenticate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-slate-950 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Login Card */}
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-2xl p-8 shadow-2xl shadow-cyan-950/30">
        <div className="text-center space-y-2 mb-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-500 shadow-lg shadow-cyan-500/30">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            CURSED ENGINE
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Cryptographic Client Fleet Control Panel
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3.5 text-xs text-rose-300 flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Honeypot field for bot detection */}
          <input
            type="text"
            name="hp_field"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            style={{ display: "none" }}
            tabIndex={-1}
            autoComplete="off"
          />

          <div className="space-y-1.5">
            <Label htmlFor="email" className="flex items-center gap-1.5 text-slate-400">
              <Mail className="h-3.5 w-3.5" />
              <span>Operator Email</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@cursedengine.internal"
              required
              className="bg-slate-950/70 border-slate-700"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="flex items-center gap-1.5 text-slate-400">
              <Lock className="h-3.5 w-3.5" />
              <span>Passphrase</span>
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              className="bg-slate-950/70 border-slate-700"
            />
          </div>

          <Button
            type="submit"
            variant="glow"
            disabled={loading}
            className="w-full mt-2 h-11 text-sm font-semibold gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>Authenticate Session</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-500 font-mono">
            Fail-Closed Ed25519 Architecture • Zero-Trust Security
          </p>
        </div>
      </div>
    </div>
  );
}
