"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from "react";
import type { Approval, ApprovalStatus, DailyReport, Person, Project, Task, TaskStatus } from "@/lib/types";
import { companyData, sampleData, type CompanySetup } from "./seed";
import { todayISO, type CompanyProfile, type NexoraData } from "./schema";
import { clearData, loadData, saveData } from "./storage";

/**
 * The device copy of NEXORA's data, for every page. It loads after the first
 * render (localStorage is client-only), saves on every change, and stays empty
 * until the user picks their company or the sample.
 */

type Status = "loading" | "empty" | "ready" | "unreadable";

type Action =
  | { type: "replace"; data: NexoraData | null }
  | { type: "company"; patch: Partial<CompanyProfile> }
  | { type: "upsert-person"; person: Person }
  | { type: "remove-person"; id: string }
  | { type: "upsert-project"; project: Project }
  | { type: "remove-project"; id: string }
  | { type: "upsert-task"; task: Task }
  | { type: "task-status"; id: string; status: TaskStatus }
  | { type: "remove-task"; id: string }
  | { type: "upsert-report"; report: DailyReport }
  | { type: "remove-report"; id: string }
  | { type: "upsert-approval"; approval: Approval }
  | { type: "decide-approval"; id: string; status: ApprovalStatus; note?: string; on: string }
  | { type: "remove-approval"; id: string };

function upsert<T extends { id: string }>(list: T[], item: T): T[] {
  const i = list.findIndex((x) => x.id === item.id);
  if (i === -1) return [...list, item];
  const next = list.slice();
  next[i] = item;
  return next;
}

function reduce(state: NexoraData | null, action: Action): NexoraData | null {
  if (action.type === "replace") return action.data;
  if (!state) return state;
  const s = { ...state, updatedAt: new Date().toISOString() };
  switch (action.type) {
    case "company":
      return { ...s, company: { ...s.company, ...action.patch } };
    case "upsert-person":
      return { ...s, people: upsert(s.people, action.person) };
    case "remove-person":
      return action.id === s.currentUserId ? state : { ...s, people: s.people.filter((p) => p.id !== action.id) };
    case "upsert-project":
      return { ...s, projects: upsert(s.projects, action.project) };
    case "remove-project":
      return { ...s, projects: s.projects.filter((p) => p.id !== action.id) };
    case "upsert-task":
      return { ...s, tasks: upsert(s.tasks, action.task) };
    case "task-status":
      return { ...s, tasks: s.tasks.map((t) => (t.id === action.id ? { ...t, status: action.status } : t)) };
    case "remove-task":
      return { ...s, tasks: s.tasks.filter((t) => t.id !== action.id) };
    case "upsert-report":
      return { ...s, reports: upsert(s.reports, action.report) };
    case "remove-report":
      return { ...s, reports: s.reports.filter((r) => r.id !== action.id) };
    case "upsert-approval":
      return { ...s, approvals: upsert(s.approvals, action.approval) };
    case "decide-approval":
      return {
        ...s,
        approvals: s.approvals.map((a) =>
          a.id === action.id
            ? {
                ...a,
                status: action.status,
                decidedAt: action.status === "approved" || action.status === "rejected" ? action.on : undefined,
                decisionNote: action.note ?? a.decisionNote,
              }
            : a,
        ),
      };
    case "remove-approval":
      return { ...s, approvals: s.approvals.filter((a) => a.id !== action.id) };
  }
}

export interface NexoraActions {
  startCompany: (setup: CompanySetup) => void;
  startSample: () => void;
  /** Replaces everything (restore from a backup). */
  replaceAll: (data: NexoraData) => void;
  /** Deletes the device copy and returns to the welcome screen. */
  eraseAll: () => void;
  updateCompany: (patch: Partial<CompanyProfile>) => void;
  savePerson: (person: Person) => void;
  removePerson: (id: string) => void;
  saveProject: (project: Project) => void;
  removeProject: (id: string) => void;
  saveTask: (task: Task) => void;
  setTaskStatus: (id: string, status: TaskStatus) => void;
  removeTask: (id: string) => void;
  saveReport: (report: DailyReport) => void;
  removeReport: (id: string) => void;
  saveApproval: (approval: Approval) => void;
  decideApproval: (id: string, status: ApprovalStatus, note?: string, on?: string) => void;
  removeApproval: (id: string) => void;
}

interface StoreValue {
  status: Status;
  data: NexoraData | null;
  /** True when the last change could not be written to the device. */
  saveFailed: boolean;
  actions: NexoraActions;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, dispatch] = useReducer(reduce, null);
  const [status, setStatus] = useState<Status>("loading");
  const [saveFailed, setSaveFailed] = useState(false);

  useEffect(() => {
    const stored = loadData();
    if (stored === "unreadable") setStatus("unreadable");
    else {
      dispatch({ type: "replace", data: stored });
      setStatus(stored ? "ready" : "empty");
    }
  }, []);

  // Save after every change. Unreadable data stays untouched until the user starts over.
  useEffect(() => {
    if (data) setSaveFailed(!saveData(data));
  }, [data]);

  const start = useCallback((next: NexoraData) => {
    dispatch({ type: "replace", data: next });
    setStatus("ready");
  }, []);

  const actions = useMemo<NexoraActions>(
    () => ({
      startCompany: (setup) => start(companyData(setup)),
      startSample: () => start(sampleData()),
      replaceAll: (next) => start(next),
      eraseAll: () => {
        clearData();
        dispatch({ type: "replace", data: null });
        setSaveFailed(false);
        setStatus("empty");
      },
      updateCompany: (patch) => dispatch({ type: "company", patch }),
      savePerson: (person) => dispatch({ type: "upsert-person", person }),
      removePerson: (id) => dispatch({ type: "remove-person", id }),
      saveProject: (project) => dispatch({ type: "upsert-project", project }),
      removeProject: (id) => dispatch({ type: "remove-project", id }),
      saveTask: (task) => dispatch({ type: "upsert-task", task }),
      setTaskStatus: (id, taskStatus) => dispatch({ type: "task-status", id, status: taskStatus }),
      removeTask: (id) => dispatch({ type: "remove-task", id }),
      saveReport: (report) => dispatch({ type: "upsert-report", report }),
      removeReport: (id) => dispatch({ type: "remove-report", id }),
      saveApproval: (approval) => dispatch({ type: "upsert-approval", approval }),
      decideApproval: (id, approvalStatus, note, on) =>
        dispatch({ type: "decide-approval", id, status: approvalStatus, note, on: on ?? todayISO() }),
      removeApproval: (id) => dispatch({ type: "remove-approval", id }),
    }),
    [start],
  );

  const value = useMemo(() => ({ status, data, saveFailed, actions }), [status, data, saveFailed, actions]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

/** Store status and actions, for screens that work before data exists (welcome, gate). */
export function useStore(): StoreValue {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useStore must be used inside <StoreProvider>");
  return value;
}

/** The loaded data and actions. Only for screens rendered once the store is ready. */
export function useNexora(): { data: NexoraData; actions: NexoraActions } {
  const { data, actions } = useStore();
  if (!data) throw new Error("useNexora used before the data was ready");
  return { data, actions };
}
