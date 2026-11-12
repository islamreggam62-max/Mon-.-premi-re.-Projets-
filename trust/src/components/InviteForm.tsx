"use client";

import { useActionState } from "react";
import { inviteMember, type InviteState } from "@/lib/actions";
import { MESSAGES } from "@/lib/messages";

/** Creates an invitation and shows its link once, for the inviter to send. */
export function InviteForm({ canInviteAdmin }: { canInviteAdmin: boolean }) {
  const [state, formAction, pending] = useActionState<InviteState, FormData>(inviteMember, {});
  return (
    <div>
      <form action={formAction} className="flex flex-wrap items-end gap-3">
        <div className="min-w-[14rem] flex-1">
          <label htmlFor="invite-email" className="label">Email address</label>
          <input id="invite-email" name="email" type="email" required maxLength={254} className="input" />
        </div>
        <div className="w-full min-w-0 sm:w-auto">
          <label htmlFor="invite-role" className="label">Role</label>
          <select id="invite-role" name="role" defaultValue="viewer" className="input">
            <option value="viewer">Viewer — read only</option>
            <option value="reviewer">Reviewer — triages risks, approves</option>
            <option value="manager">Manager — edits contracts</option>
            {canInviteAdmin ? <option value="admin">Admin — manages the team</option> : null}
          </select>
        </div>
        <button type="submit" disabled={pending} className="btn-primary">{pending ? "Creating…" : "Create invitation"}</button>
      </form>
      <div aria-live="polite" className="mt-3">
        {state.error ? <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{MESSAGES[state.error]?.text ?? MESSAGES.unexpected!.text}</p> : null}
        {state.link ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            <p>Invitation created for <strong>{state.email}</strong>. Send them this link. It works once, for that email address only, for 7 days, and <strong>it will not be shown again</strong>:</p>
            <label htmlFor="invite-link" className="sr-only">Invitation link</label>
            <input id="invite-link" readOnly value={state.link} onFocus={(event) => event.currentTarget.select()} className="input mt-2 font-mono text-xs" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
