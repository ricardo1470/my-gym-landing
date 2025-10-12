// src/app/api/cupos/route.ts

import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Cupo from "@/models/Cupo"

interface PlanDiscount {
  planId: string;
  maxCupos: number;
  usedCupos: number;
  discountPercentage: number;
}

export async function GET() {
  try {
    await connectDB()

    let cupo = await Cupo.findOne()

    if (!cupo) {
      cupo = await Cupo.create({
        planDiscounts: [
          { planId: 'basico', maxCupos: 6, usedCupos: 0, discountPercentage: 20 },
          { planId: 'premium', maxCupos: 6, usedCupos: 0, discountPercentage: 25 },
          { planId: 'elite', maxCupos: 6, usedCupos: 0, discountPercentage: 30 }
        ]
      })
    }

    if (cupo && 'max' in cupo && !cupo.planDiscounts) {
      console.log("Migrando estructura antigua a nueva...")

      await Cupo.deleteOne({ _id: cupo._id })

      cupo = await Cupo.create({
        planDiscounts: [
          { planId: 'basico', maxCupos: 6, usedCupos: 0, discountPercentage: 20 },
          { planId: 'premium', maxCupos: 6, usedCupos: 0, discountPercentage: 25 },
          { planId: 'elite', maxCupos: 6, usedCupos: 0, discountPercentage: 30 }
        ]
      })
    }

    if (!cupo.planDiscounts || cupo.planDiscounts.length === 0) {
      cupo.planDiscounts = [
        { planId: 'basico', maxCupos: 6, usedCupos: 0, discountPercentage: 20 },
        { planId: 'premium', maxCupos: 6, usedCupos: 0, discountPercentage: 25 },
        { planId: 'elite', maxCupos: 6, usedCupos: 0, discountPercentage: 30 }
      ]
      await cupo.save()
    }

    const discountsData = cupo.planDiscounts.map((plan: PlanDiscount) => ({
      planId: plan.planId,
      maxCupos: plan.maxCupos,
      usedCupos: plan.usedCupos,
      availableCupos: Math.max(0, plan.maxCupos - plan.usedCupos),
      discountPercentage: plan.discountPercentage,
      hasDiscount: plan.usedCupos < plan.maxCupos
    }))

    const totalDiscountedCupos = discountsData.reduce((acc, plan) => acc + plan.availableCupos, 0)

    return NextResponse.json({
      planDiscounts: discountsData,
      totalDiscountedCupos,
      lastReset: cupo.lastReset
    })
  } catch (err) {
    console.error("Error en /api/cupos", err)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { planId } = await req.json()

    if (!planId || !['basico', 'premium', 'elite'].includes(planId)) {
      return NextResponse.json({ error: "Plan ID inválido" }, { status: 400 })
    }

    await connectDB()

    const cupo = await Cupo.findOne()

    if (!cupo) {
      return NextResponse.json({ error: "No hay cupos configurados" }, { status: 500 })
    }

    const planDiscount = cupo.planDiscounts.find((p: PlanDiscount) => p.planId === planId)

    if (!planDiscount) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 })
    }

    if (planDiscount.usedCupos >= planDiscount.maxCupos) {
      return NextResponse.json({ error: "No quedan cupos con descuento para este plan" }, { status: 400 })
    }

    planDiscount.usedCupos++
    await cupo.save()

    return NextResponse.json({
      ok: true,
      message: "Cupo con descuento aplicado exitosamente",
      planId,
      remainingCupos: planDiscount.maxCupos - planDiscount.usedCupos
    })
  } catch (err) {
    console.error("Error al usar cupo de descuento:", err)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
