import React from "react";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { desc } from "drizzle-orm";
import { ClientTable } from "@/components/client-table";

export const revalidate = 0;

export default async function ClientsPage() {
  let initialClients: any[] = [];

  try {
    const rows = await db
      .select()
      .from(clients)
      .orderBy(desc(clients.createdAt));

    initialClients = rows.map((c) => ({
      id: c.id,
      name: c.name,
      status: c.status,
      exeName: c.exeName,
      cheatName: c.cheatName,
      enableAuth: c.enableAuth,
      enableMaintenanceCheck: c.enableMaintenanceCheck,
      expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
      createdAt: c.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error("Failed to load clients:", error);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Client Fleet Management
        </h1>
        <p className="text-sm text-slate-400 font-mono mt-0.5">
          Manage, customize branding, download per-client EXEs, and remotely terminate access
        </p>
      </div>

      <ClientTable initialClients={initialClients} />
    </div>
  );
}
