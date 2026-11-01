import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export interface UserProfile {
  fullName: string;
  initials: string;
  email: string;
  role: string;
}

/**
 * The signed-in user's profile, or null in demo mode / when signed out.
 * Server-only (reads cookies). Never throws — returns null on any error so
 * the shell can fall back to its demo presentation.
 */
export async function getCurrentProfile(): Promise<UserProfile | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (!data) {
      const email = user.email ?? "User";
      return {
        fullName: email,
        initials: email.slice(0, 2).toUpperCase(),
        email,
        role: "",
      };
    }

    return {
      fullName: data.full_name,
      initials: data.initials,
      email: data.email,
      role: data.role,
    };
  } catch {
    return null;
  }
}
