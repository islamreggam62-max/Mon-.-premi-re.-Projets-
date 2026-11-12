import type { Metadata } from "next";
import { InviteForm } from "@/components/InviteForm";
import { Banner, Empty, PageHeader, Section } from "@/components/ui";
import { removeMember, revokeInvitation, setMemberRole } from "@/lib/actions";
import { getContext, getMembers } from "@/lib/context";
import { formatDate, humanize } from "@/lib/format";
import type { OrgRole } from "@/lib/types";

export const metadata: Metadata = { title: "Team" };

const ROLES: OrgRole[] = ["owner", "admin", "manager", "reviewer", "viewer"];

export default async function TeamPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const context = await getContext();
  const isOwner = context.role === "owner";
  const [members, invitations] = await Promise.all([
    getMembers(context),
    context.canAdmin
      ? context.supabase.from("invitations").select("id, email, role, expires_at, created_at").eq("org_id", context.org.id).is("accepted_at", null).order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as { id: string; email: string; role: string; expires_at: string; created_at: string }[] }),
  ]);
  // An admin may only manage roles below admin; an owner may manage everyone.
  const mayManage = (role: OrgRole) => context.canAdmin && (isOwner || !["owner", "admin"].includes(role));
  const assignable = isOwner ? ROLES : ROLES.filter((role) => !["owner", "admin"].includes(role));
  const pending = invitations.data ?? [];

  return (
    <>
      <PageHeader title="Team" description={`People who can access ${context.org.name}, and what each may do.`} />
      <Banner searchParams={params} />
      <Section title={`Members (${members.length})`}>
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[34rem]">
            <thead className="border-b border-slate-200"><tr><th scope="col" className="th">Person</th><th scope="col" className="th">Role</th><th scope="col" className="th"><span className="sr-only">Actions</span></th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((member) => (
                <tr key={member.user_id}>
                  <td className="td"><span className="font-medium">{member.full_name ?? member.email}</span>{member.user_id === context.user.id ? " (you)" : ""}<span className="block text-xs text-ink-muted">{member.email}</span></td>
                  <td className="td">
                    {mayManage(member.role) && member.user_id !== context.user.id ? (
                      <form action={setMemberRole} className="flex items-center gap-2">
                        <input type="hidden" name="user_id" value={member.user_id} />
                        <label htmlFor={`role-${member.user_id}`} className="sr-only">Role of {member.email}</label>
                        <select id={`role-${member.user_id}`} name="role" defaultValue={member.role} className="input w-auto py-1">
                          {assignable.map((role) => <option key={role} value={role}>{humanize(role)}</option>)}
                        </select>
                        <button type="submit" className="btn-secondary min-h-0 px-3 py-1">Change</button>
                      </form>
                    ) : humanize(member.role)}
                  </td>
                  <td className="td text-right">
                    {member.user_id === context.user.id ? (
                      <form action={removeMember}><input type="hidden" name="user_id" value={member.user_id} /><button type="submit" className="btn-danger min-h-0 px-3 py-1">Leave organisation</button></form>
                    ) : mayManage(member.role) ? (
                      <form action={removeMember}><input type="hidden" name="user_id" value={member.user_id} /><button type="submit" className="btn-danger min-h-0 px-3 py-1">Remove</button></form>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
      {context.canAdmin ? (
        <>
          <Section title="Invite a colleague">
            <InviteForm canInviteAdmin={isOwner} />
            <p className="mt-3 text-xs text-ink-muted">Invitations are not emailed by the platform yet: copy the link and send it yourself.</p>
          </Section>
          <Section title={`Pending invitations (${pending.length})`}>
            {pending.length === 0 ? <Empty>No pending invitation.</Empty> : (
              <ul className="divide-y divide-slate-100 text-sm">
                {pending.map((invitation) => (
                  <li key={invitation.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <span><span className="font-medium">{invitation.email}</span> · {humanize(invitation.role)} · {new Date(invitation.expires_at) < new Date() ? "expired" : `expires ${formatDate(invitation.expires_at)}`}</span>
                    <form action={revokeInvitation}><input type="hidden" name="invitation_id" value={invitation.id} /><button type="submit" className="btn-danger min-h-0 px-3 py-1">Revoke</button></form>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </>
      ) : null}
    </>
  );
}
