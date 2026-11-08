"use client";

import { intlLocale, t, tn } from "@/lib/i18n/core";
import { useEffect, useId, useState } from "react";
import { ClipboardCopy, Download, FileUp, Share2, Trash2 } from "lucide-react";
import { isNativeApp, shareBackupFile } from "@/lib/native";
import type { NexoraData } from "@/lib/store/schema";
import { todayISO } from "@/lib/store/schema";
import { validateData } from "@/lib/store/storage";
import { useStore } from "@/lib/store/StoreProvider";

/**
 * Backup and restore of the device data. On the web the backup downloads as a
 * file. A download does nothing inside the Android app's web view, so there the
 * file goes through the Android share menu (Drive, email, chat, Files). Copying
 * as text works everywhere.
 */
export function BackupPanel() {
  const { data, actions } = useStore();
  const [native, setNative] = useState(false);
  const [message, setMessage] = useState("");
  const [fallbackText, setFallbackText] = useState("");
  const [confirmErase, setConfirmErase] = useState(false);
  useEffect(() => setNative(isNativeApp()), []);
  if (!data) return null;

  const json = JSON.stringify(data, null, 2);
  const fileName = `nexora-backup-${todayISO()}.json`;

  function download() {
    const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage(t("Backup saved as {file}.", { file: fileName }));
  }

  async function share() {
    setFallbackText("");
    setMessage("");
    try {
      const result = await shareBackupFile(fileName, json);
      // Android reports some share targets as a cancel, so a closed menu is not called a failure.
      setMessage(result === "shared" ? t("Backup {file} shared. Keep it somewhere safe.", { file: fileName }) : t("The share menu was closed."));
    } catch {
      setMessage(t("The backup could not be shared. Use “Copy backup as text” instead."));
    }
  }

  async function copy() {
    setFallbackText("");
    try {
      await navigator.clipboard.writeText(json);
      setMessage(t("Backup copied. Paste it somewhere safe, such as a note or an email to yourself."));
    } catch {
      setFallbackText(json);
      setMessage(t("Copying is blocked here: select the text below and copy it."));
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-slate-100">{t("Back up")}</h3>
        <p className="mt-1 text-xs leading-relaxed text-slate-400">
          {t("{items}. Last change {date}.", {
            items: [
              tn(data.people.length, "{n} person", "{n} people"),
              tn(data.projects.length, "{n} project", "{n} projects"),
              tn(data.tasks.length, "{n} task", "{n} tasks"),
              tn(data.reports.length, "{n} report", "{n} reports"),
              tn(data.approvals.length, "{n} approval", "{n} approvals"),
            ].join(t(", ")),
            date: new Date(data.updatedAt).toLocaleString(intlLocale()),
          })}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {native ? (
            <button type="button" className="btn btn-primary px-4 py-2 text-sm" onClick={share}>
              <Share2 className="h-4 w-4" aria-hidden="true" />
              {t("Share backup file")}
            </button>
          ) : (
            <button type="button" className="btn btn-primary px-4 py-2 text-sm" onClick={download}>
              <Download className="h-4 w-4" aria-hidden="true" />
              {t("Download backup file")}
            </button>
          )}
          <button type="button" className="btn btn-secondary px-4 py-2 text-sm" onClick={copy}>
            <ClipboardCopy className="h-4 w-4" aria-hidden="true" />
            {t("Copy backup as text")}
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-300" role="status" aria-live="polite">
          {message}
        </p>
        {fallbackText && (
          <textarea
            readOnly
            value={fallbackText}
            rows={6}
            aria-label={t("Backup text")}
            className="field mt-2 font-mono text-[11px]"
            onFocus={(event) => event.currentTarget.select()}
          />
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-100">{t("Restore")}</h3>
        <p className="mt-1 text-xs text-slate-400">{t("Replaces everything on this device with the backup.")}</p>
        <div className="mt-3">
          <RestoreBackup />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-100">{t("Erase")}</h3>
        <p className="mt-1 text-xs text-slate-400">
          {t("Deletes all NEXORA data from this device and returns to the welcome screen.")}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {confirmErase ? (
            <>
              <span className="text-sm text-slate-300">{t("Erase everything? This cannot be undone.")}</span>
              <button type="button" className="btn btn-danger px-4 py-2 text-sm" onClick={actions.eraseAll}>
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                {t("Erase all data")}
              </button>
              <button type="button" className="btn btn-secondary px-4 py-2 text-sm" onClick={() => setConfirmErase(false)}>
                {t("Cancel")}
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-danger px-4 py-2 text-sm" onClick={() => setConfirmErase(true)}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {t("Erase all data…")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Restore from a backup file or pasted text, after a confirmation. */
export function RestoreBackup() {
  const { actions } = useStore();
  const fileId = useId();
  const textId = useId();
  const [pasted, setPasted] = useState("");
  const [pending, setPending] = useState<NexoraData | null>(null);
  const [error, setError] = useState("");

  function check(text: string) {
    setError("");
    setPending(null);
    try {
      const result = validateData(JSON.parse(text));
      if (result.ok) setPending(result.data);
      else setError(result.reason);
    } catch {
      setError(t("This is not a NEXORA backup (it is not valid JSON)."));
    }
  }

  function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    file.text().then(check, () => setError(t("The file could not be read.")));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={fileId} className="btn btn-secondary cursor-pointer px-4 py-2 text-sm">
          <FileUp className="h-4 w-4" aria-hidden="true" />
          {t("Choose a backup file")}
        </label>
        <input id={fileId} type="file" accept="application/json,.json" className="sr-only" onChange={onFile} />
      </div>
      <div>
        <label htmlFor={textId} className="mb-1.5 block text-xs font-semibold text-slate-300">
          {t("Or paste the backup text")}
        </label>
        <textarea id={textId} value={pasted} rows={3} onChange={(e) => setPasted(e.target.value)} className="field font-mono text-[11px]" />
        <button type="button" className="btn btn-secondary mt-2 px-4 py-2 text-sm" disabled={!pasted.trim()} onClick={() => check(pasted)}>
          {t("Check pasted backup")}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-rose-300">
          {error}
        </p>
      )}
      {pending && (
        <div role="alert" className="rounded-xl border border-status-amber/30 bg-status-amber/10 p-3 text-sm text-amber-100">
          <p>
            {t("Backup of {company} ({people}, {projects}, {tasks}), last changed {date}. Replace the data on this device?", {
              company: pending.company.name,
              people: tn(pending.people.length, "{n} person", "{n} people"),
              projects: tn(pending.projects.length, "{n} project", "{n} projects"),
              tasks: tn(pending.tasks.length, "{n} task", "{n} tasks"),
              date: new Date(pending.updatedAt).toLocaleString(intlLocale()),
            })}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-primary px-4 py-2 text-sm"
              onClick={() => {
                actions.replaceAll(pending);
                setPending(null);
                setPasted("");
              }}
            >
              {t("Restore this backup")}
            </button>
            <button type="button" className="btn btn-secondary px-4 py-2 text-sm" onClick={() => setPending(null)}>
              {t("Cancel")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
