---
name: trust-release-gate
description: >-
  Prepare the gate report that ends a TRUST phase, so the owner can approve, approve with conditions, or send the work back. Use when a phase or a release is claimed to be finished. تقرير بوابة نهاية المرحلة.
---

# TRUST — phase gate

Nothing passes a gate on trust alone. Collect the evidence yourself.

## Collect

1. The phase's acceptance criteria (`trust/docs/ROADMAP.md`).
2. Fresh results of every check: use the `trust-check` skill. Do not reuse old output.
3. `trust-independent-auditor`'s verdict on the delivery against the criteria.
4. For anything touching data access, files, authentication or the AI pipeline: the
   result of the `trust-security-review` skill.
5. Open risks and what was deferred, with the reason.
6. Decisions only the owner can make (prices and limits, hosting and data region,
   what is sent to the AI provider, legal positions).

## A phase is not done while

- a critical or high finding is open, unless the owner has accepted it in writing;
- a criterion is "met" only by a test that uses fixture data;
- something described in the documentation is not built;
- a "to verify" legal or compliance assumption is being relied on in production.

## Report (one page)

| Criterion | Status | Evidence |
|---|---|---|

Then: checks run and their results, the auditor's verdict, open risks, what was
deferred, and **the decision requested**: approve, approve with conditions (list
them), or send back (say what is missing).

The owner decides. Do not merge, deploy or publish as part of preparing the gate.

$ARGUMENTS
