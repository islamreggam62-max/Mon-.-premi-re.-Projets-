import type { Metadata } from "next";
import { SettingsPageView } from "@/components/views/SettingsPageView";

export const metadata: Metadata = { title: "Settings" };

export default function Page() {
  return <SettingsPageView />;
}
