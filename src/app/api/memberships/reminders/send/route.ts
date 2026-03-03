import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Reserva from "@/models/Reserva";
import Cupo from "@/models/Cupo";
import { getRenewalStatus, isMonthlyPlan } from "@/lib/membership";
import { verifyDashboardPassword } from "@/lib/admin-auth";
import { sendMembershipRenewalReminder } from "@/lib/mailer";

interface PlanDiscount {
  planId: string;
  maxCupos: number;
  usedCupos: number;
  discountPercentage: number;
}

function getAvailableDiscount(planId: string, planDiscounts: PlanDiscount[]) {
  const discount = planDiscounts.find((p) => p.planId === planId);
  if (!discount) return { percentage: 0, available: 0 };

  return {
    percentage: discount.discountPercentage,
    available: Math.max(0, discount.maxCupos - discount.usedCupos),
  };
}

export async function POST(req: Request) {
  try {
    const { password, daysAhead = 7, dryRun = false, limit = 50 } = await req.json();
    const ok = await verifyDashboardPassword(password);
    if (!ok) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 401 });
    }

    await connectDB();

    const cupo = await Cupo.findOne().lean<{ planDiscounts?: PlanDiscount[] }>();
    const planDiscounts = cupo?.planDiscounts || [];
    const reservas = await Reserva.find({
      pagoEstado: "aprobado",
      planId: { $in: ["basico", "premium", "elite"] },
    }).sort({ membershipEndDate: 1, createdAt: -1 });

    const sendResults: Array<{
      id: string;
      email: string;
      status: "sent" | "skipped";
      renewalStatus: "due_soon" | "expired";
      reason?: string;
    }> = [];

    let processed = 0;
    for (const reserva of reservas) {
      if (processed >= Number(limit)) break;
      if (!isMonthlyPlan(reserva.planId)) continue;

      const endDate = new Date(
        reserva.membershipEndDate || reserva.pagoFecha || reserva.createdAt || new Date()
      );
      const status = getRenewalStatus(endDate, Number(daysAhead));
      if (status !== "due_soon" && status !== "expired") continue;

      // Evita enviar más de un recordatorio cada 24h por cliente
      if (reserva.lastRenewalReminderAt) {
        const lastSentAgoMs = Date.now() - new Date(reserva.lastRenewalReminderAt).getTime();
        if (lastSentAgoMs < 24 * 60 * 60 * 1000) {
          sendResults.push({
            id: String(reserva._id),
            email: reserva.clienteEmail,
            status: "skipped",
            renewalStatus: status,
            reason: "Reminder ya enviado en las últimas 24h",
          });
          continue;
        }
      }

      const discount = getAvailableDiscount(reserva.planId, planDiscounts);

      if (!dryRun) {
        await sendMembershipRenewalReminder({
          nombre: reserva.clienteNombre,
          email: reserva.clienteEmail,
          planNombre: reserva.planNombre,
          membershipEndDate: endDate,
          renewalType: status,
          discountPercentage: discount.percentage,
          discountCuposDisponibles: discount.available,
        });

        reserva.renewalStatus = status;
        reserva.lastRenewalReminderAt = new Date();
        reserva.renewalReminderCount = (reserva.renewalReminderCount || 0) + 1;
        await reserva.save();
      }

      processed++;
      sendResults.push({
        id: String(reserva._id),
        email: reserva.clienteEmail,
        status: "sent",
        renewalStatus: status,
      });
    }

    return NextResponse.json({
      ok: true,
      dryRun: Boolean(dryRun),
      processed,
      sent: sendResults.filter((r) => r.status === "sent").length,
      skipped: sendResults.filter((r) => r.status === "skipped").length,
      results: sendResults,
    });
  } catch (error) {
    console.error("Error sending renewal reminders:", error);
    return NextResponse.json({ error: "Error interno enviando recordatorios" }, { status: 500 });
  }
}
