import React from "react";
import { notFound } from "next/navigation";
import { db } from "@/db";
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
    const [row] = await db.select().from(clients).where(eq(clients.id, id));
    if (row) {
      clientData = {
        ...row,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
      };
    }
  } catch (e) {
    console.error("Client fetch error:", e);
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
