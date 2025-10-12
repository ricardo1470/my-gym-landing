// src/app/api/cupos/migrate/route.ts

import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Cupo from "@/models/Cupo"

export async function POST() {
    try {
        await connectDB()

        const oldCupo = await Cupo.findOne()

        if (oldCupo && !oldCupo.planDiscounts) {
            await Cupo.deleteMany({})

            const newCupo = await Cupo.create({
                planDiscounts: [
                    { planId: 'basico', maxCupos: 4, usedCupos: 0, discountPercentage: 20 },
                    { planId: 'premium', maxCupos: 4, usedCupos: 0, discountPercentage: 25 },
                    { planId: 'elite', maxCupos: 4, usedCupos: 0, discountPercentage: 30 }
                ]
            })

            return NextResponse.json({
                ok: true,
                message: "Migración completada exitosamente",
                newStructure: newCupo
            })
        }

        if (!oldCupo) {
            const newCupo = await Cupo.create({
                planDiscounts: [
                    { planId: 'basico', maxCupos: 6, usedCupos: 0, discountPercentage: 20 },
                    { planId: 'premium', maxCupos: 6, usedCupos: 0, discountPercentage: 25 },
                    { planId: 'elite', maxCupos: 6, usedCupos: 0, discountPercentage: 30 }
                ]
            })

            return NextResponse.json({
                ok: true,
                message: "Estructura inicial creada",
                newStructure: newCupo
            })
        }

        return NextResponse.json({
            ok: true,
            message: "La estructura ya está actualizada",
            current: oldCupo
        })

    } catch (err) {
        console.error("Error en migración:", err)
        return NextResponse.json({ error: "Error en la migración" }, { status: 500 })
    }
}
