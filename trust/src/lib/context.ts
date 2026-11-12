import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_ROLES, MANAGE_ROLES, type Member, type OrgRole } from "@/lib/types";

export const ORG_COOKIE = "trust_org";

export interface Membership {
  orgId: string;
  orgName: string;
  role: OrgRole;
}

/** The signed-in user, or a redirect to the login page. */
export const getSession = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  return { supabase, user: data.user };
});

export const getMemberships = cache(async (): Promise<Membership[]> => {
  const { supabase, user } = await getSession();
  const { data, error } = await supabase
    .from("memberships")
    .select("org_id, role, organizations(name)")
    .eq("user_id", user.id)
    .order("created_at");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => {
    const org = row.organizations as unknown as { name: string } | { name: string }[] | null;
    const name = Array.isArray(org) ? org[0]?.name : org?.name;
    return { orgId: row.org_id as string, orgName: name ?? "Organisation", role: row.role as OrgRole };
  });
});

/**
 * The user plus the organisation they are working in.
 * The organisation comes from a cookie, but it is only honoured if the user is
 * really a member — and the database enforces that again on every query.
 */
export const getContext = cache(async () => {
  const { supabase, user } = await getSession();
  const memberships = await getMemberships();
  if (memberships.length === 0) redirect("/onboarding");
  const wanted = (await cookies()).get(ORG_COOKIE)?.value;
  const active = memberships.find((membership) => membership.orgId === wanted) ?? memberships[0]!;
  return {
    supabase,
    user,
    memberships,
    org: { id: active.orgId, name: active.orgName },
    role: active.role,
    canManage: MANAGE_ROLES.includes(active.role),
    canAdmin: ADMIN_ROLES.includes(active.role),
  };
});

export type Context = Awaited<ReturnType<typeof getContext>>;

/** Members of the active organisation with their names, for pickers and tables. */
export async function getMembers(context: Context): Promise<Member[]> {
  const { data: rows, error } = await context.supabase
    .from("memberships")
    .select("user_id, role")
    .eq("org_id", context.org.id)
    .order("created_at");
  if (error) throw new Error(error.message);
  const ids = (rows ?? []).map((row) => row.user_id as string);
  const { data: profiles } = await context.supabase.from("profiles").select("id, email, full_name").in("id", ids);
  const byId = new Map((profiles ?? []).map((profile) => [profile.id as string, profile]));
  return (rows ?? []).map((row) => ({
    user_id: row.user_id as string,
    role: row.role as OrgRole,
    email: (byId.get(row.user_id as string)?.email as string | undefined) ?? "unknown",
    full_name: (byId.get(row.user_id as string)?.full_name as string | null | undefined) ?? null,
  }));
}

export function memberName(members: Member[], userId: string | null | undefined): string {
  if (!userId) return "—";
  const member = members.find((candidate) => candidate.user_id === userId);
  return member ? (member.full_name ?? member.email) : "Former member";
}
