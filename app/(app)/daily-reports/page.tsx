import type { Metadata } from "next";
import { ReportsView } from "@/components/views/ReportsView";

export const metadata: Metadata = { title: "Daily Reports" };

export default function Page() {
  return <ReportsView />;
}
