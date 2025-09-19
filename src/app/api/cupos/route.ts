// src/app/api/cupos/route.ts
import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Cupo from "@/models/Cupo"

export async function GET() {
  try {
    await connectDB()

    const cupo = await Cupo.findOne()

    if (!cupo) {
      // si no hay cupo creado aún, devolvemos valores por defecto
      return NextResponse.json({ max: 0, usados: 0 })
    }

    return NextResponse.json({
      max: cupo.max,
      usados: cupo.usados,
      disponibles: Math.max(0, cupo.max - cupo.usados),
    })
  } catch (err) {
    console.error("Error en /api/cupos", err)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
