import type { Task } from "@/types";

export const tasks: readonly Task[] = [
  // ATLAS — Atlas ERP Migration
  { id: "tsk-1101", key: "NX-1101", title: "Reconcile legacy GL balances for the dry-run rerun", projectId: "prj-atlas", assigneeId: "mbr-nour", status: "in-progress", priority: "critical", dueDate: "2026-10-27", estimateHours: 16 },
  { id: "tsk-1102", key: "NX-1102", title: "Fix currency-conversion defects in the AP module", projectId: "prj-atlas", assigneeId: "mbr-mateo", status: "in-progress", priority: "high", dueDate: "2026-10-28", estimateHours: 12 },
  { id: "tsk-1103", key: "NX-1103", title: "Finalize role mapping for 340 ERP users", projectId: "prj-atlas", assigneeId: "mbr-hugo", status: "todo", priority: "high", dueDate: "2026-10-29", estimateHours: 10 },
  { id: "tsk-1104", key: "NX-1104", title: "Cleanse vendor master data", projectId: "prj-atlas", assigneeId: "mbr-karim", status: "blocked", priority: "high", dueDate: "2026-11-04", estimateHours: 14, blockedReason: "112 suppliers are missing tax IDs; Procurement has not supplied them." },
  { id: "tsk-1105", key: "NX-1105", title: "UAT script library — Finance and Procurement", projectId: "prj-atlas", assigneeId: "mbr-priya", status: "in-review", priority: "medium", dueDate: "2026-11-06", estimateHours: 8 },
  { id: "tsk-1106", key: "NX-1106", title: "Cutover runbook v1", projectId: "prj-atlas", assigneeId: "mbr-ethan", status: "todo", priority: "high", dueDate: "2026-11-13", estimateHours: 6 },
  { id: "tsk-1107", key: "NX-1107", title: "Rerun data migration dry run #2", projectId: "prj-atlas", assigneeId: "mbr-nour", status: "todo", priority: "critical", dueDate: "2026-11-09", estimateHours: 20 },
  { id: "tsk-1108", key: "NX-1108", title: "Integration tests for payroll export", projectId: "prj-atlas", assigneeId: "mbr-mateo", status: "done", priority: "medium", dueDate: "2026-10-28", estimateHours: 8, completedOn: "2026-10-27" },
  { id: "tsk-1109", key: "NX-1109", title: "Archive legacy reports to cold storage", projectId: "prj-atlas", assigneeId: "mbr-hugo", status: "done", priority: "low", dueDate: "2026-10-30", estimateHours: 4, completedOn: "2026-10-29" },
  { id: "tsk-1110", key: "NX-1110", title: "Controller sign-off on the chart of accounts", projectId: "prj-atlas", assigneeId: "mbr-mei", status: "in-progress", priority: "high", dueDate: "2026-11-03", estimateHours: 3 },

  // HELIOS — Helios Customer Portal
  { id: "tsk-1201", key: "NX-1201", title: "Pen-test remediation: session handling", projectId: "prj-helios", assigneeId: "mbr-hugo", status: "in-progress", priority: "high", dueDate: "2026-11-04", estimateHours: 10 },
  { id: "tsk-1202", key: "NX-1202", title: "Self-service invoice download", projectId: "prj-helios", assigneeId: "mbr-mateo", status: "in-review", priority: "medium", dueDate: "2026-11-02", estimateHours: 8 },
  { id: "tsk-1203", key: "NX-1203", title: "Accessibility audit fixes (WCAG 2.2 AA)", projectId: "prj-helios", assigneeId: "mbr-priya", status: "in-progress", priority: "medium", dueDate: "2026-11-10", estimateHours: 12 },
  { id: "tsk-1204", key: "NX-1204", title: "Synthesize beta feedback from key accounts", projectId: "prj-helios", assigneeId: "mbr-omar", status: "done", priority: "medium", dueDate: "2026-10-30", estimateHours: 5, completedOn: "2026-10-28" },
  { id: "tsk-1205", key: "NX-1205", title: "Launch messaging and release notes", projectId: "prj-helios", assigneeId: "mbr-julia", status: "todo", priority: "medium", dueDate: "2026-11-18", estimateHours: 6 },
  { id: "tsk-1206", key: "NX-1206", title: "Load test at 5,000 concurrent sessions", projectId: "prj-helios", assigneeId: "mbr-hugo", status: "done", priority: "high", dueDate: "2026-10-30", estimateHours: 6, completedOn: "2026-10-30" },
  { id: "tsk-1207", key: "NX-1207", title: "General-availability readiness checklist", projectId: "prj-helios", assigneeId: "mbr-priya", status: "backlog", priority: "low", dueDate: "2026-11-24", estimateHours: 3 },

  // NORTH — Northstar GCC Expansion
  { id: "tsk-1301", key: "NX-1301", title: "Answer licensing-authority queries", projectId: "prj-northstar", assigneeId: "mbr-ines", status: "in-progress", priority: "critical", dueDate: "2026-10-26", estimateHours: 6 },
  { id: "tsk-1302", key: "NX-1302", title: "Shortlist three local distributors", projectId: "prj-northstar", assigneeId: "mbr-omar", status: "in-progress", priority: "high", dueDate: "2026-10-29", estimateHours: 10 },
  { id: "tsk-1303", key: "NX-1303", title: "Transfer-pricing memo for the GCC entity", projectId: "prj-northstar", assigneeId: "mbr-rachid", status: "blocked", priority: "high", dueDate: "2026-11-12", estimateHours: 8, blockedReason: "Waiting for the external tax adviser's opinion." },
  { id: "tsk-1304", key: "NX-1304", title: "Market pricing model v2", projectId: "prj-northstar", assigneeId: "mbr-sarah", status: "done", priority: "high", dueDate: "2026-10-30", estimateHours: 6, completedOn: "2026-10-27" },
  { id: "tsk-1305", key: "NX-1305", title: "Distributor agreement template", projectId: "prj-northstar", assigneeId: "mbr-thomas", status: "todo", priority: "medium", dueDate: "2026-11-16", estimateHours: 8 },

  // COST — Q4 Cost Optimization Program
  { id: "tsk-1401", key: "NX-1401", title: "Consolidate SaaS licenses (target −18% seats)", projectId: "prj-cost", assigneeId: "mbr-mei", status: "in-progress", priority: "high", dueDate: "2026-10-28", estimateHours: 8 },
  { id: "tsk-1402", key: "NX-1402", title: "Renegotiate rates with the top 10 logistics carriers", projectId: "prj-cost", assigneeId: "mbr-lina", status: "blocked", priority: "critical", dueDate: "2026-11-13", estimateHours: 16, blockedReason: "Two carriers refuse to reopen rates before Q1." },
  { id: "tsk-1403", key: "NX-1403", title: "Travel policy update and approval flow", projectId: "prj-cost", assigneeId: "mbr-claire", status: "done", priority: "medium", dueDate: "2026-10-30", estimateHours: 4, completedOn: "2026-10-26" },
  { id: "tsk-1404", key: "NX-1404", title: "Energy contract tender for three sites", projectId: "prj-cost", assigneeId: "mbr-youssef", status: "todo", priority: "medium", dueDate: "2026-11-20", estimateHours: 10 },
  { id: "tsk-1405", key: "NX-1405", title: "Savings tracker in the monthly close pack", projectId: "prj-cost", assigneeId: "mbr-mei", status: "done", priority: "medium", dueDate: "2026-10-30", estimateHours: 5, completedOn: "2026-10-29" },

  // SCV — Supply Chain Visibility
  { id: "tsk-1501", key: "NX-1501", title: "Warehouse IoT pilot — sensor recalibration", projectId: "prj-scv", assigneeId: "mbr-karim", status: "in-progress", priority: "critical", dueDate: "2026-10-23", estimateHours: 12 },
  { id: "tsk-1502", key: "NX-1502", title: "Carrier ETA feed: fix 14% missing events", projectId: "prj-scv", assigneeId: "mbr-nour", status: "in-progress", priority: "high", dueDate: "2026-10-28", estimateHours: 10 },
  { id: "tsk-1503", key: "NX-1503", title: "Control tower exception alerts", projectId: "prj-scv", assigneeId: "mbr-hugo", status: "blocked", priority: "high", dueDate: "2026-11-06", estimateHours: 12, blockedReason: "Needs data-quality sign-off on the IoT pilot." },
  { id: "tsk-1504", key: "NX-1504", title: "Customs broker data-sharing agreement", projectId: "prj-scv", assigneeId: "mbr-lina", status: "blocked", priority: "critical", dueDate: "2026-11-03", estimateHours: 6, blockedReason: "Legal sign-off on the data-sharing clauses is outstanding." },
  { id: "tsk-1505", key: "NX-1505", title: "Rollout plan for six regional hubs", projectId: "prj-scv", assigneeId: "mbr-youssef", status: "todo", priority: "high", dueDate: "2026-11-13", estimateHours: 8 },
  { id: "tsk-1506", key: "NX-1506", title: "Carrier API: add two regional carriers", projectId: "prj-scv", assigneeId: "mbr-nour", status: "done", priority: "medium", dueDate: "2026-10-30", estimateHours: 8, completedOn: "2026-10-28" },

  // TALENT — Talent Engine 2027
  { id: "tsk-1601", key: "NX-1601", title: "2027 workforce plan by department", projectId: "prj-talent", assigneeId: "mbr-fatima", status: "done", priority: "high", dueDate: "2026-10-23", estimateHours: 12, completedOn: "2026-10-23" },
  { id: "tsk-1602", key: "NX-1602", title: "Hiring plan budget model", projectId: "prj-talent", assigneeId: "mbr-fatima", status: "in-progress", priority: "high", dueDate: "2026-11-12", estimateHours: 8 },
  { id: "tsk-1603", key: "NX-1603", title: "Recruiting partner RFP", projectId: "prj-talent", assigneeId: "mbr-claire", status: "todo", priority: "medium", dueDate: "2026-11-27", estimateHours: 6 },
  { id: "tsk-1604", key: "NX-1604", title: "Interview scorecards for each role family", projectId: "prj-talent", assigneeId: "mbr-fatima", status: "done", priority: "medium", dueDate: "2026-10-30", estimateHours: 5, completedOn: "2026-10-30" },

  // REG — Regulatory Compliance Hub
  { id: "tsk-1701", key: "NX-1701", title: "Policy attestation workflow — Finance pilot", projectId: "prj-reghub", assigneeId: "mbr-ines", status: "in-progress", priority: "high", dueDate: "2026-10-29", estimateHours: 6 },
  { id: "tsk-1702", key: "NX-1702", title: "Map obligations to control owners", projectId: "prj-reghub", assigneeId: "mbr-thomas", status: "in-review", priority: "high", dueDate: "2026-11-05", estimateHours: 8 },
  { id: "tsk-1703", key: "NX-1703", title: "Contract clause library (200 clauses)", projectId: "prj-reghub", assigneeId: "mbr-ines", status: "done", priority: "medium", dueDate: "2026-10-30", estimateHours: 10, completedOn: "2026-10-27" },
  { id: "tsk-1704", key: "NX-1704", title: "Regulatory change-feed integration", projectId: "prj-reghub", assigneeId: "mbr-nour", status: "todo", priority: "medium", dueDate: "2026-11-25", estimateHours: 8 },

  // BRAND — Brand Refresh 2026 (completed)
  { id: "tsk-1801", key: "NX-1801", title: "Publish the new brand guidelines", projectId: "prj-brand", assigneeId: "mbr-julia", status: "done", priority: "medium", dueDate: "2026-09-25", estimateHours: 6, completedOn: "2026-09-25" },
];
