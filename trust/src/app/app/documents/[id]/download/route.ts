import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

/** Sends the user to a one-minute download link, and records the download in the audit log. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = z.uuid().safeParse((await params).id);
  const failure = NextResponse.redirect(new URL("/app/contracts?error=not_found", request.nextUrl.origin));
  if (!id.success) return failure;

  const supabase = await createClient();
  const { data: document } = await supabase
    .from("documents")
    .select("id, org_id, storage_path, filename")
    .eq("id", id.data)
    .maybeSingle();
  if (!document) return failure;

  const { data: signed, error } = await supabase.storage
    .from("contracts")
    .createSignedUrl(document.storage_path as string, 60, { download: document.filename as string });
  if (error || !signed) return failure;

  await supabase.rpc("log_audit_event", {
    _org: document.org_id,
    _action: "document.downloaded",
    _entity_type: "document",
    _entity_id: document.id,
    _metadata: {},
  });
  return NextResponse.redirect(signed.signedUrl);
}
