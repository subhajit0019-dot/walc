import React from "react";
import { ClientEditorForm } from "@/components/client-editor-form";

export default function NewClientPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Deploy New Client Profile
        </h1>
        <p className="text-sm text-slate-400 font-mono mt-0.5">
          Configure unique branding, Discord RPC, KeyAuth credentials, and killswitch parameters
        </p>
      </div>

      <ClientEditorForm isNew={true} />
    </div>
  );
}
