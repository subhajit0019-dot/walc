"use client";

import React, { useState, useEffect } from "react";
import {
  Upload,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Hash,
  Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatBytes, formatDate } from "@/lib/utils";
import { upload } from "@vercel/blob/client";

interface BaseExeItem {
  id: string;
  version: string;
  filename: string;
  fileHash: string;
  blobUrl: string;
  fileSize: number;
  isActive: boolean;
  createdAt: string;
}

export default function BaseExeManagementPage() {
  const [exes, setExes] = useState<BaseExeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [version, setVersion] = useState("1.0.0");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [manualHash, setManualHash] = useState("");
  const [manualBlobUrl, setManualBlobUrl] = useState("");
  const [useDirectUrl, setUseDirectUrl] = useState(false);

  const fetchExes = async () => {
    try {
      const res = await fetch("/api/admin/base-exe");
      const data = await res.json();
      if (res.ok) {
        setExes(data.exes || []);
      }
    } catch (err) {
      console.error("Fetch base exes error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExes();
  }, []);

  const calculateSha256 = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  const handleUploadAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      let finalBlobUrl = manualBlobUrl;
      let finalHash = manualHash;
      let finalSize = 0;
      let finalFilename = "BaseCheat.exe";

      if (!useDirectUrl) {
        if (!selectedFile) {
          throw new Error("Please select an EXE binary to upload");
        }
        finalFilename = selectedFile.name;
        finalSize = selectedFile.size;
        finalHash = await calculateSha256(selectedFile);

        // Upload to Vercel Blob client-side
        const blob = await upload(selectedFile.name, selectedFile, {
          access: "public",
          handleUploadUrl: "/api/admin/base-exe/upload",
        });

        finalBlobUrl = blob.url;
      } else {
        if (!manualBlobUrl || !manualHash) {
          throw new Error("Direct storage URL and SHA-256 hash are required");
        }
        finalSize = 1024 * 1024 * 5; // Placeholder estimated size
      }

      // Register with panel database
      const res = await fetch("/api/admin/base-exe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version,
          filename: finalFilename,
          fileHash: finalHash,
          blobUrl: finalBlobUrl,
          fileSize: finalSize,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to register base EXE");
      }

      setSuccess(`Version ${version} successfully deployed as active base binary!`);
      setSelectedFile(null);
      setVersion("1.0.1");
      await fetchExes();
    } catch (err: any) {
      setError(err.message || "Failed to deploy base binary");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <FileCode className="h-6 w-6 text-cyan-400" />
          <span>Base EXE Binary Management</span>
        </h1>
        <p className="text-sm text-slate-400 font-mono mt-0.5">
          Upload and version the foundational executable. All client builds are delivered from this master image.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-4 text-sm text-rose-300 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-sm text-emerald-300 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Upload Master EXE Card */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-cyan-400" />
            <h3 className="font-semibold text-white text-sm">Deploy New Base Release</h3>
          </div>
          <button
            type="button"
            onClick={() => setUseDirectUrl(!useDirectUrl)}
            className="text-xs font-mono text-cyan-400 hover:underline"
          >
            {useDirectUrl ? "← Switch to Direct File Upload" : "Provide Existing CDN URL →"}
          </button>
        </div>

        <form onSubmit={handleUploadAndRegister} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="version">Release Version</Label>
              <Input
                id="version"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="e.g. 1.0.0"
                required
              />
            </div>

            {!useDirectUrl ? (
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="exeFile">Select Base EXE Binary (.exe)</Label>
                <Input
                  id="exeFile"
                  type="file"
                  accept=".exe"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="file:bg-cyan-500/10 file:text-cyan-400 file:border-0 file:rounded file:px-2 file:py-1 file:text-xs file:font-mono file:mr-3"
                  required
                />
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="manualBlobUrl">Storage / CDN Blob URL</Label>
                  <Input
                    id="manualBlobUrl"
                    value={manualBlobUrl}
                    onChange={(e) => setManualBlobUrl(e.target.value)}
                    placeholder="https://...vercel-storage.com/base.exe"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="manualHash">SHA-256 Hash (64 Hex)</Label>
                  <Input
                    id="manualHash"
                    value={manualHash}
                    onChange={(e) => setManualHash(e.target.value)}
                    placeholder="64-character SHA-256 hash"
                    required
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="glow" disabled={uploading} className="gap-2">
              {uploading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              <span>{uploading ? "Hashing & Uploading..." : "Upload & Activate Base EXE"}</span>
            </Button>
          </div>
        </form>
      </div>

      {/* Version History Table */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white">Registered Base EXE Releases</h3>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-md overflow-hidden shadow-xl">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs uppercase font-mono text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Version & File</th>
                <th className="px-6 py-3.5">SHA-256 Hash</th>
                <th className="px-6 py-3.5">Size</th>
                <th className="px-6 py-3.5">State</th>
                <th className="px-6 py-3.5 text-right">Uploaded At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {exes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No base binaries registered yet. Upload one above.
                  </td>
                </tr>
              ) : (
                exes.map((exe) => (
                  <tr key={exe.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white flex items-center gap-2">
                        <span>v{exe.version}</span>
                        <span className="text-[11px] font-mono text-cyan-400">
                          {exe.filename}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Hash className="h-3 w-3 text-slate-500" />
                        <code className="text-xs font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          {exe.fileHash.substring(0, 24)}...
                        </code>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-xs font-mono text-slate-400">
                      {formatBytes(exe.fileSize)}
                    </td>

                    <td className="px-6 py-4">
                      {exe.isActive ? (
                        <Badge variant="success" className="gap-1.5">
                          <ShieldCheck className="h-3 w-3" />
                          <span>ACTIVE DEPLOYMENT</span>
                        </Badge>
                      ) : (
                        <Badge variant="secondary">ARCHIVED</Badge>
                      )}
                    </td>

                    <td className="px-6 py-4 text-xs font-mono text-slate-400 text-right">
                      {formatDate(exe.createdAt)}
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
