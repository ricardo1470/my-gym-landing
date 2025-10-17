// src/app/api/inscribir/route.ts

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Cupo from "@/models/Cupo";
import Inscripcion from "@/models/Inscripcion";
import { sendConfirmationMail, sendAdminNotification } from "@/lib/mailer";

interface PlanDiscount {
  planId: string;
  maxCupos: number;
  usedCupos: number;
  discountPercentage: number;
}

export async function POST(req: Request) {
  try {
    const { name, email, phone, planId } = await req.json();

    if (!name || !email || !phone) {
      return NextResponse.json({ error: "Todos los campos son obligatorios (nombre, email, teléfono)" }, { status: 400 });
    }

    const selectedPlanId = planId || 'premium';

    if (!['basico', 'premium', 'elite'].includes(selectedPlanId)) {
      return NextResponse.json({ error: "Plan ID inválido" }, { status: 400 });
    }

    await connectDB();

    const cupo = await Cupo.findOne();

    if (!cupo) {
      return NextResponse.json({ error: "No hay cupos configurados" }, { status: 500 });
    }

    const planDiscount = cupo.planDiscounts.find((p: PlanDiscount) => p.planId === selectedPlanId);

    if (!planDiscount) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
    }

    if (planDiscount.usedCupos >= planDiscount.maxCupos) {
      return NextResponse.json({
        error: `Ya no quedan cupos con descuento disponibles para el plan ${selectedPlanId}`
      }, { status: 400 });
    }

    await Inscripcion.create({
      nombre: name,
      email,
      phone,
      planId: selectedPlanId,
      discountApplied: true,
      discountPercentage: planDiscount.discountPercentage
    });

    planDiscount.usedCupos++;
    await cupo.save();

    await sendConfirmationMail(name, email, selectedPlanId);
    await sendAdminNotification(name, email, phone, planId);

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
