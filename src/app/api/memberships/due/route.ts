import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Reserva from "@/models/Reserva";
import { getRenewalStatus, isMonthlyPlan } from "@/lib/membership";
import { verifyDashboardPassword } from "@/lib/admin-auth";

type MembershipItem = {
  id: string;
  clienteNombre: string;
  clienteEmail: string;
  planId: string;
  planNombre: string;
  membershipEndDate: Date;
  renewalStatus: "active" | "due_soon" | "expired";
  diasRestantes: number;
  pagoMonto: number;
};

function daysRemaining(date: Date): number {
  const diff = date.getTime() - Date.now();
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}

export async function POST(req: Request) {
  try {
    const { password, daysAhead = 7 } = await req.json();
    const ok = await verifyDashboardPassword(password);
    if (!ok) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 401 });
    }

    await connectDB();
    const reservas = await Reserva.find({
      pagoEstado: "aprobado",
      planId: { $in: ["basico", "premium", "elite"] },
    }).sort({ membershipEndDate: 1, createdAt: -1 });

    const normalized: MembershipItem[] = [];
    for (const r of reservas) {
      if (!isMonthlyPlan(r.planId)) continue;
      const baseDate = r.membershipEndDate || r.pagoFecha || r.createdAt || new Date();
      const membershipEndDate = r.membershipEndDate || new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      const status = getRenewalStatus(new Date(membershipEndDate), Number(daysAhead));
      if (status === "none") continue;

      normalized.push({
        id: String(r._id),
        clienteNombre: r.clienteNombre,
        clienteEmail: r.clienteEmail,
        planId: r.planId,
        planNombre: r.planNombre,
        membershipEndDate,
        renewalStatus: status,
        diasRestantes: daysRemaining(new Date(membershipEndDate)),
        pagoMonto: r.pagoMonto,
      });
    }

    const dueSoon = normalized.filter((m) => m.renewalStatus === "due_soon");
    const expired = normalized.filter((m) => m.renewalStatus === "expired");
    const active = normalized.filter((m) => m.renewalStatus === "active");

    return NextResponse.json({
      ok: true,
      summary: {
        totalMonthly: normalized.length,
        dueSoon: dueSoon.length,
        expired: expired.length,
        active: active.length,
        daysAhead: Number(daysAhead),
      },
      dueSoon,
      expired,
      active: active.slice(0, 30),
    });
  } catch (error) {
    console.error("Error listing due memberships:", error);
    return NextResponse.json({ error: "Error interno listando membresías" }, { status: 500 });
  }
}
