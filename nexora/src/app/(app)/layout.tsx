import { AppShell } from "@/components/shell/app-shell";
import { getCurrentProfile } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  return <AppShell profile={profile}>{children}</AppShell>;
}
