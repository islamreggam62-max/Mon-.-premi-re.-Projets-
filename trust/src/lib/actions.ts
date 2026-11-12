"use server";

import { createHash, randomUUID } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getContext, getSession, ORG_COOKIE } from "@/lib/context";
import { isWordDocument, MIME_BY_KIND, sniffKind } from "@/lib/documents/extract";
import { safeNextPath, supabaseEnv } from "@/lib/env";
import { errorCode } from "@/lib/messages";
import { createClient } from "@/lib/supabase/server";

const MAX_FILE_BYTES = 25 * 1024 * 1024;

// ------------------------------------------------------------ helpers ----
function field(formData: FormData, name: string): string | null {
  const value = formData.get(name);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Where to return after an action: a same-site path taken from the form, without its old query. */
function backPath(formData: FormData, fallback: string): string {
  return safeNextPath(formData.get("back"), fallback).split("?")[0]!.split("#")[0]!;
}

function finish(path: string, kind: "error" | "notice", code: string, hash = ""): never {
  redirect(`${path}?${kind}=${encodeURIComponent(code)}${hash}`);
}

const uuid = z.uuid();
const optionalDate = z.union([z.iso.date(), z.null()]);

function parseId(value: FormDataEntryValue | null): string | null {
  const parsed = uuid.safeParse(value);
  return parsed.success ? parsed.data : null;
}

// --------------------------------------------------------------- auth ----
const credentials = z.object({ email: z.email().max(254), password: z.string().min(1).max(200) });

export async function signIn(formData: FormData) {
  const next = safeNextPath(formData.get("next"));
  const suffix = `&next=${encodeURIComponent(next)}`;
  if (!supabaseEnv()) redirect(`/login?error=not_configured${suffix}`);
  const parsed = credentials.safeParse({ email: field(formData, "email"), password: formData.get("password") });
  if (!parsed.success) redirect(`/login?error=invalid_credentials${suffix}`);
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) redirect(`/login?error=invalid_credentials${suffix}`);
  redirect(next);
}

const registration = z.object({
  full_name: z.string().min(1).max(120),
  email: z.email().max(254),
  password: z.string().min(10).max(200),
});

export async function signUp(formData: FormData) {
  const next = safeNextPath(formData.get("next"));
  const suffix = `&next=${encodeURIComponent(next)}`;
  if (!supabaseEnv()) redirect(`/signup?error=not_configured${suffix}`);
  const parsed = registration.safeParse({
    full_name: field(formData, "full_name"),
    email: field(formData, "email"),
    password: formData.get("password"),
  });
  if (!parsed.success) redirect(`/signup?error=signup_failed${suffix}`);
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? (await headers()).get("origin") ?? "";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.full_name },
      emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) redirect(`/signup?error=signup_failed${suffix}`);
  if (data.session) redirect(next);
  redirect(`/login?notice=check_email${suffix}`);
}

export async function signOut() {
  if (supabaseEnv()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}

// ------------------------------------------------------- organisations ----
export async function createOrganization(formData: FormData) {
  const { supabase } = await getSession();
  const name = z.string().min(2).max(120).safeParse(field(formData, "name"));
  if (!name.success) finish("/onboarding", "error", "invalid_input");
  const { data, error } = await supabase.rpc("create_organization", { _name: name.data });
  if (error || !data) finish("/onboarding", "error", errorCode(error));
  await rememberOrg(data as string);
  redirect("/app");
}

export async function switchOrganization(formData: FormData) {
  const orgId = parseId(formData.get("org_id"));
  // The cookie is only a preference; getContext() ignores it unless the user is a member.
  if (orgId) await rememberOrg(orgId);
  redirect("/app");
}

async function rememberOrg(orgId: string) {
  (await cookies()).set(ORG_COOKIE, orgId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function acceptInvitation(formData: FormData) {
  const { supabase } = await getSession();
  const token = z.string().regex(/^[0-9a-f]{64}$/).safeParse(formData.get("token"));
  if (!token.success) finish("/app", "error", "invitation_invalid_or_expired");
  const { data, error } = await supabase.rpc("accept_invitation", { _token: token.data });
  if (error || !data) finish(`/invite/${token.data}`, "error", errorCode(error));
  await rememberOrg(data as string);
  finish("/app", "notice", "joined");
}

export interface InviteState {
  error?: string;
  link?: string;
  email?: string;
}

/** Returns the invitation link to the page once; it is not stored and cannot be shown again. */
export async function inviteMember(_previous: InviteState, formData: FormData): Promise<InviteState> {
  const context = await getContext();
  const parsed = z
    .object({ email: z.email().max(254), role: z.enum(["admin", "manager", "reviewer", "viewer"]) })
    .safeParse({ email: field(formData, "email"), role: formData.get("role") });
  if (!parsed.success) return { error: "invalid_input" };
  const { data, error } = await context.supabase.rpc("create_invitation", {
    _org: context.org.id,
    _email: parsed.data.email,
    _role: parsed.data.role,
  });
  if (error || !data) return { error: errorCode(error) };
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? (await headers()).get("origin") ?? "";
  revalidatePath("/app/team");
  return { link: `${origin}/invite/${data as string}`, email: parsed.data.email };
}

export async function revokeInvitation(formData: FormData) {
  const context = await getContext();
  const id = parseId(formData.get("invitation_id"));
  if (!id) finish("/app/team", "error", "invalid_input");
  const { error } = await context.supabase.from("invitations").delete().eq("id", id).eq("org_id", context.org.id);
  if (error) finish("/app/team", "error", errorCode(error));
  finish("/app/team", "notice", "invitation_revoked");
}

export async function setMemberRole(formData: FormData) {
  const context = await getContext();
  const userId = parseId(formData.get("user_id"));
  const role = z.enum(["owner", "admin", "manager", "reviewer", "viewer"]).safeParse(formData.get("role"));
  if (!userId || !role.success) finish("/app/team", "error", "invalid_input");
  const { error } = await context.supabase.rpc("set_member_role", { _org: context.org.id, _user: userId, _role: role.data });
  if (error) finish("/app/team", "error", errorCode(error));
  finish("/app/team", "notice", "member_updated");
}

export async function removeMember(formData: FormData) {
  const context = await getContext();
  const userId = parseId(formData.get("user_id"));
  if (!userId) finish("/app/team", "error", "invalid_input");
  const { error } = await context.supabase.rpc("remove_member", { _org: context.org.id, _user: userId });
  if (error) finish("/app/team", "error", errorCode(error));
  if (userId === context.user.id) redirect("/app");
  finish("/app/team", "notice", "member_removed");
}

// ----------------------------------------------------------- contracts ----
const contractFields = z.object({
  title: z.string().min(1).max(200),
  counterparty: z.string().max(300).nullable(),
  our_party: z.string().max(300).nullable(),
  contract_type: z.string().max(120).nullable(),
  description: z.string().max(4000).nullable(),
  effective_date: optionalDate,
  expiration_date: optionalDate,
  auto_renews: z.boolean().nullable(),
  renewal_term_months: z.number().int().min(1).max(1200).nullable(),
  notice_period_days: z.number().int().min(0).max(3650).nullable(),
  total_value: z.number().min(0).max(1e15).nullable(),
  currency: z.string().regex(/^[A-Z]{3}$/).nullable(),
  governing_law: z.string().max(200).nullable(),
  owner_id: z.uuid().nullable(),
});

function numberField(formData: FormData, name: string): number | null {
  const raw = field(formData, name);
  if (raw === null) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : Number.NaN; // NaN fails validation instead of silently becoming null
}

function readContractForm(formData: FormData) {
  const renews = field(formData, "auto_renews");
  return contractFields.safeParse({
    title: field(formData, "title"),
    counterparty: field(formData, "counterparty"),
    our_party: field(formData, "our_party"),
    contract_type: field(formData, "contract_type"),
    description: field(formData, "description"),
    effective_date: field(formData, "effective_date"),
    expiration_date: field(formData, "expiration_date"),
    auto_renews: renews === "yes" ? true : renews === "no" ? false : null,
    renewal_term_months: numberField(formData, "renewal_term_months"),
    notice_period_days: numberField(formData, "notice_period_days"),
    total_value: numberField(formData, "total_value"),
    currency: field(formData, "currency")?.toUpperCase() ?? null,
    governing_law: field(formData, "governing_law"),
    owner_id: field(formData, "owner_id"),
  });
}

export async function createContract(formData: FormData) {
  const context = await getContext();
  const parsed = readContractForm(formData);
  if (!parsed.success) finish("/app/contracts/new", "error", "invalid_input");
  const { data, error } = await context.supabase
    .from("contracts")
    .insert({ ...parsed.data, org_id: context.org.id, created_by: context.user.id })
    .select("id")
    .single();
  if (error || !data) finish("/app/contracts/new", "error", errorCode(error));
  const contractId = data.id as string;

  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    const problem = await storeDocument(context, contractId, file);
    if (problem) finish(`/app/contracts/${contractId}`, "error", problem);
  }
  revalidatePath("/app", "layout");
  redirect(`/app/contracts/${contractId}`);
}

export async function updateContract(formData: FormData) {
  const context = await getContext();
  const id = parseId(formData.get("contract_id"));
  if (!id) finish("/app/contracts", "error", "invalid_input");
  const path = `/app/contracts/${id}`;
  const parsed = readContractForm(formData);
  if (!parsed.success) finish(path, "error", "invalid_input", "#record");
  const { data, error } = await context.supabase
    .from("contracts")
    .update(parsed.data)
    .eq("id", id)
    .eq("org_id", context.org.id)
    .select("id");
  if (error) finish(path, "error", errorCode(error), "#record");
  if (!data || data.length === 0) finish(path, "error", "forbidden", "#record");
  revalidatePath("/app", "layout");
  finish(path, "notice", "saved", "#record");
}

export async function setContractStatus(formData: FormData) {
  const context = await getContext();
  const id = parseId(formData.get("contract_id"));
  const status = z.enum(["active", "expired", "terminated", "draft"]).safeParse(formData.get("status"));
  if (!id || !status.success) finish("/app/contracts", "error", "invalid_input");
  const { error } = await context.supabase.rpc("set_contract_status", { _contract: id, _status: status.data });
  if (error) finish(`/app/contracts/${id}`, "error", errorCode(error));
  revalidatePath("/app", "layout");
  finish(`/app/contracts/${id}`, "notice", "saved");
}

// ----------------------------------------------------------- documents ----
export async function uploadDocument(formData: FormData) {
  const context = await getContext();
  const contractId = parseId(formData.get("contract_id"));
  if (!contractId) finish("/app/contracts", "error", "invalid_input");
  const path = `/app/contracts/${contractId}`;
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) finish(path, "error", "file_missing", "#documents");
  const problem = await storeDocument(context, contractId, file);
  if (problem) finish(path, "error", problem, "#documents");
  revalidatePath(path);
  finish(path, "notice", "uploaded", "#documents");
}

/**
 * Checks and stores one contract file. Returns an error code, or null on success.
 * The type is decided from the file's bytes; its name and declared type are not trusted.
 */
async function storeDocument(
  context: Awaited<ReturnType<typeof getContext>>,
  contractId: string,
  file: File,
): Promise<string | null> {
  if (!context.canManage) return "forbidden";
  if (file.size > MAX_FILE_BYTES) return "file_too_large";
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniffKind(bytes);
  if (!kind || (kind === "docx" && !isWordDocument(bytes))) return "unsupported_file";

  const { data: contract } = await context.supabase
    .from("contracts")
    .select("id")
    .eq("id", contractId)
    .eq("org_id", context.org.id)
    .maybeSingle();
  if (!contract) return "not_found";

  const documentId = randomUUID();
  const storagePath = `${context.org.id}/${contractId}/${documentId}.${kind}`;
  const { error: uploadError } = await context.supabase.storage
    .from("contracts")
    .upload(storagePath, bytes, { contentType: MIME_BY_KIND[kind], upsert: false });
  if (uploadError) return "upload_failed";

  const { error } = await context.supabase.from("documents").insert({
    id: documentId,
    org_id: context.org.id,
    contract_id: contractId,
    storage_path: storagePath,
    filename: cleanFilename(file.name, kind),
    mime_type: MIME_BY_KIND[kind],
    size_bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    uploaded_by: context.user.id,
  });
  if (error) {
    // Best effort: only owners and admins may delete files, so this can leave an unreferenced file behind.
    await context.supabase.storage.from("contracts").remove([storagePath]);
    return errorCode(error);
  }
  return null;
}

function cleanFilename(name: string, kind: string): string {
  const base = name.split(/[\\/]/).pop() ?? "";
  const cleaned = base.replace(/[\u0000-\u001f\u007f<>:"|?*]/g, "").trim().slice(0, 200);
  return cleaned.length > 0 ? cleaned : `contract.${kind}`;
}

/** Copies VERIFIED extracted terms into the contract record. A person triggers this; the pipeline never does. */
export async function applyExtractedTerms(formData: FormData) {
  const context = await getContext();
  const id = parseId(formData.get("contract_id"));
  if (!id) finish("/app/contracts", "error", "invalid_input");
  const path = `/app/contracts/${id}`;
  const { data: facts, error: factsError } = await context.supabase
    .from("contract_facts")
    .select("field, value_text, value_date, value_number, currency")
    .eq("contract_id", id)
    .eq("org_id", context.org.id)
    .eq("superseded", false)
    .eq("evidence_verified", true)
    .order("created_at");
  if (factsError) finish(path, "error", errorCode(factsError), "#terms");

  const update: Record<string, string | number | boolean> = {};
  const take = (name: string, value: string | number | boolean | null | undefined) => {
    if (value !== null && value !== undefined && !(name in update)) update[name] = value;
  };
  const wholeNumber = (value: number | null, min: number, max: number) =>
    value !== null && Number.isInteger(Number(value)) && Number(value) >= min && Number(value) <= max ? Number(value) : null;
  for (const fact of facts ?? []) {
    const number = fact.value_number === null ? null : Number(fact.value_number);
    switch (fact.field) {
      case "effective_date": take("effective_date", fact.value_date); break;
      case "expiration_date": take("expiration_date", fact.value_date); break;
      case "auto_renews": if (number === 0 || number === 1) take("auto_renews", number === 1); break;
      case "renewal_term_months": take("renewal_term_months", wholeNumber(number, 1, 1200)); break;
      case "notice_period_days": take("notice_period_days", wholeNumber(number, 0, 3650)); break;
      case "governing_law": take("governing_law", String(fact.value_text).slice(0, 200)); break;
      case "total_value":
        if (number !== null && number >= 0) {
          take("total_value", number);
          if (typeof fact.currency === "string" && /^[A-Z]{3}$/.test(fact.currency)) take("currency", fact.currency);
        }
        break;
    }
  }
  if (Object.keys(update).length === 0) finish(path, "error", "no_verified_terms", "#terms");
  const { data, error } = await context.supabase.from("contracts").update(update).eq("id", id).eq("org_id", context.org.id).select("id");
  if (error) finish(path, "error", errorCode(error), "#terms");
  if (!data || data.length === 0) finish(path, "error", "forbidden", "#terms");
  revalidatePath("/app", "layout");
  finish(path, "notice", "terms_applied", "#record");
}

// ------------------------------------------------------------ findings ----
export async function updateRiskStatus(formData: FormData) {
  const context = await getContext();
  const id = parseId(formData.get("risk_id"));
  const back = backPath(formData, "/app/contracts");
  const status = z.enum(["open", "accepted", "mitigated", "dismissed"]).safeParse(formData.get("status"));
  if (!id || !status.success) finish(back, "error", "invalid_input", "#risks");
  const { data, error } = await context.supabase
    .from("risks")
    .update({ status: status.data, resolution_note: field(formData, "resolution_note")?.slice(0, 2000) ?? null })
    .eq("id", id)
    .eq("org_id", context.org.id)
    .select("id");
  if (error) finish(back, "error", errorCode(error), "#risks");
  if (!data || data.length === 0) finish(back, "error", "forbidden", "#risks");
  revalidatePath("/app", "layout");
  finish(back, "notice", "saved", "#risks");
}

export async function addRisk(formData: FormData) {
  const context = await getContext();
  const contractId = parseId(formData.get("contract_id"));
  if (!contractId) finish("/app/contracts", "error", "invalid_input");
  const path = `/app/contracts/${contractId}`;
  const parsed = z
    .object({
      title: z.string().min(1).max(300),
      explanation: z.string().min(1).max(4000),
      recommendation: z.string().max(4000).nullable(),
      category: z.string().min(1).max(60),
      severity: z.enum(["low", "medium", "high", "critical"]),
      clause_ref: z.string().max(200).nullable(),
    })
    .safeParse({
      title: field(formData, "title"),
      explanation: field(formData, "explanation"),
      recommendation: field(formData, "recommendation"),
      category: field(formData, "category") ?? "other",
      severity: formData.get("severity"),
      clause_ref: field(formData, "clause_ref"),
    });
  if (!parsed.success) finish(path, "error", "invalid_input", "#risks");
  const { error } = await context.supabase
    .from("risks")
    .insert({ ...parsed.data, org_id: context.org.id, contract_id: contractId, created_by: context.user.id });
  if (error) finish(path, "error", errorCode(error), "#risks");
  revalidatePath("/app", "layout");
  finish(path, "notice", "saved", "#risks");
}

export async function updateObligation(formData: FormData) {
  const context = await getContext();
  const id = parseId(formData.get("obligation_id"));
  const back = backPath(formData, "/app/obligations");
  const status = z.enum(["open", "in_progress", "done", "waived"]).safeParse(formData.get("status"));
  if (!id || !status.success) finish(back, "error", "invalid_input", "#obligations");
  const update: Record<string, string | null> = { status: status.data };
  // Only managers see these fields; the database refuses the change for anyone else.
  if (formData.has("assignee_id")) update.assignee_id = parseId(formData.get("assignee_id"));
  if (formData.has("due_date")) {
    const due = optionalDate.safeParse(field(formData, "due_date"));
    if (!due.success) finish(back, "error", "invalid_input", "#obligations");
    update.due_date = due.data;
  }
  const { data, error } = await context.supabase.from("obligations").update(update).eq("id", id).eq("org_id", context.org.id).select("id");
  if (error) finish(back, "error", errorCode(error), "#obligations");
  if (!data || data.length === 0) finish(back, "error", "forbidden", "#obligations");
  revalidatePath("/app", "layout");
  finish(back, "notice", "saved", "#obligations");
}

export async function addObligation(formData: FormData) {
  const context = await getContext();
  const contractId = parseId(formData.get("contract_id"));
  if (!contractId) finish("/app/contracts", "error", "invalid_input");
  const path = `/app/contracts/${contractId}`;
  const parsed = z
    .object({
      description: z.string().min(1).max(2000),
      responsible_party: z.string().max(300).nullable(),
      category: z.string().min(1).max(60),
      due_date: optionalDate,
      recurrence: z.string().max(300).nullable(),
      clause_ref: z.string().max(200).nullable(),
      assignee_id: z.uuid().nullable(),
    })
    .safeParse({
      description: field(formData, "description"),
      responsible_party: field(formData, "responsible_party"),
      category: field(formData, "category") ?? "other",
      due_date: field(formData, "due_date"),
      recurrence: field(formData, "recurrence"),
      clause_ref: field(formData, "clause_ref"),
      assignee_id: field(formData, "assignee_id"),
    });
  if (!parsed.success) finish(path, "error", "invalid_input", "#obligations");
  const { error } = await context.supabase
    .from("obligations")
    .insert({ ...parsed.data, org_id: context.org.id, contract_id: contractId, created_by: context.user.id });
  if (error) finish(path, "error", errorCode(error), "#obligations");
  revalidatePath("/app", "layout");
  finish(path, "notice", "saved", "#obligations");
}

// ------------------------------------------------------------- reviews ----
export async function requestReview(formData: FormData) {
  const context = await getContext();
  const contractId = parseId(formData.get("contract_id"));
  const reviewerId = parseId(formData.get("reviewer_id"));
  if (!contractId) finish("/app/contracts", "error", "invalid_input");
  const path = `/app/contracts/${contractId}`;
  if (!reviewerId) finish(path, "error", "invalid_input", "#review");
  const { error } = await context.supabase.rpc("request_review", { _contract: contractId, _reviewer: reviewerId });
  if (error) finish(path, "error", errorCode(error), "#review");
  revalidatePath("/app", "layout");
  finish(path, "notice", "review_requested", "#review");
}

export async function decideReview(formData: FormData) {
  const context = await getContext();
  const reviewId = parseId(formData.get("review_id"));
  const back = backPath(formData, "/app/reviews");
  const decision = z.enum(["approved", "rejected", "changes_requested"]).safeParse(formData.get("decision"));
  if (!reviewId || !decision.success) finish(back, "error", "invalid_input");
  const { error } = await context.supabase.rpc("decide_review", {
    _review: reviewId,
    _decision: decision.data,
    _comment: field(formData, "comment")?.slice(0, 4000) ?? null,
  });
  if (error) finish(back, "error", errorCode(error));
  revalidatePath("/app", "layout");
  finish(back, "notice", "review_decided");
}
