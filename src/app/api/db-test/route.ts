// src/app/api/db-test/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Cupo from "@/models/Cupo";

export async function GET() {
  try {
    await connectDB();
    const cupo = await Cupo.findOne();
    return NextResponse.json({ ok: true, cupo });
  } catch (err: unknown) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
