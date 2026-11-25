---
name: trust-security-review
description: >-
  Run a defensive security review of a TRUST change or of the whole application, with independent reviewers, and turn the findings into fixes with tests. Use before any release and after any change to data access, files, authentication or the AI pipeline. مراجعة أمنية دفاعية لـ TRUST.
---

# TRUST — security review

Defensive review of the owner's own code. The goal is a list of flaws with fixes and
regression tests, not attack tooling: a proof is the smallest statement that shows
the flaw against a local copy of this codebase, nothing more.

## Who

- `trust-tenant-security-reviewer` — data access, policies, functions, storage.
- `trust-security-engineer` — application code: actions, routes, files, redirects, secrets.
- `trust-independent-auditor` — afterwards, checks that each finding was really fixed.

Reviewers are read-only and did not write what they review. Give each a complete
brief: scope, files, the guarantees in `trust/docs/SECURITY.md`, where scratch work
may go, and the report format below. Run the first two in parallel.

## Questions every review answers

1. What does a member of **another organisation** get? An anonymous caller?
2. What does a **low-privilege member** gain beyond their role?
3. Where does the **server's key** act on something a user supplied or stored
   (paths, ids, URLs)?
4. What can a **hostile document** do: slow or crash the parser, steer the model,
   reach the page as markup?
5. What can be done **repeatedly** to spend money or fill the logs?
6. What happens **after approval**: can the approved thing change?
7. Which **tests claim** a guarantee the code does not provide?

## Report format

A table by severity: where (file and line), the flaw in one sentence, who can do
what and what they gain, whether it was proved by running it or found by reading,
and the fix. Then what was found sound, and what could not be checked.

## After the review

1. Fix every critical and high finding before anything else; each fix gets a test
   that fails without it (check by removing the fix once).
2. Record the findings and fixes in `trust/docs/SECURITY.md`.
3. Have the independent auditor re-test the fixes. Until that is done, say so.
4. Residual risks go to the owner as decisions, not as footnotes.

$ARGUMENTS
