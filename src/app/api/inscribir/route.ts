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
    // 💡 CORRECCIÓN APLICADA AQUÍ:
    // Cambiamos 'nombre' por 'name' y 'objetivo' por 'phone'
    const { name, email, phone, planId } = await req.json();

    // 💡 CORRECCIÓN APLICADA AQUÍ:
    // Validamos los campos requeridos del formulario (name, email, phone)
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

    // 💡 CORRECCIÓN APLICADA AQUÍ:
    // Usamos 'name' y 'phone' en lugar de 'nombre' y 'objetivo'
    await Inscripcion.create({
      nombre: name, // Mapea 'name' del payload a 'nombre' del modelo
      email,
      phone,         // ✅ CAMBIO CLAVE: Usa 'phone' para coincidir con Inscripcion.ts
      planId: selectedPlanId,
      discountApplied: true,
      discountPercentage: planDiscount.discountPercentage
    });

    // ⚠️ Si tu modelo Inscripcion usa 'objetivo' en lugar de 'phone',
    // deberías cambiar 'phone' a 'objetivo' aquí y en la desestructuración,
    // O añadir 'phone' al modelo.

    planDiscount.usedCupos++;
    await cupo.save();

    await sendConfirmationMail(name, email, selectedPlanId); // Nota: Cambié objetivo por selectedPlanId
    await sendAdminNotification(name, email, phone, planId); // Incluimos el teléfono en la notificación al admin

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
