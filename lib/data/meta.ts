/**
 * ============================================================================
 *  STATIC DEMONSTRATION DATA — NEXORA Phase 1
 * ----------------------------------------------------------------------------
 *  Every module in lib/data/ is hand-written sample content. Nothing is
 *  fetched from, or written to, any server, database, or AI model.
 *  In Phase 2 these modules are replaced by Supabase queries returning the
 *  same TypeScript shapes (see lib/types.ts).
 * ============================================================================
 */
import type { Workspace } from "@/lib/types";

export const DEMO_MODE = true;

/** Reference "today" for every relative date in the demo (a Friday). */
export const DEMO_AS_OF = "2026-10-30";

export const DEMO_DATA_LABEL = "Static demo data";

/** The signed-in executive in the demo. */
export const CURRENT_USER_ID = "u-amara";

/** Seats included in the demo Enterprise plan (Billing placeholder). */
export const DEMO_SEATS_INCLUDED = 25;

export const WORKSPACES: Workspace[] = [
  {
    id: "ws-hq",
    name: "NEXORA HQ",
    plan: "Enterprise",
    region: "US-East · EU-West",
    current: true,
    available: true,
  },
  {
    id: "ws-emea",
    name: "NEXORA EMEA",
    plan: "Enterprise",
    region: "EU-West",
    current: false,
    available: false,
  },
  {
    id: "ws-sandbox",
    name: "Sandbox",
    plan: "Trial",
    region: "US-East",
    current: false,
    available: false,
  },
];
