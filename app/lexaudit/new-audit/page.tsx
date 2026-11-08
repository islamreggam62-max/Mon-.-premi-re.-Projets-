import type { Metadata } from "next";
import { LexPageHeader } from "@/components/lexaudit/LexPageHeader";
import { UploadDropzone } from "@/components/lexaudit/UploadDropzone";

export const metadata: Metadata = { title: { absolute: "LexAudit AI — Nouvel audit" } };

export default function NewAuditPage() {
  return (
    <div>
      <LexPageHeader titleKey="new.title" subtitleKey="new.subtitle" />
      <UploadDropzone />
    </div>
  );
}
