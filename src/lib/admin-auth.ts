import bcrypt from "bcryptjs";

export async function verifyDashboardPassword(password?: string): Promise<boolean> {
  const hash = process.env.DASHBOARD_PASSWORD_HASH;
  if (!password || !hash) return false;
  return bcrypt.compare(password, hash);
}
