import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { clientFormSchema } from "@/lib/validators";
import { eq } from "drizzle-orm";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const [client] = await db.select().from(clients).where(eq(clients.id, id));

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
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateValues.name = data.name;
    if (data.status !== undefined) updateValues.status = data.status;
    if (data.exeName !== undefined) updateValues.exeName = data.exeName;
    if (data.cheatName !== undefined) updateValues.cheatName = data.cheatName;
    if (data.titlePart1 !== undefined) updateValues.titlePart1 = data.titlePart1;
    if (data.titlePart2 !== undefined) updateValues.titlePart2 = data.titlePart2;
    if (data.windowTitle !== undefined) updateValues.windowTitle = data.windowTitle;
    if (data.subtitle !== undefined) updateValues.subtitle = data.subtitle;
    if (data.loadingText !== undefined) updateValues.loadingText = data.loadingText;
    if (data.discordInviteUrl !== undefined) updateValues.discordInviteUrl = data.discordInviteUrl;
    if (data.rpcEnabled !== undefined) updateValues.rpcEnabled = data.rpcEnabled;
    if (data.rpcAppId !== undefined) updateValues.rpcAppId = data.rpcAppId;
    if (data.rpcState !== undefined) updateValues.rpcState = data.rpcState;
    if (data.rpcDetails !== undefined) updateValues.rpcDetails = data.rpcDetails;
    if (data.rpcLargeImage !== undefined) updateValues.rpcLargeImage = data.rpcLargeImage;
    if (data.rpcLargeText !== undefined) updateValues.rpcLargeText = data.rpcLargeText;
    if (data.rpcSmallImage !== undefined) updateValues.rpcSmallImage = data.rpcSmallImage;
    if (data.rpcSmallText !== undefined) updateValues.rpcSmallText = data.rpcSmallText;
    if (data.rpcButton1Label !== undefined) updateValues.rpcButton1Label = data.rpcButton1Label;
    if (data.rpcButton1Url !== undefined) updateValues.rpcButton1Url = data.rpcButton1Url;
    if (data.rpcButton2Label !== undefined) updateValues.rpcButton2Label = data.rpcButton2Label;
    if (data.rpcButton2Url !== undefined) updateValues.rpcButton2Url = data.rpcButton2Url;
    if (data.enableAuth !== undefined) updateValues.enableAuth = data.enableAuth;
    if (data.authName !== undefined) updateValues.authName = data.authName;
    if (data.authOwnerId !== undefined) updateValues.authOwnerId = data.authOwnerId;
    if (data.authSecret !== undefined) updateValues.authSecret = data.authSecret;
    if (data.authVersion !== undefined) updateValues.authVersion = data.authVersion;
    if (data.authUrl !== undefined) updateValues.authUrl = data.authUrl;
    if (data.authPath !== undefined) updateValues.authPath = data.authPath;
    if (data.enableMaintenanceCheck !== undefined)
      updateValues.enableMaintenanceCheck = data.enableMaintenanceCheck;
    if (data.maintenanceTitle !== undefined) updateValues.maintenanceTitle = data.maintenanceTitle;
    if (data.maintenanceText !== undefined) updateValues.maintenanceText = data.maintenanceText;
    if (data.expiresAt !== undefined)
      updateValues.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;

    const [updated] = await db
      .update(clients)
      .set(updateValues)
      .where(eq(clients.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, client: updated });
  } catch (error) {
    console.error("PATCH /api/admin/clients/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const [deleted] = await db.delete(clients).where(eq(clients.id, id)).returning();

    if (!deleted) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Client deleted" });
  } catch (error) {
    console.error("DELETE /api/admin/clients/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
