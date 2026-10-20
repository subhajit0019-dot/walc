import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { clientStatusUpdateSchema } from "@/lib/validators";
import { eq } from "drizzle-orm";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();

    const result = clientStatusUpdateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid status value", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(clients)
      .set({
        status: result.data.status,
        updatedAt: new Date(),
      })
      .where(eq(clients.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, client: updated });
  } catch (error) {
    console.error("POST /api/admin/clients/[id]/status error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
