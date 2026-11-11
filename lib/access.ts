import { getText, putFile, siteRepo, GitHubError } from "@/lib/github";
import { isAdmin as isOwner } from "@/lib/auth";

/** People given access from the admin console, kept in config/access.json of the (private) site repository.
 *  Owners come from the ADMIN_EMAILS environment variable and can't be removed from the console. */
export type Role = "owner" | "admin" | "editor";
export type Person = { email: string; role: "admin" | "editor"; addedBy?: string; addedAt?: number };
const FILE = "config/access.json";

let cache: { people: Person[]; sha: string | null; at: number } | null = null;

export async function loadAccess(fresh = false): Promise<{ people: Person[]; sha: string | null }> {
  if (!fresh && cache && Date.now() - cache.at < 30_000) return cache;
  if (!siteRepo() || !process.env.GITHUB_TOKEN) return { people: [], sha: null };
  const f = await getText(siteRepo(), FILE);
  let people: Person[] = [];
  try {
    const j = JSON.parse(f?.text || "{}");
    if (Array.isArray(j.people)) people = j.people.filter((p: any) => p && typeof p.email === "string" && (p.role === "admin" || p.role === "editor"));
  } catch {}
  cache = { people, sha: f?.sha ?? null, at: Date.now() };
  return cache;
}

export function owners(): string[] {
  return (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
}

export async function roleOf(email?: string | null): Promise<Role | null> {
  if (!email) return null;
  if (isOwner(email)) return "owner";
  try {
    const { people } = await loadAccess();
    const p = people.find((x) => x.email.toLowerCase() === email.toLowerCase());
    return p ? p.role : null;
  } catch {
    return null;
  }
}

/** Applies a change and commits it. Retries once if someone else saved at the same moment. */
export async function changeAccess(by: string, fn: (people: Person[]) => Person[]): Promise<Person[]> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const { people, sha } = await loadAccess(true);
    const next = fn(people.map((p) => ({ ...p })));
    try {
      await putFile(siteRepo(), FILE, Buffer.from(JSON.stringify({ people: next }, null, 2) + "\n").toString("base64"), `Access: update (admin: ${by})`, sha);
      cache = { people: next, sha: null, at: 0 };
      return next;
    } catch (e) {
      if (e instanceof GitHubError && e.status === 409 && attempt === 0) continue;
      throw e;
    }
  }
  throw new Error("conflict");
}
