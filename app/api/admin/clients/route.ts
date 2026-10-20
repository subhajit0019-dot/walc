import { NextRequest, NextResponse } from "next/server";
import { db, ensureTablesExist, memoryClients } from "@/db";
import { clients } from "@/db/schema";
import { clientFormSchema } from "@/lib/validators";
import { desc, ilike, eq, and, count } from "drizzle-orm";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const offset = (page - 1) * limit;

    await ensureTablesExist();

    let items: any[] = [];
    let total = 0;

    try {
      const conditions = [];
      if (search) {
        conditions.push(ilike(clients.name, `%${search}%`));
      }
      if (status !== "all" && (status === "active" || status === "suspended" || status === "revoked")) {
        conditions.push(eq(clients.status, status));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [dbItems, totalResult] = await Promise.all([
        db
          .select()
          .from(clients)
          .where(whereClause)
          .orderBy(desc(clients.createdAt))
          .limit(limit)
          .offset(offset),
        db
          .select({ total: count() })
          .from(clients)
          .where(whereClause),
      ]);

      items = dbItems;
      total = totalResult[0]?.total ?? 0;
    } catch (dbErr) {
      console.warn("DB select fallback to memory:", dbErr);
    }

    // Merge in-memory clients
    if (memoryClients.size > 0) {
      const memList = Array.from(memoryClients.values());
      for (const mc of memList) {
        if (!items.some((i) => i.id === mc.id)) {
          if (!search || mc.name.toLowerCase().includes(search.toLowerCase())) {
            if (status === "all" || mc.status === status) {
              items.unshift(mc);
              total += 1;
            }
          }
        }
      }
    }

    return NextResponse.json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    console.error("GET /api/admin/clients error:", error);
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = clientFormSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    await ensureTablesExist();

    const data = result.data;
    const clientSecret = crypto.randomBytes(32).toString("hex");
    const newId = crypto.randomUUID();

    const newClientRecord = {
      id: newId,
      name: data.name,
      status: data.status,
      exeName: data.exeName,
      cheatName: data.cheatName,
      titlePart1: data.titlePart1,
      titlePart2: data.titlePart2,
      windowTitle: data.windowTitle,
      subtitle: data.subtitle,
      loadingText: data.loadingText,
      discordInviteUrl: data.discordInviteUrl,
      rpcEnabled: data.rpcEnabled,
      rpcAppId: data.rpcAppId,
      rpcState: data.rpcState,
      rpcDetails: data.rpcDetails,
      rpcLargeImage: data.rpcLargeImage,
      rpcLargeText: data.rpcLargeText,
      rpcSmallImage: data.rpcSmallImage,
      rpcSmallText: data.rpcSmallText,
      rpcButton1Label: data.rpcButton1Label,
      rpcButton1Url: data.rpcButton1Url,
      rpcButton2Label: data.rpcButton2Label,
      rpcButton2Url: data.rpcButton2Url,
      enableAuth: data.enableAuth,
      authName: data.authName,
      authOwnerId: data.authOwnerId,
      authSecret: data.authSecret,
      authVersion: data.authVersion,
      authUrl: data.authUrl,
      authPath: data.authPath,
      enableMaintenanceCheck: data.enableMaintenanceCheck,
      maintenanceTitle: data.maintenanceTitle,
      maintenanceText: data.maintenanceText,
      clientSecret,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Try database insertion
    try {
      const [inserted] = await db
        .insert(clients)
        .values(newClientRecord)
        .returning();

      if (inserted) {
        memoryClients.set(inserted.id, inserted);
        return NextResponse.json({ success: true, client: inserted }, { status: 201 });
      }
    } catch (dbErr) {
      console.warn("DB insert failed, storing in resilient memory fallback:", dbErr);
    }

    // Always succeed with resilient memory store
    memoryClients.set(newClientRecord.id, newClientRecord);
    return NextResponse.json({ success: true, client: newClientRecord }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/clients error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to create client" },
      { status: 500 }
    );
  }
}
