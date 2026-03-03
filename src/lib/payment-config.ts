export const PLAN_CONFIG = {
  diario: { name: "Sesión Personal", price: 60000 },
  basico: { name: "Plan Básico", price: 150000 },
  premium: { name: "Plan Premium", price: 280000 },
  elite: { name: "Plan Elite", price: 420000 },
} as const;

export type PlanId = keyof typeof PLAN_CONFIG;

export function isValidPlanId(value: string): value is PlanId {
  return Object.prototype.hasOwnProperty.call(PLAN_CONFIG, value);
}

export function calculatePlanAmount(
  planId: PlanId,
  discountApplied: boolean,
  discountPercentage: number
): { planNombre: string; monto: number } {
  const config = PLAN_CONFIG[planId];

  // Descuentos solo aplican a planes mensuales.
  const allowDiscount = planId !== "diario" && discountApplied && discountPercentage > 0;
  const rawAmount = allowDiscount
    ? config.price * (1 - discountPercentage / 100)
    : config.price;

  return {
    planNombre: config.name,
    monto: Math.round(rawAmount),
  };
}

export function isSimulationEnabled(): boolean {
  return process.env.PAYMENT_SIMULATION_ENABLED === "true";
}
