import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    success: true,
    message: "Base binary upload disabled; dynamic EXE naming is active.",
  });
}
