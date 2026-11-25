import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ContractFields } from "@/components/ContractFields";
import { Banner, PageHeader, SubmitRow } from "@/components/ui";
import { createContract } from "@/lib/actions";
import { getContext, getMembers } from "@/lib/context";

export const metadata: Metadata = { title: "Add contract" };

export default async function NewContractPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const context = await getContext();
  if (!context.canManage) redirect("/app/contracts?error=forbidden");
  const members = await getMembers(context);
  return (
    <>
      <PageHeader title="Add contract" description="Only the title is required. You can upload the document now or later, then run the analysis from the contract page." />
      <Banner searchParams={params} />
      <form action={createContract} className="card p-4">
        <ContractFields members={members} />
        <div className="mt-4">
          <label htmlFor="file" className="label">Contract document (PDF or Word .docx, up to 25 MB)</label>
          <input id="file" name="file" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="input" />
        </div>
        <SubmitRow label="Create contract" cancelHref="/app/contracts" />
      </form>
    </>
  );
}
