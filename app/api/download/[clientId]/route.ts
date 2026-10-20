import { NextRequest, NextResponse } from "next/server";
import { db, memoryClients } from "@/db";
import { clients, baseExes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { checkRateLimit } from "@/lib/ratelimit";
import { computeHmacSha256, timingSafeEqualString } from "@/lib/signing";
import { getCurrentAdminSession } from "@/lib/auth";

interface Params {
  params: Promise<{ clientId: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { clientId } = await params;
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

    // Rate limit: 10 downloads per minute per IP
    const rateLimit = await checkRateLimit(`download_limit:${ip}`, 10, 60);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many download requests. Please wait a minute." },
        { status: 429 }
      );
    }

    // Check authorization: either valid signed token OR active admin session
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    let isAuthorized = false;

    if (token) {
      const parts = token.split(".");
      if (parts.length === 2) {
        const timestamp = parseInt(parts[0]);
        const signature = parts[1];
        const now = Math.floor(Date.now() / 1000);
        if (!isNaN(timestamp) && Math.abs(now - timestamp) <= 300) {
          const secret = process.env.DOWNLOAD_TOKEN_SECRET || "fallback_download_secret_32bytes_long";
          const expectedSig = computeHmacSha256(`${clientId}:${timestamp}`, secret);
          if (timingSafeEqualString(signature, expectedSig)) {
            isAuthorized = true;
          }
        }
      }
    }

    if (!isAuthorized) {
      const adminSession = await getCurrentAdminSession();
      if (adminSession) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized or expired download token" },
        { status: 403 }
      );
    }

    // Verify client exists in DB or memory
    let client = null;
    try {
      const [dbClient] = await db.select().from(clients).where(eq(clients.id, clientId));
      if (dbClient) client = dbClient;
    } catch (e) {
      console.warn("DB client fetch fallback:", e);
    }

    if (!client && memoryClients.has(clientId)) {
      client = memoryClients.get(clientId);
    }

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    if (client.status !== "active") {
      return NextResponse.json(
        { error: `Client status is ${client.status}. Cannot download.` },
        { status: 403 }
      );
    }

    // Check if an active base EXE binary exists in storage
    let baseExe = null;
    try {
      const [dbExe] = await db
        .select()
        .from(baseExes)
        .where(eq(baseExes.isActive, true))
        .limit(1);
      if (dbExe) baseExe = dbExe;
    } catch (e) {
      console.warn("Base exe select fallback:", e);
    }

    // If a base EXE is uploaded in Blob, serve it
    if (baseExe && baseExe.blobUrl) {
      try {
        const blobRes = await fetch(baseExe.blobUrl);
        if (blobRes.ok) {
          const downloadName = client.exeName.endsWith(".exe") ? client.exeName : `${client.exeName}.exe`;
          const headers = new Headers();
          headers.set("Content-Disposition", `attachment; filename="${downloadName}"`);
          headers.set("Content-Type", "application/octet-stream");
          headers.set("Content-Length", baseExe.fileSize.toString());
          return new NextResponse(blobRes.body, { status: 200, headers });
        }
      } catch (blobErr) {
        console.warn("Blob fetch failed, serving config json instead:", blobErr);
      }
    }

    // No base EXE upload needed: Export client profile configuration as JSON
    const configPayload = {
      clientId: client.id,
      name: client.name,
      status: client.status,
      exeName: client.exeName,
      cheatName: client.cheatName,
      titlePart1: client.titlePart1,
      titlePart2: client.titlePart2,
      windowTitle: client.windowTitle,
      subtitle: client.subtitle,
      loadingText: client.loadingText,
      discordInviteUrl: client.discordInviteUrl,
      rpc: {
        enabled: client.rpcEnabled,
        appId: client.rpcAppId,
        state: client.rpcState,
        details: client.rpcDetails,
        largeImage: client.rpcLargeImage,
        largeText: client.rpcLargeText,
        smallImage: client.rpcSmallImage,
        smallText: client.rpcSmallText,
        button1Label: client.rpcButton1Label,
        button1Url: client.rpcButton1Url,
        button2Label: client.rpcButton2Label,
        button2Url: client.rpcButton2Url,
      },
      auth: {
        enabled: client.enableAuth,
        name: client.authName,
        ownerId: client.authOwnerId,
        version: client.authVersion,
        url: client.authUrl,
        path: client.authPath,
      },
      maintenance: {
        enabled: client.enableMaintenanceCheck,
        title: client.maintenanceTitle,
        text: client.maintenanceText,
      },
      cppSnippet: `ClientRuntime::CLIENT_ID = "${client.id}";`,
    };

    const jsonHeaders = new Headers();
    jsonHeaders.set("Content-Disposition", `attachment; filename="${client.name}_Config.json"`);
    jsonHeaders.set("Content-Type", "application/json");

    return new NextResponse(JSON.stringify(configPayload, null, 2), {
      status: 200,
      headers: jsonHeaders,
    });
  } catch (error) {
    console.error("GET /api/download/[clientId] error:", error);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
