import { sessionRole } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const { email, role } = await sessionRole();
  return Response.json({ email, role, isAdmin: !!role, canManageAccess: role === "owner" || role === "admin" });
}
