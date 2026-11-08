"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, CircleHelp, FlaskConical, History, ShieldCheck, Smartphone } from "lucide-react";
import { LogoMark } from "@/components/layout/Sidebar";
import { FormActions, FormGrid, SelectField, TextField } from "@/components/ui/Form";
import type { Department } from "@/lib/types";
import { CURRENCY_OPTIONS, DEPARTMENT_OPTIONS, deviceTimeZone } from "@/lib/store/options";
import { useStore } from "@/lib/store/StoreProvider";
import { RestoreBackup } from "./BackupPanel";

/**
 * First launch: set up your own company (saved on this device) or explore the
 * sample company, or restore a backup (new phone, reinstalled app). Also shown
 * after "Erase all data".
 */
export function Welcome() {
  const { actions } = useStore();
  const [step, setStep] = useState<"choose" | "setup" | "restore">("choose");

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-4 py-10 sm:px-6">
      <div className="flex items-center gap-3">
        <LogoMark className="h-10 w-10" />
        <span className="text-sm font-semibold tracking-[0.3em] text-slate-200">NEXORA</span>
      </div>
      <h1 className="mt-6 text-balance text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
        Your executive command center
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-300">
        Projects, tasks, daily reports, and approvals for your company, in one place.
      </p>

      {step === "choose" && (
        <>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setStep("setup")}
              className="glass focus-ring flex flex-col items-start gap-3 p-5 text-left transition hover:border-violet/40"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet/15 ring-1 ring-inset ring-violet/30">
                <Building2 className="h-5 w-5 text-violet-200" aria-hidden="true" />
              </span>
              <span className="text-base font-semibold text-slate-50">Set up my company</span>
              <span className="text-sm leading-relaxed text-slate-300">
                Start empty and add your team, projects, tasks, reports, and approvals.
              </span>
            </button>
            <button
              type="button"
              onClick={actions.startSample}
              className="glass focus-ring flex flex-col items-start gap-3 p-5 text-left transition hover:border-white/25"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ring-1 ring-inset ring-white/15">
                <FlaskConical className="h-5 w-5 text-slate-200" aria-hidden="true" />
              </span>
              <span className="text-base font-semibold text-slate-50">Explore with sample data</span>
              <span className="text-sm leading-relaxed text-slate-300">
                A fictional company of 12 people, ready to try. You can start your own later from Settings.
              </span>
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            <button
              type="button"
              onClick={() => setStep("restore")}
              className="focus-ring inline-flex items-center gap-2 rounded text-sm font-semibold text-violet-300 hover:text-violet-200"
            >
              <History className="h-4 w-4" aria-hidden="true" />
              Restore from a backup
            </button>
            <Link
              href="/help"
              className="focus-ring inline-flex items-center gap-2 rounded text-sm font-semibold text-violet-300 hover:text-violet-200"
            >
              <CircleHelp className="h-4 w-4" aria-hidden="true" />
              How NEXORA works
            </Link>
          </div>
        </>
      )}
      {step === "setup" && <CompanySetupForm onCancel={() => setStep("choose")} />}
      {step === "restore" && (
        <div className="glass mt-8 p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-50">Restore from a backup</h2>
          <p className="mt-1 text-sm text-slate-400">Use a file or the text you saved from Settings, Your data.</p>
          <div className="mt-4">
            <RestoreBackup />
          </div>
          <button type="button" className="btn btn-secondary mt-5 px-4 py-2 text-sm" onClick={() => setStep("choose")}>
            Back
          </button>
        </div>
      )}

      <ul className="mt-8 space-y-2 text-sm text-slate-400">
        <li className="flex gap-2">
          <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" aria-hidden="true" />
          Everything is saved on this device, and works offline. No account is needed.
        </li>
        <li className="flex gap-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" aria-hidden="true" />
          Nothing is sent anywhere. Keep a backup from Settings: uninstalling the app or clearing its storage erases it.
        </li>
      </ul>
    </div>
  );
}

export function CompanySetupForm({ onCancel }: { onCancel: () => void }) {
  const { actions } = useStore();
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [currency, setCurrency] = useState<string>("DZD");
  const [yourName, setYourName] = useState("");
  const [yourTitle, setYourTitle] = useState("");
  const [yourEmail, setYourEmail] = useState("");
  const [department, setDepartment] = useState<Department>("Executive");
  const [error, setError] = useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (companyName.trim().length < 2) return setError("Enter your company's name (at least 2 characters).");
    if (yourName.trim().length < 2) return setError("Enter your name (at least 2 characters).");
    actions.startCompany({
      companyName,
      industry,
      currency,
      timezone: deviceTimeZone(),
      yourName,
      yourTitle: yourTitle || "Chief Executive Officer",
      yourEmail,
      yourDepartment: department,
    });
  }

  return (
    <form onSubmit={submit} className="glass mt-8 p-5 sm:p-6" noValidate>
      <h2 className="text-lg font-semibold text-slate-50">Your company</h2>
      <FormGrid className="mt-4">
        <TextField label="Company name" value={companyName} onChange={setCompanyName} required autoComplete="organization" />
        <TextField label="Industry" value={industry} onChange={setIndustry} placeholder="Distribution, services, industry…" />
        <SelectField label="Currency" value={currency} onChange={setCurrency} options={CURRENCY_OPTIONS} />
      </FormGrid>
      <h2 className="mt-6 text-lg font-semibold text-slate-50">You</h2>
      <FormGrid className="mt-4">
        <TextField label="Your name" value={yourName} onChange={setYourName} required autoComplete="name" />
        <TextField label="Your title" value={yourTitle} onChange={setYourTitle} placeholder="Chief Executive Officer" autoComplete="organization-title" />
        <TextField label="Email" type="email" value={yourEmail} onChange={setYourEmail} autoComplete="email" hint="(optional)" />
        <SelectField label="Department" value={department} onChange={setDepartment} options={DEPARTMENT_OPTIONS} />
      </FormGrid>
      <FormActions error={error} onCancel={onCancel} submitLabel="Create my company" />
    </form>
  );
}
