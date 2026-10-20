import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { baseExes } from "@/db/schema";
import { baseExeRegisterSchema } from "@/lib/validators";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  try {
    const exes = await db
      .select()
      .from(baseExes)
      .orderBy(desc(baseExes.createdAt));

    return NextResponse.json({ exes });
  } catch (error) {
    console.error("GET /api/admin/base-exe error:", error);
    return NextResponse.json({ error: "Failed to fetch base EXEs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = baseExeRegisterSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid registration payload", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { version, filename, fileHash, blobUrl, fileSize } = result.data;

    // Mark previous versions as inactive
    await db.update(baseExes).set({ isActive: false }).where(eq(baseExes.isActive, true));

    const [inserted] = await db
      .insert(baseExes)
      .values({
        version,
        filename,
        fileHash,
        blobUrl,
        fileSize,
        isActive: true,
      })
      .returning();

    return NextResponse.json({ success: true, baseExe: inserted }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/base-exe error:", error);
    return NextResponse.json({ error: "Failed to register base EXE" }, { status: 500 });
  }
}
