import { NextResponse } from "next/server";
import { baseExeRegisterSchema } from "@/lib/validators";

export async function GET() {
  return NextResponse.json({ items: [], total: 0 });
}

export async function POST() {
  return NextResponse.json({
    success: true,
    message: "Base binary management disabled; dynamic EXE naming is active.",
  });
}
