import type { Metadata } from "next";
import { HelpView } from "@/components/views/HelpView";

export const metadata: Metadata = {
  title: "How NEXORA works",
  description: "A short guide to NEXORA: getting started, the modules, a typical day, the rules it checks, and backing up your data.",
};

export default function Page() {
  return <HelpView />;
}
