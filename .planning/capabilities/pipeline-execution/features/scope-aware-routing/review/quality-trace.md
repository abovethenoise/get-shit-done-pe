---
feature: pipeline-execution/scope-aware-routing
reviewer: quality-judge
date: 2026-03-04
---

# Quality Trace: Scope-Aware Pipeline Routing

## Phase 1: Quality Standards

Evaluating 5 markdown prompt files (lens commands) for:

- **DRY consistency:** The explicit decision was "no shared routing layer; each command handles it inline." Copies are allowed, but the copies must be consistent — drift is not justified by the decision.
- **KISS:** Is each routing pattern the minimum needed to satisfy requirements? Any steps that serve no requirement?
- **Bloat:** Anything added beyond what the feature spec required?
- **Regression risk:** Was existing feature-level framing-discovery behavior preserved without alteration?
- **Reference fidelity:** Do enhance/debug/refactor match execute.md's shape where they should?

---

## Phase 2: Findings

### Finding 1: Step 3 (Workflow Invocation) is structural redundancy in enhance/debug/refactor

**Category:** KISS / Bloat

**Severity:** minor

**Evidence:**
- `commands/gsd/enhance.md:54-87` — Step 2 already contains the full routing decision with explicit invocation targets. Step 3 then re-states both invocations:
  ```
  ## 3. Workflow Invocation

  For **feature-level:**
  ```
  @{GSD_ROOT}/get-shit-done/workflows/framing-discovery.md
  ```
  Pass: LENS=enhance, CAPABILITY_SLUG (from resolution)

  For **capability-level:**
  ```
  @{GSD_ROOT}/get-shit-done/workflows/capability-orchestrator.md
  ```
  Pass: CAPABILITY_SLUG, LENS=enhance
  ```
- Same pattern verbatim in `commands/gsd/debug.md:74-87` and `commands/gsd/refactor.md:74-87`.
- **Reasoning:** Step 2 already specifies what to invoke in each branch (lines 54-60 in enhance). Step 3 is a second statement of the same fact. An executor reading these files encounters the routing decision twice. The reference implementation, `commands/gsd/execute.md`, also has this Step 3 pattern, so this was intentionally preserved — but it remains structurally redundant. The complexity is low so this is minor, but the step carries no decision-making logic; it is a pure restatement.
- **Context:** execute.md has the same Step 3 pattern. The plan (01-PLAN.md) explicitly instructed "mirror execute.md exactly." The redundancy was inherited from the reference and propagated by design. Not a regression — a pre-existing pattern.

---

### Finding 2: Ambiguous branch does not specify re-loop behavior in enhance/debug/refactor

**Category:** KISS / Functional Integrity

**Severity:** major

**Evidence:**
- `commands/gsd/enhance.md:62-67`:
  ```
  **If not resolved and reason is "ambiguous":**
  - Use AskUserQuestion:
    - header: "Multiple Matches"
    - question: "Multiple matches found for '$ARGUMENTS'. Which did you mean?"
    - options: list each candidate with type and full_path
  - Re-resolve with the selected candidate
  ```
- `commands/gsd/new.md:65-70` (same branch):
  ```
  - Re-resolve with the selected candidate, return to top of Step 2
  ```
- **Reasoning:** enhance/debug/refactor say "Re-resolve with the selected candidate" but do not say "return to top of Step 2." new.md is explicit: "return to top of Step 2." The missing return-to-step instruction creates ambiguity for the executor: after re-resolution, does it fall through to Step 3, or does it re-enter Step 2 branching? The intended behavior (re-enter Step 2) is implied but not stated. An executor could interpret "re-resolve" as a terminal action and proceed to Step 3's default path, which would be incorrect.
- **Context:** This is drift between new.md (which explicitly loops back) and enhance/debug/refactor (which do not). The pattern is semantically identical across all three affected files: debug.md line 62-67 and refactor.md lines 62-67 are character-for-character identical to enhance.md, so this is consistent internal drift from the reference, not inter-file drift among the three.

---

### Finding 3: new.md step 3 stub creation skips stub creation on discuss-capability path

**Category:** Functional Integrity

**Severity:** major

**Evidence:**
- `commands/gsd/new.md:119-133`:
  ```
  **Note:** Step 4 is reached either from:
  - Step 2 "resolved as capability" path (after Step 3 stub creation) — invoke orchestrator directly, no fan-out offer
  - Step 2 "no_match → new capability" path after discuss-capability completes — present fan-out offer first
  ```
- `commands/gsd/new.md:76-87` (the no_match → new capability branch):
  ```
  - **If new capability:**
    - Invoke discuss-capability workflow
    - After discuss-capability completes, use the capability slug it created as CAPABILITY_SLUG
    - Proceed to Step 4 (fan-out offer)
  ```
- **Reasoning:** The no_match → new capability path jumps from Step 2 directly to Step 4, bypassing Step 3 entirely. Step 3 is the stub auto-creation loop. The Note in Step 4 acknowledges this skip with "since discuss-capability just populated CAPABILITY.md" — but the file does not contain that justification in Step 4 as written. What the file actually says is just "present fan-out offer first" with no explanation of why Step 3 is skipped.
- The logical basis for the skip: discuss-capability creates the CAPABILITY.md table, but it does NOT create feature directories on disk — feature stub creation is exactly what Step 3 does. If capability-orchestrator is invoked immediately after discuss-capability (via the fan-out path), it will encounter missing feature directories. This is a potential behavioral gap, not just a documentation gap.
- **Context:** TC-02 requirement states: "Bootstrap feature directories from CAPABILITY.md features table when features don't exist on disk." The plan (02-PLAN.md Step 4 note) originally said "skip Step 3" for the discuss-capability path but the reasoning given was that discuss-capability "just populated CAPABILITY.md" — that does not mean the feature directories exist. The skip may introduce a runtime failure for the orchestrator if it tries to read feature directories that don't exist yet.

---

### Finding 4: enhance/debug/refactor objective blocks updated inconsistently vs execute.md

**Category:** DRY / Consistency

**Severity:** minor

**Evidence:**
- `commands/gsd/execute.md:16-22` — objective block contains no MVU section; it is a pure routing description.
- `commands/gsd/enhance.md:13-26` — objective block retains MVU section ("**MVU (Minimum Viable Understanding):**...").
- `commands/gsd/debug.md:13-26` — same, MVU retained.
- `commands/gsd/refactor.md:13-26` — same, MVU retained.
- **Reasoning:** This is not a regression — the MVU sections existed before the routing changes and belong to these commands by design (they describe what the framing-discovery workflow captures). The objective blocks are correctly distinct from execute.md, which has no discovery phase. This is not a finding against the routing work; it is noted here to confirm the difference is intentional and appropriate.
- **Verdict:** met. Difference is earned.

---

### Finding 5: enhance/debug/refactor are perfectly consistent with each other

**Category:** DRY

**Severity:** info

**Evidence:**
- `commands/gsd/enhance.md`, `commands/gsd/debug.md`, `commands/gsd/refactor.md` — all three files are structurally identical. The only variation is the LENS value (enhance, debug, refactor) which appears in:
  - `<context>` block: `**Lens:** {lens}`
  - Step 2 feature branch: `LENS={lens}`
  - Step 3 feature invocation: `Pass: LENS={lens}`
  - Step 3 capability invocation: `Pass: CAPABILITY_SLUG, LENS={lens}`
- **Reasoning:** The explicit decision ("no shared routing layer; each command handles it inline") was followed faithfully. The copies are consistent. No drift between the three files beyond the required LENS substitution. The decision is documented in FEATURE.md Decisions section and holds.
- **Verdict:** met.

---

### Finding 6: new.md `<execution_context>` includes discuss-capability.md but framing-discovery path for "new feature" no_match branch routes to framing-discovery, not discuss-feature

**Category:** Functional Integrity / Bloat

**Severity:** minor

**Evidence:**
- `commands/gsd/new.md:31`: `@{GSD_ROOT}/get-shit-done/workflows/discuss-capability.md`
- `commands/gsd/new.md:83-87`:
  ```
  - **If new feature:**
    - Use AskUserQuestion:
      - header: "Which Capability?"
      - question: "Which capability does this feature belong to? Enter the capability slug."
    - Run slug-resolve on the user's input; if not resolved as a capability, ask again
    - Invoke framing-discovery.md with LENS=new and CAPABILITY_SLUG
    - Stop after framing-discovery completes
  ```
- `commands/gsd/new.md:29`: `@{GSD_ROOT}/get-shit-done/workflows/framing-discovery.md` (present)
- **Reasoning:** The `<execution_context>` does not include `discuss-feature.md` — which is correct, because the "new feature" no_match branch invokes framing-discovery directly, not discuss-feature. The 02-PLAN.md success_criteria at line 153 states "routes correctly to discuss-capability or discuss-feature" — but the implementation routes to framing-discovery, not a separate discuss-feature workflow. This is a plan-to-implementation delta. If framing-discovery and discuss-feature are the same workflow or framing-discovery subsumes discuss-feature's role, this is fine. But if they are distinct, the "new feature" path is not invoking the right workflow.
- **Context:** The FEATURE.md EU-02 acceptance criteria says "if new feature: ask which capability it belongs to, then route to discuss-feature." The implemented behavior routes to framing-discovery instead. This is a requirements fidelity gap. Severity is minor only because framing-discovery likely covers the same ground for new features — but an executor cannot confirm this from the command file alone.

---

## Summary Table

| Finding | Severity | Category | File(s) | Verdict |
|---------|----------|----------|---------|---------|
| 1: Step 3 restates Step 2 routing | minor | KISS/Bloat | enhance, debug, refactor | not met |
| 2: Ambiguous branch missing re-loop instruction | major | Functional Integrity | enhance, debug, refactor | not met |
| 3: discuss-capability path skips stub creation | major | Functional Integrity | new.md | not met (suspected regression) |
| 4: Objective blocks differ from execute.md | info | Consistency | enhance, debug, refactor | met (intentional) |
| 5: Three files mutually consistent | info | DRY | enhance, debug, refactor | met |
| 6: "new feature" no_match routes to framing-discovery not discuss-feature | minor | Functional Integrity | new.md | not met (plan delta) |

## Blocker / Regression Summary

No blockers. Two majors that require disposition:

- **Finding 2** (major): The ambiguous re-loop omission is a behavioral ambiguity. An executor following the literal text of enhance/debug/refactor could proceed incorrectly after re-resolution. Fix is a one-line addition ("return to top of Step 2") in each of the three files.

- **Finding 3** (major, suspected regression): The discuss-capability → Step 4 path bypasses Step 3 stub creation. If capability-orchestrator requires feature directories to exist (which is the premise of TC-02), this path will fail at runtime. Needs explicit verification that discuss-capability itself creates stub directories, or the no_match capability path must be routed through Step 3.
