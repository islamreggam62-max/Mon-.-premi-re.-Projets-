import type { Contract, Member } from "@/lib/types";

/** The editable fields of a contract record, shared by the create and edit forms. */
export function ContractFields({ contract, members, disabled = false }: { contract?: Contract; members: Member[]; disabled?: boolean }) {
  const renews = contract?.auto_renews === true ? "yes" : contract?.auto_renews === false ? "no" : "";
  return (
    <fieldset disabled={disabled} className="grid gap-4 sm:grid-cols-2">
      <legend className="sr-only">Contract record</legend>
      <div className="sm:col-span-2">
        <label htmlFor="title" className="label">Title <span aria-hidden="true">*</span></label>
        <input id="title" name="title" required maxLength={200} defaultValue={contract?.title ?? ""} className="input" />
      </div>
      <div>
        <label htmlFor="counterparty" className="label">Counterparty</label>
        <input id="counterparty" name="counterparty" maxLength={300} defaultValue={contract?.counterparty ?? ""} className="input" />
      </div>
      <div>
        <label htmlFor="our_party" className="label">Our party in this contract</label>
        <input id="our_party" name="our_party" maxLength={300} defaultValue={contract?.our_party ?? ""} aria-describedby="our_party-help" className="input" />
        <p id="our_party-help" className="mt-1 text-xs text-ink-muted">Name or role as written in the contract (for example “the Buyer”). Risks are assessed from this side.</p>
      </div>
      <div>
        <label htmlFor="contract_type" className="label">Type</label>
        <input id="contract_type" name="contract_type" maxLength={120} placeholder="Supply, services, lease…" defaultValue={contract?.contract_type ?? ""} className="input" />
      </div>
      <div>
        <label htmlFor="owner_id" className="label">Contract owner</label>
        <select id="owner_id" name="owner_id" defaultValue={contract?.owner_id ?? ""} className="input">
          <option value="">Unassigned</option>
          {members.map((member) => <option key={member.user_id} value={member.user_id}>{member.full_name ?? member.email}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="effective_date" className="label">Effective date</label>
        <input id="effective_date" name="effective_date" type="date" defaultValue={contract?.effective_date ?? ""} className="input" />
      </div>
      <div>
        <label htmlFor="expiration_date" className="label">Expiration date</label>
        <input id="expiration_date" name="expiration_date" type="date" defaultValue={contract?.expiration_date ?? ""} className="input" />
      </div>
      <div>
        <label htmlFor="auto_renews" className="label">Renews automatically</label>
        <select id="auto_renews" name="auto_renews" defaultValue={renews} className="input">
          <option value="">Not stated</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </div>
      <div>
        <label htmlFor="renewal_term_months" className="label">Renewal term (months)</label>
        <input id="renewal_term_months" name="renewal_term_months" type="number" min={1} max={1200} step={1} defaultValue={contract?.renewal_term_months ?? ""} className="input" />
      </div>
      <div>
        <label htmlFor="notice_period_days" className="label">Notice period (days)</label>
        <input id="notice_period_days" name="notice_period_days" type="number" min={0} max={3650} step={1} defaultValue={contract?.notice_period_days ?? ""} aria-describedby="notice-help" className="input" />
        <p id="notice-help" className="mt-1 text-xs text-ink-muted">The last day to give notice is worked out from the expiration date.</p>
      </div>
      <div>
        <label htmlFor="governing_law" className="label">Governing law</label>
        <input id="governing_law" name="governing_law" maxLength={200} defaultValue={contract?.governing_law ?? ""} className="input" />
      </div>
      <div>
        <label htmlFor="total_value" className="label">Total value</label>
        <input id="total_value" name="total_value" type="number" min={0} step="0.01" defaultValue={contract?.total_value ?? ""} className="input" />
      </div>
      <div>
        <label htmlFor="currency" className="label">Currency (ISO code)</label>
        <input id="currency" name="currency" maxLength={3} pattern="[A-Za-z]{3}" placeholder="USD" defaultValue={contract?.currency ?? ""} className="input uppercase" />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="description" className="label">Notes</label>
        <textarea id="description" name="description" rows={3} maxLength={4000} defaultValue={contract?.description ?? ""} className="input" />
      </div>
    </fieldset>
  );
}
