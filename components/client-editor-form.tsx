"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  Download,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Copy,
  Check,
  Disc as Discord,
  Key,
  Shield,
  Layers,
  Sparkles,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { Badge } from "./ui/badge";
import { ClientPreviewCard } from "./client-preview-card";

interface ClientFormProps {
  initialData?: any;
  isNew?: boolean;
}

export function ClientEditorForm({ initialData, isNew = false }: ClientFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: initialData?.name || "Premium Client 01",
    status: initialData?.status || "active",
    exeName: initialData?.exeName || "MeowGG_Loader.exe",
    
    // Branding
    cheatName: initialData?.cheatName || "MeowGG",
    titlePart1: initialData?.titlePart1 || "Meow",
    titlePart2: initialData?.titlePart2 || ".GG",
    windowTitle: initialData?.windowTitle || "MeowGG",
    subtitle: initialData?.subtitle || "Dev : Subhajit | MeowGG",
    loadingText: initialData?.loadingText || "Connecting To DataBase",
    discordInviteUrl: initialData?.discordInviteUrl || "https://discord.gg/meowgg",

    // Discord RPC
    rpcEnabled: initialData?.rpcEnabled ?? true,
    rpcAppId: initialData?.rpcAppId || "1561024986851057715",
    rpcState: initialData?.rpcState || "MeowGG",
    rpcDetails: initialData?.rpcDetails || "discord.gg/meowgg",
    rpcLargeImage:
      initialData?.rpcLargeImage ||
      "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHVucnVxYmliMWF1NXoyYmd3YzhobTBvZmFtbXdwaHY4MzhxdGtidCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/vas3wYC3KZ9AEo01xn/giphy.gif",
    rpcLargeText: initialData?.rpcLargeText || "MeowGG Community",
    rpcSmallImage:
      initialData?.rpcSmallImage || "https://cdn3.emoji.gg/emojis/5863-verified-red-animated.gif",
    rpcSmallText: initialData?.rpcSmallText || "Developer : Subhajit",
    rpcButton1Label: initialData?.rpcButton1Label || "<3 Buying Here !",
    rpcButton1Url: initialData?.rpcButton1Url || "https://discord.gg/meowgg",
    rpcButton2Label: initialData?.rpcButton2Label || "Developer",
    rpcButton2Url: initialData?.rpcButton2Url || "https://discord.gg/meowgg",

    // LicenseAuth
    enableAuth: initialData?.enableAuth ?? true,
    authName: initialData?.authName || "all free",
    authOwnerId: initialData?.authOwnerId || "29B4YqY38s",
    authSecret: initialData?.authSecret || "",
    authVersion: initialData?.authVersion || "1.0",
    authUrl: initialData?.authUrl || "https://licenseauth.help/api/1.3/",
    authPath: initialData?.authPath || "",

    // Maintenance Killswitch
    enableMaintenanceCheck: initialData?.enableMaintenanceCheck ?? true,
    maintenanceTitle: initialData?.maintenanceTitle || "Maintenance Notice",
    maintenanceText: initialData?.maintenanceText || "EXE Under Maintenance. Contact Owner.",

    expiresAt: initialData?.expiresAt
      ? new Date(initialData.expiresAt).toISOString().split("T")[0]
      : "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCopyId = () => {
    if (!initialData?.id) return;
    navigator.clipboard.writeText(initialData.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const url = isNew ? "/api/admin/clients" : `/api/admin/clients/${initialData.id}`;
      const method = isNew ? "POST" : "PATCH";

      const payload = {
        ...formData,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save client");
      }

      router.push("/clients");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadExe = async () => {
    if (!initialData?.id) return;
    setDownloading(true);
    try {
      // The endpoint handles streaming with custom attachment filename
      window.location.href = `/api/download/${initialData.id}`;
    } catch (err) {
      console.error("Download trigger failed:", err);
    } finally {
      setTimeout(() => setDownloading(false), 2000);
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id) return;
    if (!confirm("Are you sure you want to permanently delete this client?")) return;

    try {
      const res = await fetch(`/api/admin/clients/${initialData.id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/clients");
        router.refresh();
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Form Content */}
      <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-8">
        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-4 text-sm text-rose-300 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Client ID / Quick Controls */}
        {!isNew && initialData?.id && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <Label className="text-[10px] text-slate-500">Embedded Client UUID</Label>
              <div className="flex items-center gap-2 mt-0.5">
                <code className="text-xs font-mono text-cyan-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                  {initialData.id}
                </code>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-slate-400 hover:text-white"
                  onClick={handleCopyId}
                >
                  {copiedId ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="glow"
                size="sm"
                onClick={handleDownloadExe}
                disabled={downloading || formData.status !== "active"}
                className="gap-2 text-xs"
              >
                <Download className="h-4 w-4" />
                <span>Download {formData.exeName}</span>
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                className="gap-1.5 text-xs"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </Button>
            </div>
          </div>
        )}

        {/* 1. General & Status */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Layers className="h-4 w-4 text-cyan-400" />
            <h3 className="font-semibold text-white text-sm">Fleet Deployment & Status</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Client Internal Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="e.g. VIP Customer 1"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="exeName">Download EXE File Name</Label>
              <Input
                id="exeName"
                value={formData.exeName}
                onChange={(e) => updateField("exeName", e.target.value)}
                placeholder="e.g. MeowGG_VIP.exe"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="status">Client Authorization Status</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => updateField("status", e.target.value)}
                className="flex h-10 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
              >
                <option value="active">Active (Access Granted)</option>
                <option value="suspended">Suspended (Killswitch Triggered)</option>
                <option value="revoked">Revoked (Permanent Ban)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="expiresAt">Optional License Expiry Date</Label>
              <Input
                id="expiresAt"
                type="date"
                value={formData.expiresAt}
                onChange={(e) => updateField("expiresAt", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* 2. Visual Branding */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <h3 className="font-semibold text-white text-sm">Visual Branding & Overlay Text</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cheatName">Full Cheat Name</Label>
              <Input
                id="cheatName"
                value={formData.cheatName}
                onChange={(e) => updateField("cheatName", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="titlePart1">Title Part 1 (Left White)</Label>
              <Input
                id="titlePart1"
                value={formData.titlePart1}
                onChange={(e) => updateField("titlePart1", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="titlePart2">Title Part 2 (Right Cyan)</Label>
              <Input
                id="titlePart2"
                value={formData.titlePart2}
                onChange={(e) => updateField("titlePart2", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="windowTitle">OS Window & Class Title</Label>
              <Input
                id="windowTitle"
                value={formData.windowTitle}
                onChange={(e) => updateField("windowTitle", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="subtitle">Subtitle / Developer Info</Label>
              <Input
                id="subtitle"
                value={formData.subtitle}
                onChange={(e) => updateField("subtitle", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="loadingText">Database Loading Text</Label>
              <Input
                id="loadingText"
                value={formData.loadingText}
                onChange={(e) => updateField("loadingText", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="discordInviteUrl">Discord Community Invite URL</Label>
              <Input
                id="discordInviteUrl"
                value={formData.discordInviteUrl}
                onChange={(e) => updateField("discordInviteUrl", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* 3. Discord RPC */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Discord className="h-4 w-4 text-indigo-400" />
              <h3 className="font-semibold text-white text-sm">Discord Rich Presence (RPC)</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">Enable RPC:</span>
              <Switch
                checked={formData.rpcEnabled}
                onCheckedChange={(val) => updateField("rpcEnabled", val)}
              />
            </div>
          </div>

          {formData.rpcEnabled && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="rpcAppId">Discord Application ID</Label>
                  <Input
                    id="rpcAppId"
                    value={formData.rpcAppId}
                    onChange={(e) => updateField("rpcAppId", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rpcState">Status Line (State)</Label>
                  <Input
                    id="rpcState"
                    value={formData.rpcState}
                    onChange={(e) => updateField("rpcState", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rpcDetails">Subtitle (Details)</Label>
                  <Input
                    id="rpcDetails"
                    value={formData.rpcDetails}
                    onChange={(e) => updateField("rpcDetails", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="rpcLargeImage">Large Image Asset Key / URL</Label>
                  <Input
                    id="rpcLargeImage"
                    value={formData.rpcLargeImage}
                    onChange={(e) => updateField("rpcLargeImage", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rpcLargeText">Large Image Tooltip</Label>
                  <Input
                    id="rpcLargeText"
                    value={formData.rpcLargeText}
                    onChange={(e) => updateField("rpcLargeText", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="rpcButton1Label">Button 1 Label</Label>
                  <Input
                    id="rpcButton1Label"
                    value={formData.rpcButton1Label}
                    onChange={(e) => updateField("rpcButton1Label", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rpcButton1Url">Button 1 Target URL</Label>
                  <Input
                    id="rpcButton1Url"
                    value={formData.rpcButton1Url}
                    onChange={(e) => updateField("rpcButton1Url", e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. LicenseAuth / KeyAuth */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-cyan-400" />
              <h3 className="font-semibold text-white text-sm">License Authentication (KeyAuth)</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">Require License:</span>
              <Switch
                checked={formData.enableAuth}
                onCheckedChange={(val) => updateField("enableAuth", val)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="authName">Application Name</Label>
              <Input
                id="authName"
                value={formData.authName}
                onChange={(e) => updateField("authName", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="authOwnerId">Owner ID (10 chars)</Label>
              <Input
                id="authOwnerId"
                value={formData.authOwnerId}
                onChange={(e) => updateField("authOwnerId", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="authSecret">Application Secret</Label>
            <Input
              id="authSecret"
              type="password"
              value={formData.authSecret}
              onChange={(e) => updateField("authSecret", e.target.value)}
              placeholder="Private key hidden"
            />
          </div>
        </div>

        {/* 5. Remote Killswitch & Maintenance */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-rose-400" />
              <h3 className="font-semibold text-white text-sm">Remote Killswitch & Maintenance Notice</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">Enable Check:</span>
              <Switch
                checked={formData.enableMaintenanceCheck}
                onCheckedChange={(val) => updateField("enableMaintenanceCheck", val)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="maintenanceTitle">Popup Dialog Title</Label>
              <Input
                id="maintenanceTitle"
                value={formData.maintenanceTitle}
                onChange={(e) => updateField("maintenanceTitle", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="maintenanceText">Popup Dialog Display Message</Label>
              <Textarea
                id="maintenanceText"
                rows={2}
                value={formData.maintenanceText}
                onChange={(e) => updateField("maintenanceText", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/clients")}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="submit" variant="glow" disabled={saving} className="gap-2 min-w-[140px]">
            {saving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{isNew ? "Deploy Client" : "Save Changes"}</span>
          </Button>
        </div>
      </form>

      {/* Right Column: Live Mock Preview */}
      <div className="lg:col-span-5">
        <ClientPreviewCard data={formData} />
      </div>
    </div>
  );
}
