import { NextRequest, NextResponse } from "next/server";
import { db, ensureTablesExist, memoryClients } from "@/db";
import { clients } from "@/db/schema";
import { clientFormSchema } from "@/lib/validators";
import { eq } from "drizzle-orm";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    let client = null;

    try {
      await ensureTablesExist();
      const [dbClient] = await db.select().from(clients).where(eq(clients.id, id));
      if (dbClient) client = dbClient;
    } catch (e) {
      console.warn("DB select [id] fallback:", e);
    }

    if (!client && memoryClients.has(id)) {
      client = memoryClients.get(id);
    }

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json({ client });
  } catch (error) {
    console.error("GET /api/admin/clients/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();

    try {
      await ensureTablesExist();
    } catch (e) {}

    const partialSchema = clientFormSchema.partial();
    const result = partialSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const data = result.data;
    const updateValues: Record<string, any> = {
      ...data,
      updatedAt: new Date(),
    };
    if (data.expiresAt !== undefined) {
      if (data.expiresAt && typeof data.expiresAt === "string" && data.expiresAt.trim() !== "") {
        const d = new Date(data.expiresAt);
        updateValues.expiresAt = isNaN(d.getTime()) ? null : d;
      } else {
        updateValues.expiresAt = null;
      }
    }

    let updatedClient = null;

    try {
      const [dbUpdated] = await db
        .update(clients)
        .set(updateValues)
        .where(eq(clients.id, id))
        .returning();
      if (dbUpdated) updatedClient = dbUpdated;
    } catch (e) {
      console.warn("DB update [id] fallback:", e);
    }

    if (memoryClients.has(id)) {
      const existing = memoryClients.get(id);
      const merged = { ...existing, ...updateValues };
      memoryClients.set(id, merged);
      if (!updatedClient) updatedClient = merged;
    }

    if (!updatedClient) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, client: updatedClient });
  } catch (error) {
    console.error("PATCH /api/admin/clients/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    let deleted = false;

    try {
      await ensureTablesExist();
      const [dbDeleted] = await db.delete(clients).where(eq(clients.id, id)).returning();
      if (dbDeleted) deleted = true;
    } catch (e) {
      console.warn("DB delete [id] fallback:", e);
    }

    if (memoryClients.has(id)) {
      memoryClients.delete(id);
      deleted = true;
    }

    if (!deleted) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Client deleted" });
  } catch (error) {
    console.error("DELETE /api/admin/clients/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
