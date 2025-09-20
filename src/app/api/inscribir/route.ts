// src/app/api/inscribir/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Cupo from "@/models/Cupo";
import Inscripcion from "@/models/Inscripcion";
import { sendConfirmationMail } from "@/lib/mailer";

interface PlanDiscount {
  planId: string;
  maxCupos: number;
  usedCupos: number;
  discountPercentage: number;
}

export async function POST(req: Request) {
  try {
    const { nombre, email, objetivo, planId } = await req.json();

    if (!nombre || !email || !objetivo) {
      return NextResponse.json({ error: "Todos los campos son obligatorios" }, { status: 400 });
    }

    // Si no se especifica planId, usar 'premium' como default
    const selectedPlanId = planId || 'premium';

    if (!['basico', 'premium', 'elite'].includes(selectedPlanId)) {
      return NextResponse.json({ error: "Plan ID inválido" }, { status: 400 });
    }

    await connectDB();

    const cupo = await Cupo.findOne();
    if (!cupo) {
      return NextResponse.json({ error: "No hay cupos configurados" }, { status: 500 });
    }

    // Encontrar el plan específico
    const planDiscount = cupo.planDiscounts.find((p: PlanDiscount) => p.planId === selectedPlanId);

    if (!planDiscount) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
    }

    // Verificar si hay cupos disponibles para este plan
    if (planDiscount.usedCupos >= planDiscount.maxCupos) {
      return NextResponse.json({
        error: `Ya no quedan cupos con descuento disponibles para el plan ${selectedPlanId}`
      }, { status: 400 });
    }

    // Guardar inscripción con información del plan
    await Inscripcion.create({
      nombre,
      email,
      objetivo,
      planId: selectedPlanId,
      discountApplied: true,
      discountPercentage: planDiscount.discountPercentage
    });

    // Incrementar cupo usado para este plan específico
    planDiscount.usedCupos++;
    await cupo.save();

    // Enviar correo de confirmación
    await sendConfirmationMail(nombre, email, objetivo);

    return NextResponse.json({
      ok: true,
      message: "Inscripción exitosa con descuento aplicado",
      planId: selectedPlanId,
      discountPercentage: planDiscount.discountPercentage,
      remainingCupos: planDiscount.maxCupos - planDiscount.usedCupos
    });
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
