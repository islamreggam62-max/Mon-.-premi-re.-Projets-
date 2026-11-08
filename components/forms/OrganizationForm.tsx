"use client";

import { t } from "@/lib/i18n/core";
import { useState } from "react";
import { FormGrid, SelectField, TextField } from "@/components/ui/Form";
import { currencyOptions } from "@/lib/store/options";
import { useNexora } from "@/lib/store/StoreProvider";

/** The company profile on this device: name, industry, and the currency amounts are shown in. */
export function OrganizationForm() {
  const { data, actions } = useNexora();
  const [name, setName] = useState(data.company.name);
  const [industry, setIndustry] = useState(data.company.industry);
  const [currency, setCurrency] = useState(data.company.currency);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  const known = currencyOptions();
  const currencyChoices = known.some((c) => c.value === currency) ? known : [...known, { value: currency, label: currency }];
  const changed = name.trim() !== data.company.name || industry.trim() !== data.company.industry || currency !== data.company.currency;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaved("");
    if (name.trim().length < 2) return setError(t("Enter the company's name (at least 2 characters)."));
    setError("");
    actions.updateCompany({ name: name.trim(), industry: industry.trim(), currency });
    setSaved(t("Company profile saved."));
  }

  return (
    <form onSubmit={submit} noValidate>
      <FormGrid>
        <TextField label="Company name" value={name} onChange={setName} required autoComplete="organization" />
        <TextField label="Industry" value={industry} onChange={setIndustry} placeholder="Distribution, services, industry…" />
        <SelectField
          label="Currency"
          value={currency}
          onChange={setCurrency}
          options={currencyChoices}
          hint="relabels amounts, no conversion"
        />
        <div>
          <p className="text-xs font-semibold text-slate-300">{t("Time zone")}</p>
          <p className="mt-1.5 py-2 text-sm text-slate-200">{data.company.timezone}</p>
          <p className="text-xs text-slate-400">{t("“Today” follows this device’s clock.")}</p>
        </div>
      </FormGrid>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="submit" className="btn btn-primary px-4 py-2 text-sm" disabled={!changed}>
          {t("Save profile")}
        </button>
        {error && (
          <p role="alert" className="text-sm text-rose-300">
            {error}
          </p>
        )}
        <p role="status" aria-live="polite" className="text-sm text-emerald-300">
          {saved && !changed ? saved : ""}
        </p>
      </div>
    </form>
  );
}
