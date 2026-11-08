import { APPROVALS } from "@/lib/data/approvals";
import { DAILY_REPORTS, REPORT_HISTORY } from "@/lib/data/dailyReports";
import { CURRENT_USER_ID } from "@/lib/data/meta";
import { PROJECTS } from "@/lib/data/projects";
import { ORGANIZATION } from "@/lib/data/settings";
import { TASKS } from "@/lib/data/tasks";
import { TEAM } from "@/lib/data/team";
import type { Department, Person } from "@/lib/types";
import { initialsOf, newId, STORE_VERSION, todayISO, type NexoraData } from "./schema";

/** The demonstration company (lib/data), as a store document. */
export function sampleData(): NexoraData {
  const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
  return {
    version: STORE_VERSION,
    mode: "sample",
    company: {
      name: ORGANIZATION.displayName,
      industry: ORGANIZATION.industry,
      timezone: ORGANIZATION.timezone,
      currency: ORGANIZATION.currency,
      createdAt: new Date().toISOString(),
    },
    currentUserId: CURRENT_USER_ID,
    people: clone(TEAM),
    projects: clone(PROJECTS),
    tasks: clone(TASKS),
    reports: clone(DAILY_REPORTS),
    reportHistory: clone(REPORT_HISTORY),
    approvals: clone(APPROVALS),
    updatedAt: new Date().toISOString(),
  };
}

export interface CompanySetup {
  companyName: string;
  industry: string;
  currency: string;
  timezone: string;
  yourName: string;
  yourTitle: string;
  yourEmail: string;
  yourDepartment: Department;
}

/** A new, empty company with the user as its owner. */
export function companyData(setup: CompanySetup): NexoraData {
  const now = new Date().toISOString();
  const owner: Person = {
    id: newId("p"),
    name: setup.yourName.trim(),
    initials: initialsOf(setup.yourName),
    title: setup.yourTitle.trim(),
    department: setup.yourDepartment,
    email: setup.yourEmail.trim(),
    location: "",
    joined: todayISO(),
    workload: 0,
    status: "active",
    accessRole: "owner",
    reportsDaily: false,
  };
  return {
    version: STORE_VERSION,
    mode: "company",
    company: {
      name: setup.companyName.trim(),
      industry: setup.industry.trim(),
      timezone: setup.timezone,
      currency: setup.currency,
      createdAt: now,
    },
    currentUserId: owner.id,
    people: [owner],
    projects: [],
    tasks: [],
    reports: [],
    reportHistory: {},
    approvals: [],
    updatedAt: now,
  };
}
