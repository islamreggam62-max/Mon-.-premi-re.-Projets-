/**
 * Database types for NEXORA's Supabase schema.
 *
 * Hand-written to match supabase/migrations/0001_init.sql. Once you connect a
 * project you can regenerate this file with the Supabase CLI:
 *
 *   supabase gen types typescript --project-id <ref> > src/lib/supabase/types.ts
 *
 * Until then, this keeps the data layer fully typed.
 */

type Timestamp = string;

export interface Database {
  public: {
    Tables: {
      workspaces: {
        Row: { id: string; name: string; created_at: Timestamp };
        Insert: { id?: string; name: string; created_at?: Timestamp };
        Update: Partial<Database["public"]["Tables"]["workspaces"]["Insert"]>;
      };
      profiles: {
        Row: {
          id: string;
          workspace_id: string;
          full_name: string;
          role: string;
          email: string;
          initials: string;
          timezone: string;
          created_at: Timestamp;
        };
        Insert: {
          id: string;
          workspace_id: string;
          full_name: string;
          role?: string;
          email: string;
          initials?: string;
          timezone?: string;
          created_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      team_members: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          role: string;
          department: string;
          email: string;
          status: "active" | "away" | "offline";
          utilization: number;
          active_tasks: number;
          initials: string;
          created_at: Timestamp;
        };
        Insert: Omit<
          Database["public"]["Tables"]["team_members"]["Row"],
          "id" | "created_at"
        > & { id?: string; created_at?: Timestamp };
        Update: Partial<
          Database["public"]["Tables"]["team_members"]["Insert"]
        >;
      };
      projects: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          client: string;
          status: "On track" | "At risk" | "Delayed" | "Completed";
          progress: number;
          lead: string;
          budget_used: number;
          budget_total: number;
          due_date: string;
          team: string[];
          created_at: Timestamp;
        };
        Insert: Omit<
          Database["public"]["Tables"]["projects"]["Row"],
          "id" | "created_at"
        > & { id?: string; created_at?: Timestamp };
        Update: Partial<Database["public"]["Tables"]["projects"]["Insert"]>;
      };
      tasks: {
        Row: {
          id: string;
          workspace_id: string;
          title: string;
          project: string;
          assignee: string;
          assignee_initials: string;
          priority: "Low" | "Medium" | "High" | "Urgent";
          state: "Backlog" | "In progress" | "In review" | "Done";
          due: string;
          sort_order: number;
          created_at: Timestamp;
        };
        Insert: Omit<
          Database["public"]["Tables"]["tasks"]["Row"],
          "id" | "created_at" | "sort_order"
        > & { id?: string; created_at?: Timestamp; sort_order?: number };
        Update: Partial<Database["public"]["Tables"]["tasks"]["Insert"]>;
      };
      daily_reports: {
        Row: {
          id: string;
          workspace_id: string;
          author: string;
          initials: string;
          role: string;
          report_date: string;
          summary: string;
          done: string[];
          blockers: string[];
          mood: "Great" | "Good" | "Okay" | "Blocked";
          created_at: Timestamp;
        };
        Insert: Omit<
          Database["public"]["Tables"]["daily_reports"]["Row"],
          "id" | "created_at"
        > & { id?: string; created_at?: Timestamp };
        Update: Partial<
          Database["public"]["Tables"]["daily_reports"]["Insert"]
        >;
      };
      approvals: {
        Row: {
          id: string;
          workspace_id: string;
          title: string;
          type: "Expense" | "Hiring" | "Contract" | "Access" | "Budget";
          requested_by: string;
          initials: string;
          amount: string | null;
          submitted: string;
          priority: "Low" | "Medium" | "High" | "Urgent";
          decision: "pending" | "approved" | "rejected";
          created_at: Timestamp;
        };
        Insert: Omit<
          Database["public"]["Tables"]["approvals"]["Row"],
          "id" | "created_at" | "decision"
        > & {
          id?: string;
          created_at?: Timestamp;
          decision?: "pending" | "approved" | "rejected";
        };
        Update: Partial<Database["public"]["Tables"]["approvals"]["Insert"]>;
      };
      ai_insights: {
        Row: {
          id: string;
          workspace_id: string;
          title: string;
          detail: string;
          category: "Risk" | "Opportunity" | "Efficiency" | "Forecast";
          confidence: number;
          created_at: Timestamp;
        };
        Insert: Omit<
          Database["public"]["Tables"]["ai_insights"]["Row"],
          "id" | "created_at"
        > & { id?: string; created_at?: Timestamp };
        Update: Partial<Database["public"]["Tables"]["ai_insights"]["Insert"]>;
      };
      activity_events: {
        Row: {
          id: string;
          workspace_id: string;
          actor: string;
          initials: string;
          action: string;
          target: string;
          created_at: Timestamp;
        };
        Insert: Omit<
          Database["public"]["Tables"]["activity_events"]["Row"],
          "id" | "created_at"
        > & { id?: string; created_at?: Timestamp };
        Update: Partial<
          Database["public"]["Tables"]["activity_events"]["Insert"]
        >;
      };
      kpis: {
        Row: {
          id: string;
          workspace_id: string;
          key: string;
          label: string;
          value: string;
          raw: number;
          delta_pct: number;
          trend: "up" | "down";
          hint: string;
          sort_order: number;
        };
        Insert: Omit<Database["public"]["Tables"]["kpis"]["Row"], "id"> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["kpis"]["Insert"]>;
      };
      revenue_points: {
        Row: {
          id: string;
          workspace_id: string;
          month: string;
          revenue: number;
          target: number;
          sort_order: number;
        };
        Insert: Omit<
          Database["public"]["Tables"]["revenue_points"]["Row"],
          "id"
        > & { id?: string };
        Update: Partial<
          Database["public"]["Tables"]["revenue_points"]["Insert"]
        >;
      };
      activity_points: {
        Row: {
          id: string;
          workspace_id: string;
          day: string;
          tasks: number;
          reports: number;
          sort_order: number;
        };
        Insert: Omit<
          Database["public"]["Tables"]["activity_points"]["Row"],
          "id"
        > & { id?: string };
        Update: Partial<
          Database["public"]["Tables"]["activity_points"]["Insert"]
        >;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
