import type { IReservaDocument } from "@/models/Reserva";

const MONTHLY_PLAN_IDS = new Set(["basico", "premium", "elite"]);
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function isMonthlyPlan(planId?: string): boolean {
  return Boolean(planId && MONTHLY_PLAN_IDS.has(planId));
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

export function calculateMembershipWindow(referenceDate: Date): {
  startDate: Date;
  endDate: Date;
} {
  const startDate = new Date(referenceDate);
  const endDate = addDays(startDate, 30);
  return { startDate, endDate };
}

export function getRenewalStatus(endDate: Date, daysAhead = 7): "none" | "active" | "due_soon" | "expired" {
  const now = new Date();
  if (endDate.getTime() < now.getTime()) return "expired";
  const dueSoonBoundary = addDays(now, daysAhead);
  if (endDate.getTime() <= dueSoonBoundary.getTime()) return "due_soon";
  return "active";
}

export function ensureMembershipFields(
  reserva: IReservaDocument,
  referenceDate?: Date
): {
  isMonthly: boolean;
  membershipEndDate: Date | null;
  renewalStatus: "none" | "active" | "due_soon" | "expired";
} {
  const monthly = isMonthlyPlan(reserva.planId);
  if (!monthly) {
    reserva.isMonthlyMembership = false;
    reserva.membershipStartDate = undefined;
    reserva.membershipEndDate = undefined;
    reserva.renewalStatus = "none";
    return { isMonthly: false, membershipEndDate: null, renewalStatus: "none" };
  }

  const baseDate = referenceDate || reserva.pagoFecha || reserva.createdAt || new Date();
  const { startDate, endDate } = calculateMembershipWindow(new Date(baseDate));

  if (!reserva.membershipStartDate) {
    reserva.membershipStartDate = startDate;
  }
  if (!reserva.membershipEndDate) {
    reserva.membershipEndDate = endDate;
  }

  reserva.isMonthlyMembership = true;
  reserva.renewalStatus = getRenewalStatus(reserva.membershipEndDate);

  return {
    isMonthly: true,
    membershipEndDate: reserva.membershipEndDate,
    renewalStatus: reserva.renewalStatus,
  };
}
