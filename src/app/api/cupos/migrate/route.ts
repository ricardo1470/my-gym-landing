// src/app/api/cupos/migrate/route.ts
import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Cupo from "@/models/Cupo"

export async function POST() {
    try {
        await connectDB()

        // Buscar el documento existente con el formato antiguo
        const oldCupo = await Cupo.findOne()

        if (oldCupo && !oldCupo.planDiscounts) {
            // Si existe el formato antiguo, lo eliminamos y creamos el nuevo
            await Cupo.deleteMany({})

            // Crear el nuevo formato con descuentos por defecto
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

        // Si ya tiene el nuevo formato, solo inicializar valores por defecto si está vacío
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