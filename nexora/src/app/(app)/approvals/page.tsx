import type { Metadata } from "next";
import { getApprovals } from "@/lib/data";
import { ApprovalsClient } from "./approvals-client";

export const metadata: Metadata = { title: "Approvals" };

export default async function ApprovalsPage() {
  const approvals = await getApprovals();
  return <ApprovalsClient approvals={approvals} />;
}
