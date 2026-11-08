"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Info,
  Loader2,
  ShieldCheck,
  UploadCloud,
  X,
} from "lucide-react";
import { Select } from "@/components/ui/Controls";
import { DemoBadge } from "@/components/ui/Badge";
import { useLang } from "@/components/lexaudit/LangProvider";
import { LEX_HOME } from "@/lib/lexaudit/nav";
import type { DocumentType, Party } from "@/lib/lexaudit/types";
import { cn } from "@/lib/utils";

const DOC_TYPES: DocumentType[] = ["supply", "services", "tender", "nda"];
const PARTIES: Party[] = ["buyer", "supplier", "contractor"];

/** Key the results view reads to preselect the matching sample. */
export const LAST_DOC_KEY = "lexaudit:lastDoc";

interface PickedFile {
  name: string;
  /** Human-readable size, e.g. "1.8 MB". */
  size: string;
}

function readableSize(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${Math.round(bytes / 1_000)} KB`;
  return `${bytes} B`;
}

export function UploadDropzone() {
  const router = useRouter();
  const { t } = useLang();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<PickedFile | null>(null);
  const [docType, setDocType] = useState<DocumentType>("supply");
  const [party, setParty] = useState<Party>("buyer");
  const [running, setRunning] = useState(false);

  function accept(list: FileList | null) {
    const f = list?.[0];
    if (!f) return;
    setFile({ name: f.name, size: readableSize(f.size) });
  }

  function onDrop(event: React.DragEvent) {
    event.preventDefault();
    setDragging(false);
    accept(event.dataTransfer.files);
  }

  function run() {
    setRunning(true);
    try {
      window.localStorage.setItem(LAST_DOC_KEY, JSON.stringify({ docType, party }));
    } catch {
      /* ignore storage errors */
    }
    // Simulated analysis delay — no file is read and no request is made.
    window.setTimeout(() => {
      router.push(`${LEX_HOME}/results`);
    }, 1100);
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "glass flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors",
          dragging ? "border-violet-500 bg-violet/[0.08]" : "border-white/15",
        )}
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-700 to-violet-500 shadow-glow">
          <UploadCloud className="h-7 w-7 text-white" aria-hidden="true" />
        </span>
        <p className="mt-4 text-base font-semibold text-slate-50">{t("new.drop")}</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="focus-ring mt-1 rounded text-sm font-medium text-violet-300 underline-offset-4 hover:text-violet-200 hover:underline"
        >
          {t("new.browse")}
        </button>
        <p className="mt-3 text-xs text-slate-400">{t("new.formats")}</p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="sr-only"
          onChange={(e) => accept(e.target.files)}
        />

        {file && (
          <div className="mt-6 flex w-full max-w-md items-center gap-3 rounded-xl border border-hairline bg-white/[0.04] p-3 text-start">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet/15 ring-1 ring-inset ring-violet/30">
              <FileText className="h-4 w-4 text-violet-200" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-slate-100">{file.name}</span>
              <span className="block text-xs text-slate-400">{t("new.selected")} · {file.size}</span>
            </span>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              aria-label={t("new.remove")}
              className="focus-ring rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-slate-200"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {/* Options */}
      <div className="glass flex flex-col gap-5 p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-100">{t("new.title")}</h2>
          <DemoBadge label={t("common.demoShort")} />
        </div>

        <Select
          label={t("new.docType")}
          value={docType}
          onChange={setDocType}
          options={DOC_TYPES.map((d) => ({ value: d, label: t(`doc.${d}`) }))}
        />

        <div>
          <Select
            label={t("new.party")}
            value={party}
            onChange={setParty}
            options={PARTIES.map((p) => ({ value: p, label: t(`party.${p}`) }))}
          />
          <p className="mt-1.5 flex items-start gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-300" aria-hidden="true" />
            {t("new.partyHint")}
          </p>
        </div>

        <button
          type="button"
          onClick={run}
          disabled={running}
          className="btn btn-primary w-full py-2.5 text-sm"
        >
          {running ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> {t("new.analyzing")}
            </>
          ) : (
            <>
              <UploadCloud className="h-4 w-4" aria-hidden="true" /> {t("new.analyze")}
            </>
          )}
        </button>

        <p className="flex items-start gap-2 rounded-xl border border-hairline bg-white/[0.02] px-3 py-2 text-xs text-slate-400">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-300" aria-hidden="true" />
          {t("new.demoNote")}
        </p>
      </div>
    </div>
  );
}
