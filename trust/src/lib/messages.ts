/**
 * Every message shown in a banner. Pages receive a short code in the URL and look
 * it up here, so text from a URL is never rendered directly.
 */
export const MESSAGES: Record<string, { tone: "error" | "success"; text: string }> = {
  // errors
  not_configured: { tone: "error", text: "This installation is not connected to its database yet. See the README for setup." },
  invalid_credentials: { tone: "error", text: "Wrong email or password." },
  signup_failed: { tone: "error", text: "The account could not be created. Check the email address and use a password of at least 10 characters." },
  confirm_failed: { tone: "error", text: "The confirmation link is invalid or has expired." },
  invalid_input: { tone: "error", text: "Some fields are missing or invalid. Please check the form." },
  forbidden: { tone: "error", text: "Your role does not allow this action." },
  not_found: { tone: "error", text: "The item could not be found." },
  plan_limit_contracts: { tone: "error", text: "Your plan's contract limit has been reached." },
  plan_limit_analyses: { tone: "error", text: "All AI analyses included in your plan this month have been used." },
  plan_limit_seats: { tone: "error", text: "This organisation has no free seats left on its plan." },
  file_missing: { tone: "error", text: "Choose a file to upload." },
  file_too_large: { tone: "error", text: "The file is larger than 25 MB." },
  unsupported_file: { tone: "error", text: "Only PDF and Word (.docx) files are accepted." },
  upload_failed: { tone: "error", text: "The file could not be stored. Please try again." },
  no_verified_terms: { tone: "error", text: "There are no verified extracted terms to apply." },
  dates_inconsistent: { tone: "error", text: "The expiration date cannot be earlier than the effective date." },
  contract_not_in_draft: { tone: "error", text: "A review can only be requested for a contract in draft." },
  reviewer_must_differ_from_requester: { tone: "error", text: "You cannot review a contract you submitted yourself." },
  reviewer_not_eligible: { tone: "error", text: "The chosen person cannot act as reviewer." },
  review_already_decided: { tone: "error", text: "This review has already been decided." },
  comment_required: { tone: "error", text: "A written reason is required to reject or request changes." },
  contract_under_review: { tone: "error", text: "This contract is under review. Its record and documents cannot change until the reviewer decides." },
  invalid_status_transition: { tone: "error", text: "The contract cannot move to that status from its current one." },
  last_owner: { tone: "error", text: "An organisation must keep at least one owner." },
  invitation_invalid_or_expired: { tone: "error", text: "This invitation is invalid, already used or expired." },
  invitation_email_mismatch: { tone: "error", text: "This invitation was sent to a different email address than the one you are signed in with." },
  too_many_organizations: { tone: "error", text: "You have reached the number of organisations one account can own." },
  unexpected: { tone: "error", text: "Something went wrong. Nothing was changed." },
  // confirmations
  check_email: { tone: "success", text: "Account created. Check your inbox to confirm your email address, then sign in." },
  saved: { tone: "success", text: "Saved." },
  uploaded: { tone: "success", text: "Document uploaded." },
  terms_applied: { tone: "success", text: "Verified extracted terms were copied to the contract record." },
  review_requested: { tone: "success", text: "Review requested." },
  review_decided: { tone: "success", text: "Decision recorded." },
  member_updated: { tone: "success", text: "Member updated." },
  member_removed: { tone: "success", text: "Member removed." },
  invitation_revoked: { tone: "success", text: "Invitation revoked." },
  joined: { tone: "success", text: "You have joined the organisation." },
};

const KNOWN_DB_ERRORS = [
  "plan_limit_contracts", "plan_limit_analyses", "plan_limit_seats", "contract_not_in_draft",
  "reviewer_must_differ_from_requester", "reviewer_not_eligible", "review_already_decided",
  "comment_required", "invalid_status_transition", "contract_under_review", "last_owner", "invitation_invalid_or_expired",
  "invitation_email_mismatch", "too_many_organizations", "forbidden",
];

/** Maps a database error to one of the codes above. Never exposes the raw message. */
export function errorCode(error: { message?: string; code?: string } | null | undefined): string {
  const message = error?.message ?? "";
  const known = KNOWN_DB_ERRORS.find((code) => message.includes(code));
  if (known) return known;
  if (error?.code === "42501" || /row-level security|permission denied/i.test(message)) return "forbidden";
  if (/contracts_check|expiration_date/i.test(message)) return "dates_inconsistent";
  return "unexpected";
}
