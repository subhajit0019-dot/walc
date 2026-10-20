import React from "react";
import { db, ensureTablesExist, memoryClients } from "@/db";
import { clients } from "@/db/schema";
import { desc } from "drizzle-orm";
import { ClientTable } from "@/components/client-table";

export const revalidate = 0;

export default async function ClientsPage() {
  let initialClients: any[] = [];

  try {
    await ensureTablesExist();
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
    console.error("Failed to load clients from DB:", error);
  }

  // Merge in-memory clients so no client is ever lost
  if (memoryClients.size > 0) {
    for (const mc of memoryClients.values()) {
      if (!initialClients.some((c) => c.id === mc.id)) {
        initialClients.unshift({
          id: mc.id,
          name: mc.name,
          status: mc.status,
          exeName: mc.exeName,
          cheatName: mc.cheatName,
          enableAuth: mc.enableAuth,
          enableMaintenanceCheck: mc.enableMaintenanceCheck,
          expiresAt: mc.expiresAt ? (mc.expiresAt instanceof Date ? mc.expiresAt.toISOString() : mc.expiresAt) : null,
          createdAt: mc.createdAt instanceof Date ? mc.createdAt.toISOString() : (mc.createdAt || new Date().toISOString()),
        });
      }
    }
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
