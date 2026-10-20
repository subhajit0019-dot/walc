import React from "react";
import { notFound } from "next/navigation";
import { db, ensureTablesExist, memoryClients } from "@/db";
import { clients } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ClientEditorForm } from "@/components/client-editor-form";

interface ClientPageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({ params }: ClientPageProps) {
  const { id } = await params;
  let clientData = null;

  try {
    await ensureTablesExist();
    const [row] = await db.select().from(clients).where(eq(clients.id, id));
    if (row) {
      clientData = {
        ...row,
        createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
        updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
        expiresAt: row.expiresAt ? (row.expiresAt instanceof Date ? row.expiresAt.toISOString() : String(row.expiresAt)) : null,
      };
    }
  } catch (e) {
    console.error("Client fetch error:", e);
  }

  if (!clientData && memoryClients.has(id)) {
    const m = memoryClients.get(id);
    clientData = {
      ...m,
      createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : String(m.createdAt || new Date().toISOString()),
      updatedAt: m.updatedAt instanceof Date ? m.updatedAt.toISOString() : String(m.updatedAt || new Date().toISOString()),
      expiresAt: m.expiresAt ? (m.expiresAt instanceof Date ? m.expiresAt.toISOString() : String(m.expiresAt)) : null,
    };
  }

  if (!clientData) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <span>Edit Client:</span>
          <span className="text-cyan-400">{clientData.name}</span>
        </h1>
        <p className="text-sm text-slate-400 font-mono mt-0.5">
          Any configuration modifications apply instantly on the client's next launch
        </p>
      </div>

      <ClientEditorForm initialData={clientData} isNew={false} />
    </div>
  );
}
