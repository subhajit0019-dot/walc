import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
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
      // Token format: timestamp.signature
      const parts = token.split(".");
      if (parts.length === 2) {
        const timestamp = parseInt(parts[0]);
        const signature = parts[1];
        const now = Math.floor(Date.now() / 1000);
        // Valid for 300 seconds (5 minutes)
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

    // Verify client exists and is active
    const [client] = await db.select().from(clients).where(eq(clients.id, clientId));
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    if (client.status !== "active") {
      return NextResponse.json(
        { error: `Download disabled: client status is ${client.status}` },
        { status: 403 }
      );
    }

    // Get active base EXE
    const [baseExe] = await db
      .select()
      .from(baseExes)
      .where(eq(baseExes.isActive, true))
      .limit(1);

    if (!baseExe) {
      return NextResponse.json(
        { error: "No active Base EXE uploaded yet. Please upload one in the admin panel." },
        { status: 404 }
      );
    }

    const downloadName = client.exeName.endsWith(".exe") ? client.exeName : `${client.exeName}.exe`;

    // Fetch binary from Vercel Blob / Storage and stream it with client's custom filename
    const blobRes = await fetch(baseExe.blobUrl);
    if (!blobRes.ok) {
      return NextResponse.json(
        { error: "Failed to retrieve binary from storage" },
        { status: 502 }
      );
    }

    const headers = new Headers();
    headers.set("Content-Disposition", `attachment; filename="${downloadName}"`);
    headers.set("Content-Type", "application/octet-stream");
    headers.set("Content-Length", baseExe.fileSize.toString());
    headers.set("X-EXE-SHA256", baseExe.fileHash);
    headers.set("X-EXE-Version", baseExe.version);

    return new NextResponse(blobRes.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("GET /api/download/[clientId] error:", error);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
