import { NextResponse } from "next/server";

function disabledResponse() {
  return NextResponse.json(
    {
      error:
        "Endpoint deshabilitado. Usa /api/payment/status (GET polling) o webhook firmado (POST).",
    },
    { status: 410 }
  );
}

export async function GET() {
  return disabledResponse();
}

export async function POST() {
  return disabledResponse();
}
