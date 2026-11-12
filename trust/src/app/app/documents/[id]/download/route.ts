import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { storagePathFor } from "@/lib/ai/pipeline";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Hands a member a one-minute download link for a document.
 *
 * Files cannot be read from storage with a user's own session. The only way to a
 * file is this route, which (1) reads the document row as the user, so the database
 * decides whether they may see it, (2) records the download in the audit log, and
 * only then (3) creates the link with the server's key. If the audit entry cannot be
 * written, no link is given.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = z.uuid().safeParse((await params).id);
  const failure = NextResponse.redirect(new URL("/app/contracts?error=not_found", request.nextUrl.origin));
  if (!id.success) return failure;

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return failure;
  const { data: document } = await supabase
    .from("documents")
    .select("id, org_id, contract_id, mime_type, filename")
    .eq("id", id.data)
    .maybeSingle();
  if (!document || !process.env.SUPABASE_SECRET_KEY) return failure;

  let path: string;
  try {
    path = storagePathFor(document.org_id, document.contract_id, document.id, document.mime_type);
  } catch {
    return failure;
  }
  const admin = createAdminClient();
  const { error: auditError } = await admin.rpc("record_document_download", { _document: document.id, _actor: auth.user.id });
  if (auditError) return failure;
  const { data: signed, error } = await admin.storage
    .from("contracts")
    .createSignedUrl(path, 60, { download: document.filename as string });
  if (error || !signed) return failure;
  return NextResponse.redirect(signed.signedUrl);
}
