import { NextRequest, NextResponse } from "next/server";
import { db, ensureTablesExist, memoryClients } from "@/db";
import { clients, checkinLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { clientCheckRequestSchema } from "@/lib/validators";
import { checkRateLimit, verifyAndStoreNonce } from "@/lib/ratelimit";
import { signPayload } from "@/lib/signing";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
  const userAgent = req.headers.get("user-agent") || "CursedClient/2.0";

  try {
    const body = await req.json();
    const result = clientCheckRequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid check request parameters", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { clientId, timestamp, nonce } = result.data;
    const now = Math.floor(Date.now() / 1000);

    // 1. Freshness check: Allow up to 300s clock drift
    if (Math.abs(now - timestamp) > 300) {
      return NextResponse.json(
        { error: "Timestamp expired or clock desynchronized" },
        { status: 400 }
      );
    }

    // 2. Replay attack protection (safe)
    try {
      const isFreshNonce = await verifyAndStoreNonce(`${clientId}:${nonce}`, 120);
      if (!isFreshNonce) {
        return NextResponse.json(
          { error: "Replay attack detected: nonce already consumed" },
          { status: 409 }
        );
      }
    } catch (nonceErr) {
      console.warn("Nonce check skipped:", nonceErr);
    }

    // 3. Rate limiting: 60 requests per minute
    try {
      const rateLimit = await checkRateLimit(`check_limit:${clientId}:${ip}`, 60, 60);
      if (!rateLimit.success) {
        return NextResponse.json(
          { error: "Rate limit exceeded" },
          { status: 429 }
        );
      }
    } catch (rlErr) {
      console.warn("Rate limit check skipped:", rlErr);
    }

    // Ensure database tables exist
    try {
      await ensureTablesExist();
    } catch (e) {}

    const cleanId = (clientId || "").trim();
    const cleanExe = cleanId.toLowerCase().endsWith(".exe") ? cleanId : `${cleanId}.exe`;
    const cleanBase = cleanId.replace(/\.exe$/i, "").toLowerCase();

    // 4. Query client from memory or database
    let client: any = null;

    // Check memory first (fastest)
    if (memoryClients.size > 0) {
      for (const mc of memoryClients.values()) {
        const mcExe = (mc.exeName || "").replace(/\.exe$/i, "").toLowerCase();
        const mcName = (mc.name || "").replace(/\.exe$/i, "").toLowerCase();
        const mcCheat = (mc.cheatName || "").replace(/\.exe$/i, "").toLowerCase();

        if (
          mc.id?.toLowerCase() === cleanId.toLowerCase() ||
          mcExe === cleanBase ||
          mcName === cleanBase ||
          mcCheat === cleanBase ||
          mc.exeName?.toLowerCase() === cleanExe.toLowerCase()
        ) {
          client = mc;
          break;
        }
      }
    }

    // Check database if not found in memory
    if (!client) {
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);
        if (isUuid) {
          const [dbClient] = await db.select().from(clients).where(eq(clients.id, cleanId));
          if (dbClient) client = dbClient;
        }

        if (!client) {
          const dbClients = await db.select().from(clients).limit(100);
          client = dbClients.find((c) => {
            const cExe = (c.exeName || "").replace(/\.exe$/i, "").toLowerCase();
            const cName = (c.name || "").replace(/\.exe$/i, "").toLowerCase();
            const cCheat = (c.cheatName || "").replace(/\.exe$/i, "").toLowerCase();
            return (
              cExe === cleanBase ||
              cName === cleanBase ||
              cCheat === cleanBase ||
              c.exeName?.toLowerCase() === cleanExe.toLowerCase()
            );
          });

          // Fallback: If user runs the generic VS project binary (example_win32_directx11.exe)
          // or if only one client profile exists in the fleet, bind to that client
          if (!client && (cleanBase.includes("example_win32") || cleanBase === "client" || dbClients.length === 1)) {
            client = dbClients.find((c) => c.status === "active") || dbClients[0];
          }
        }

        if (client) {
          memoryClients.set(client.id, client);
        }
      } catch (dbErr) {
        console.warn("DB client check lookup fallback:", dbErr);
      }
    }

    // If still not found and memory has clients, fallback for generic runner
    if (!client && memoryClients.size > 0 && (cleanBase.includes("example_win32") || cleanBase === "client" || memoryClients.size === 1)) {
      client = Array.from(memoryClients.values())[0];
    }

    const privateKey =
      process.env.ED25519_PRIVATE_KEY ||
      "1f4f20a99738ba342e309d420fb3471a9841c0e2892511027dfddfa1b0598168";

    // If client does not exist
    if (!client) {
      return NextResponse.json(
        { error: `Client not recognized for identifier or EXE: '${cleanId}'` },
        { status: 404 }
      );
    }

    // Check expiry
    let effectiveStatus = client.status || "active";
    if (client.expiresAt) {
      const expDate = client.expiresAt instanceof Date ? client.expiresAt : new Date(client.expiresAt);
      if (!isNaN(expDate.getTime()) && new Date() > expDate) {
        effectiveStatus = "suspended";
      }
    }

    // Log the check-in event safely
    try {
      await db.insert(checkinLogs).values({
        clientId: client.id,
        ipAddress: ip,
        userAgent,
        status: effectiveStatus,
      });
    } catch (logErr) {
      // Non-fatal logging
    }

    // Safe string expiry date
    const safeExpiresAt = (() => {
      if (!client.expiresAt) return null;
      if (client.expiresAt instanceof Date) return client.expiresAt.toISOString();
      const d = new Date(client.expiresAt);
      return isNaN(d.getTime()) ? null : d.toISOString();
    })();

    // Construct flat config matching C++ ClientConfig.cpp fields
    const flatConfig = {
      status: effectiveStatus,
      clientId: client.id,
      timestamp: now,
      nonce,
      expires_at: safeExpiresAt,

      // Visual Branding
      cheat_name: client.cheatName || "MeowGG",
      title_part1: client.titlePart1 || "Meow",
      title_part2: client.titlePart2 || ".GG",
      window_title: client.windowTitle || "MeowGG",
      subtitle: client.subtitle || "Dev : Subhajit | MeowGG",
      loading_text: client.loadingText || "Connecting To DataBase",
      discord_invite_url: client.discordInviteUrl || "https://discord.gg/meowgg",

      // Discord RPC
      rpc_enabled: client.rpcEnabled ?? true,
      enabled: client.rpcEnabled ?? true,
      rpc_app_id: client.rpcAppId || "1561024986851057715",
      app_id: client.rpcAppId || "1561024986851057715",
      rpc_state: client.rpcState || "MeowGG",
      state: client.rpcState || "MeowGG",
      rpc_details: client.rpcDetails || "discord.gg/meowgg",
      details: client.rpcDetails || "discord.gg/meowgg",
      rpc_large_image: client.rpcLargeImage || "",
      large_image: client.rpcLargeImage || "",
      rpc_large_text: client.rpcLargeText || "MeowGG Community",
      large_text: client.rpcLargeText || "MeowGG Community",
      rpc_small_image: client.rpcSmallImage || "",
      small_image: client.rpcSmallImage || "",
      rpc_small_text: client.rpcSmallText || "Developer : Subhajit",
      small_text: client.rpcSmallText || "Developer : Subhajit",
      rpc_button1_label: client.rpcButton1Label || "<3 Buying Here !",
      b1_label: client.rpcButton1Label || "<3 Buying Here !",
      rpc_button1_url: client.rpcButton1Url || "https://discord.gg/meowgg",
      b1_url: client.rpcButton1Url || "https://discord.gg/meowgg",
      rpc_button2_label: client.rpcButton2Label || "Developer",
      b2_label: client.rpcButton2Label || "Developer",
      rpc_button2_url: client.rpcButton2Url || "https://discord.gg/meowgg",
      b2_url: client.rpcButton2Url || "https://discord.gg/meowgg",

      // KeyAuth / LicenseAuth
      enable_auth: client.enableAuth ?? true,
      auth_name: client.authName || "all free",
      auth_owner_id: client.authOwnerId || "29B4YqY38s",
      auth_secret: client.authSecret || "",
      auth_version: client.authVersion || "1.0",
      auth_url: client.authUrl || "https://licenseauth.help/api/1.3/",
      auth_path: client.authPath || "",

      // Maintenance Killswitch
      enable_maintenance: client.enableMaintenanceCheck ?? true,
      enable_maintenance_check: client.enableMaintenanceCheck ?? true,
      maintenance_title: client.maintenanceTitle || "Maintenance Notice",
      title: client.maintenanceTitle || "Maintenance Notice",
      maintenance_text: client.maintenanceText || "EXE Under Maintenance. Contact Owner.",
      text: client.maintenanceText || "EXE Under Maintenance. Contact Owner.",
    };

    const canonicalString = JSON.stringify(flatConfig);
    const signature = await signPayload(canonicalString, privateKey);

    return NextResponse.json({
      ...flatConfig,
      signature,
    });
  } catch (error) {
    console.error("POST /api/client/check error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Internal check verification failed" },
      { status: 500 }
    );
  }
}
