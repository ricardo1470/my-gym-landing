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
      return NextResponse.json(
        { error: "Todos los campos son obligatorios (nombre, email, teléfono)" },
        { status: 400 }
      );
    }

    const selectedPlanId = planId || 'premium';

    if (!['diario', 'basico', 'premium', 'elite'].includes(selectedPlanId)) {
      return NextResponse.json(
        { error: "Plan ID inválido" },
        { status: 400 }
      );
    }

    await connectDB();

    // Verificar descuentos solo para planes mensuales (no para "diario")
    let discountApplied = false;
    let discountPercentage = 0;
    let remainingCupos = 0;

    if (selectedPlanId !== 'diario') {
      const cupo = await Cupo.findOne();

      if (cupo) {
        const planDiscount = cupo.planDiscounts.find(
          (p: PlanDiscount) => p.planId === selectedPlanId
        );

        if (planDiscount && planDiscount.usedCupos < planDiscount.maxCupos) {
          discountApplied = true;
          discountPercentage = planDiscount.discountPercentage;
          
          // Usar el cupo de descuento
          planDiscount.usedCupos++;
          await cupo.save();
          
          remainingCupos = planDiscount.maxCupos - planDiscount.usedCupos;
        }
      }
    }

    // Crear inscripción
    const inscripcion = await Inscripcion.create({
      nombre: name,
      email,
      phone,
      planId: selectedPlanId,
      discountApplied,
      discountPercentage,
    });

    // Enviar emails
    try {
      await sendConfirmationMail(name, email, selectedPlanId);
      await sendAdminNotification(name, email, phone, selectedPlanId);
    } catch (emailError) {
      console.error("Error enviando emails:", emailError);
      // Continuar aunque fallen los emails
    }

    return NextResponse.json({
      ok: true,
      message: "Inscripción exitosa",
      inscripcionId: inscripcion._id,
      planId: selectedPlanId,
      discountApplied,
      discountPercentage,
      remainingCupos,
    });
  } catch (err: unknown) {
    console.error("Error en inscripción:", err);
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}
