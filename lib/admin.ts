import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { roleOf, type Role } from "@/lib/access";

/** The signed-in user's email and role (owner, admin or editor), or nulls. */
export async function sessionRole(): Promise<{ email: string | null; role: Role | null }> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  return { email, role: await roleOf(email) };
}

/** The signed-in editor's email (any role can edit and publish), or null. */
export async function adminEmail(): Promise<string | null> {
  const { email, role } = await sessionRole();
  return role ? email : null;
}

/** The signed-in email if they can manage access (owner or admin), or null. */
export async function accessManagerEmail(): Promise<string | null> {
  const { email, role } = await sessionRole();
  return role === "owner" || role === "admin" ? email : null;
}

export const deny = () => Response.json({ error: "Sign in with an admin account." }, { status: 401 });
