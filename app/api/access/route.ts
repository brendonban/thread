import { accessManagerEmail, deny } from "@/lib/admin";
import { loadAccess, owners, changeAccess } from "@/lib/access";
import { explainGitHub } from "@/lib/github";

export const dynamic = "force-dynamic";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Lists who has access. Owners and admins only. */
export async function GET() {
  if (!(await accessManagerEmail())) return deny();
  try {
    const { people } = await loadAccess(true);
    return Response.json({ owners: owners(), people });
  } catch (e) {
    return Response.json({ error: explainGitHub(e) }, { status: 502 });
  }
}

/** Adds, updates or removes a person. Body: { action: "set" | "remove", email, role? } */
export async function POST(req: Request) {
  const by = await accessManagerEmail();
  if (!by) return deny();
  const body = await req.json().catch(() => null);
  const email = String(body?.email || "").trim().toLowerCase();
  const action = body?.action;
  if (!EMAIL.test(email)) return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  if (owners().includes(email)) return Response.json({ error: "Owners are set in Vercel (ADMIN_EMAILS)." }, { status: 400 });
  if (action === "remove" && email === by.toLowerCase()) return Response.json({ error: "You can't remove yourself." }, { status: 400 });
  const role: "admin" | "editor" = body?.role === "admin" ? "admin" : "editor";
  try {
    const people = await changeAccess(by, (list) => {
      const rest = list.filter((p) => p.email.toLowerCase() !== email);
      if (action === "remove") return rest;
      const old = list.find((p) => p.email.toLowerCase() === email);
      return [...rest, { email, role, addedBy: old?.addedBy || by, addedAt: old?.addedAt || Date.now() }].sort((a, b) => a.email.localeCompare(b.email));
    });
    return Response.json({ owners: owners(), people });
  } catch (e) {
    return Response.json({ error: explainGitHub(e) }, { status: 502 });
  }
}
