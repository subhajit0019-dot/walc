import { NextRequest, NextResponse } from "next/server";
import { db, memoryClients } from "@/db";
import { clients, checkinLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { clientCheckRequestSchema } from "@/lib/validators";
import { checkRateLimit, verifyAndStoreNonce } from "@/lib/ratelimit";
import { signPayload } from "@/lib/signing";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
  const userAgent = req.headers.get("user-agent") || "CursedClient/1.0";

  try {
    const body = await req.json();
    const result = clientCheckRequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid check request parameters" },
        { status: 400 }
      );
    }

    const { clientId, timestamp, nonce } = result.data;
    const now = Math.floor(Date.now() / 1000);

    // 1. Freshness check: Reject requests older than 60s or drifting more than 60s into future
    if (Math.abs(now - timestamp) > 60) {
      return NextResponse.json(
        { error: "Timestamp expired or clock desynchronized" },
        { status: 400 }
      );
    }

    // 2. Replay attack protection: Verify nonce has not been used within 120s
    const isFreshNonce = await verifyAndStoreNonce(`${clientId}:${nonce}`, 120);
    if (!isFreshNonce) {
      // Log replay attempt
      await db.insert(checkinLogs).values({
        clientId,
        ipAddress: ip,
        userAgent,
        status: "replay_detected",
      });
      return NextResponse.json(
        { error: "Replay attack detected: nonce already consumed" },
        { status: 409 }
      );
    }

    // 3. Rate limiting: 30 requests per minute per clientId + IP
    const rateLimit = await checkRateLimit(`check_limit:${clientId}:${ip}`, 30, 60);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    // 4. Query client from database or memory
    let client = null;
    try {
      const [dbClient] = await db.select().from(clients).where(eq(clients.id, clientId));
      if (dbClient) client = dbClient;
    } catch (e) {
      console.warn("DB client check lookup fallback:", e);
    }

    if (!client && memoryClients.has(clientId)) {
      client = memoryClients.get(clientId);
    }

    const privateKey =
      process.env.ED25519_PRIVATE_KEY ||
      "1f4f20a99738ba342e309d420fb3471a9841c0e2892511027dfddfa1b0598168";

    // If client does not exist
    if (!client) {
      return NextResponse.json({ error: "Client ID not recognized" }, { status: 404 });
    }

    // Check expiry
    let effectiveStatus = client.status;
    if (client.expiresAt && new Date() > new Date(client.expiresAt)) {
      effectiveStatus = "suspended";
    }

    // Log the check-in event
    await db.insert(checkinLogs).values({
      clientId: client.id,
      ipAddress: ip,
      userAgent,
      status: effectiveStatus,
    });

    // If suspended or revoked, return maintenance shutdown response signed
    if (effectiveStatus !== "active") {
      const shutdownPayload = {
        status: effectiveStatus,
        clientId: client.id,
        timestamp: now,
        nonce,
        maintenance: {
          title: client.maintenanceTitle,
          text: client.maintenanceText,
        },
      };

      const canonicalString = JSON.stringify(shutdownPayload);
      const signature = await signPayload(canonicalString, privateKey);

      return NextResponse.json({
        status: effectiveStatus,
        timestamp: now,
        nonce,
        maintenance: shutdownPayload.maintenance,
        signature,
      });
    }

    // Client is ACTIVE: build complete runtime config
    const configData = {
      cheat_name: client.cheatName,
      title_part1: client.titlePart1,
      title_part2: client.titlePart2,
      window_title: client.windowTitle,
      subtitle: client.subtitle,
      loading_text: client.loadingText,
      discord_invite_url: client.discordInviteUrl,
      rpc: {
        enabled: client.rpcEnabled,
        app_id: client.rpcAppId,
        state: client.rpcState,
        details: client.rpcDetails,
        large_image: client.rpcLargeImage,
        large_text: client.rpcLargeText,
        small_image: client.rpcSmallImage,
        small_text: client.rpcSmallText,
        b1_label: client.rpcButton1Label,
        b1_url: client.rpcButton1Url,
        b2_label: client.rpcButton2Label,
        b2_url: client.rpcButton2Url,
      },
      enable_auth: client.enableAuth,
      auth_name: client.authName,
      auth_owner_id: client.authOwnerId,
      auth_secret: client.authSecret,
      auth_version: client.authVersion,
      auth_url: client.authUrl,
      auth_path: client.authPath,
      enable_maintenance: client.enableMaintenanceCheck,
      maintenance_title: client.maintenanceTitle,
      maintenance_text: client.maintenanceText,
    };

    // Construct canonical object to sign
    const responsePayload = {
      status: "active",
      clientId: client.id,
      timestamp: now,
      nonce,
      expires_at: client.expiresAt ? client.expiresAt.toISOString() : null,
      config: configData,
    };

    const canonicalString = JSON.stringify(responsePayload);
    const signature = await signPayload(canonicalString, privateKey);

    return NextResponse.json({
      status: "active",
      timestamp: now,
      nonce,
      expires_at: responsePayload.expires_at,
      config: configData,
      signature,
    });
  } catch (error) {
    console.error("POST /api/client/check error:", error);
    return NextResponse.json(
      { error: "Internal check verification failed" },
      { status: 500 }
    );
  }
}
