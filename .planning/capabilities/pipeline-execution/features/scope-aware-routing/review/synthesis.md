---
feature: pipeline-execution/scope-aware-routing
reviewer: review-synthesizer
date: 2026-03-04
source_reports:
  - review/enduser-trace.md
  - review/functional-trace.md
  - review/technical-trace.md
  - review/quality-trace.md
---

# Review Synthesis: Scope-Aware Pipeline Routing

## Spot-Check Results

| Reviewer | Citations Checked | Valid | Invalid | Notes |
|----------|------------------|-------|---------|-------|
| end-user | 5 | 5 | 0 | All line references confirmed in new.md and enhance.md |
| functional | 5 | 5 | 0 | new.md:93-110 loop, new.md:117 LENS=new, new.md:123-129 fan-out all confirmed |
| technical | 5 | 5 | 0 | core.cjs:408/417 type returns confirmed; feature.md:4 `status: planning` confirmed; feature.cjs:43 fillTemplate confirmed |
| quality | 5 | 5 | 0 | enhance.md:62-67 missing re-loop confirmed; new.md:77-80 Step 4 bypass confirmed; discuss-feature.md and framing-discovery.md confirmed as distinct workflows |

Citation reliability: all four reviewers are fully reliable. No findings demoted on citation grounds.

---

## Findings

### Finding 1: discuss-capability path bypasses Step 3 stub creation — orchestrator may encounter missing feature directories

- **Severity:** major
- **Requirement:** FN-02, TC-02
- **Source reviewer(s):** quality
- **Verdict:** not met (suspected regression — behavioral gap)

**Evidence (from reviewer):**

- `commands/gsd/new.md:77-80` — `If new capability: Invoke discuss-capability workflow / After discuss-capability completes, use the capability slug it created as CAPABILITY_SLUG / Proceed to Step 4 (fan-out offer)`
- `commands/gsd/new.md:119-121` — Step 4 note: "Step 2 no_match → new capability path after discuss-capability completes — present fan-out offer first"
- Reasoning: The no_match → new capability branch jumps from Step 2 directly to Step 4, skipping Step 3 entirely. Step 3 is the stub auto-creation loop that creates feature directories from CAPABILITY.md. `discuss-capability` populates CAPABILITY.md but does NOT create feature directories on disk. If the user selects "Continue" at the fan-out prompt, capability-orchestrator is invoked against a capability whose feature directories do not exist yet.

**Spot-check:** CONFIRMED

Reading `commands/gsd/new.md:77-80` confirms the direct jump to Step 4. Reading `commands/gsd/new.md:110` confirms Step 3 ends with "proceed to Step 4 — direct path, no fan-out offer," meaning Step 3 and the fan-out path are mutually exclusive by design. The Note at `new.md:119-121` acknowledges the skip but provides no mechanism to ensure feature directories exist before orchestrator invocation.

**Recommendation:** Before invoking capability-orchestrator from the fan-out "Continue" path, run Step 3 (stub auto-creation loop) using the CAPABILITY_SLUG from discuss-capability. The fan-out path should be: discuss-capability → Step 3 stub creation → Step 4 fan-out offer → orchestrator. The "direct path" from a pre-existing resolved capability slug can continue to skip the fan-out offer (that distinction is correct); the fan-out offer path must not skip stub creation.

---

### Finding 2: Ambiguous re-loop instruction missing in enhance/debug/refactor

- **Severity:** major
- **Requirement:** TC-01, FN-01
- **Source reviewer(s):** quality
- **Verdict:** not met (behavioral ambiguity — executor may fall through to Step 3 default instead of re-entering Step 2)

**Evidence (from reviewer):**

- `commands/gsd/enhance.md:62-67` — `If not resolved and reason is "ambiguous": ... Re-resolve with the selected candidate` (no return-to-step instruction)
- `commands/gsd/debug.md:62-67` — identical omission
- `commands/gsd/refactor.md:62-67` — identical omission
- `commands/gsd/new.md:65-70` — `Re-resolve with the selected candidate, return to top of Step 2` (explicit)
- Reasoning: After re-resolution in enhance/debug/refactor, an executor has no explicit instruction to re-enter Step 2's branching logic. The intended behavior (re-enter Step 2) is implied but not stated. An executor following the literal text could proceed to Step 3 without branching on the re-resolved type. This is intra-command drift from new.md, not inter-file drift among the three affected files (all three are identically wrong).

**Spot-check:** CONFIRMED

`commands/gsd/enhance.md:67` reads `- Re-resolve with the selected candidate` with no subsequent instruction. `commands/gsd/new.md:70` reads `- Re-resolve with the selected candidate, return to top of Step 2`. The delta is verbatim confirmed.

**Recommendation:** Add `return to top of Step 2` to the ambiguous branch in enhance.md:67, debug.md:67, and refactor.md:67, matching new.md's phrasing exactly.

---

### Finding 3: TC-02 status constraint depends on agent post-creation edit, not programmatic guarantee

- **Severity:** major
- **Requirement:** TC-02
- **Source reviewer(s):** technical
- **Verdict:** partial — the constraint is specified but not atomically enforced

**Evidence (from reviewer):**

- `commands/gsd/new.md:104` — `node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" feature-create "{CAPABILITY_SLUG}" "{feature_slug}"`
- `get-shit-done/templates/feature.md:4` — `status: planning`
- `get-shit-done/bin/lib/feature.cjs:43` — `const content = fillTemplate('feature', { name, slug, capability: capSlug, date: today });` — writes template verbatim, no status override
- `commands/gsd/new.md:106` — `After creation, open the created FEATURE.md ... and change status: planning to status: exploring in the YAML frontmatter.`
- Reasoning: `feature-create` always writes `status: planning` from the template. The `exploring` status requires a second agent-executed prose step. If the agent skips new.md:106, stubs have the wrong status. The spec presents status=exploring as an atomic creation constraint; the implementation splits it across two operations.

**Spot-check:** CONFIRMED

`get-shit-done/templates/feature.md:4` reads `status: planning`. `get-shit-done/bin/lib/feature.cjs:43` uses `fillTemplate` with no status field override. The CLI has no `--status` flag (confirmed by reading feature.cjs lines 38-52). The post-creation patch at `new.md:106` is the only mechanism for the `exploring` status.

**Recommendation:** Either (a) add a `--status` flag to the `feature-create` CLI so it writes `exploring` directly, or (b) accept the two-step model but document it explicitly in the plan and add a verification step after the loop (e.g., confirm status in the created file before proceeding). Option (a) is more reliable.

---

### Finding 4: "new feature" no_match branch routes to framing-discovery, not discuss-feature

- **Severity:** minor
- **Requirement:** EU-02
- **Source reviewer(s):** quality
- **Verdict:** not met (plan-to-code delta; functional impact depends on workflow equivalence)

**Evidence (from reviewer):**

- `commands/gsd/new.md:83-87` — `If new feature: ... Invoke framing-discovery.md with LENS=new and CAPABILITY_SLUG / Stop after framing-discovery completes`
- `FEATURE.md:52` (EU-02 AC) — `If new feature: ask which capability it belongs to, then route to discuss-feature`
- `get-shit-done/workflows/discuss-feature.md:1-7` — distinct workflow: "Guided exploration of HOW a specific feature works... thinking partner for feature-level clarity between planning and execution"
- `get-shit-done/workflows/framing-discovery.md:1-4` — "Run lens-specific discovery for a capability... shared across all four framing entry points"
- Reasoning: discuss-feature and framing-discovery are distinct workflows with different purposes. EU-02 specifies discuss-feature. The implementation uses framing-discovery. framing-discovery is lens-mode discovery (problem-space); discuss-feature is implementation-clarity discovery (requirements/planning). For LENS=new, the two are closest in intent but not identical.

**Spot-check:** CONFIRMED

Both workflow files exist as distinct files. `discuss-feature.md` opens with "Guided exploration of HOW a specific feature works" and feeds into requirements files. `framing-discovery.md` opens with "Run lens-specific discovery for a capability... shared across all four framing entry points." These are not the same workflow.

**Recommendation:** Determine whether the "new feature" path in /gsd:new should run discuss-feature (requirements session) or framing-discovery (lens discovery). If framing-discovery is intentionally chosen (consistent with how feature-level invocation works for all other resolved features), update EU-02 AC to say "framing-discovery" not "discuss-feature." If discuss-feature is the correct intent, update new.md:86. Either way, the delta needs to be resolved and documented as a decision.

---

### Finding 5: Step 3 Workflow Invocation block is structural redundancy in enhance/debug/refactor

- **Severity:** minor
- **Requirement:** quality (KISS)
- **Source reviewer(s):** quality
- **Verdict:** not met — pre-existing pattern inherited from execute.md; not a regression introduced by this feature

**Evidence (from reviewer):**

- `commands/gsd/enhance.md:74-87` — Step 3 restates both invocation targets (framing-discovery.md and capability-orchestrator.md) that are already specified with full context in Step 2 lines 54-60
- `commands/gsd/debug.md:74-87` — identical redundancy
- `commands/gsd/refactor.md:74-87` — identical redundancy
- Reasoning: Step 2 already specifies what to invoke in each branch. Step 3 is a second statement of the same fact. The pattern was inherited from execute.md and propagated intentionally per the plan's "mirror execute.md exactly" instruction.

**Spot-check:** CONFIRMED

`commands/gsd/enhance.md:54-60` contains the full routing decision including invocation targets. `commands/gsd/enhance.md:74-87` (Step 3) restates both invocation targets. The redundancy is structural: Step 3 adds no decision logic.

**Recommendation:** Low priority. The redundancy is inherited, not introduced. If the Step 3 pattern is intentional (serves as a human-readable summary of invocations for the executor), it can stay. If the goal is KISS, Step 3 can be removed from enhance/debug/refactor since Step 2 already contains full invocation instructions. No functional change either way.

---

## Conflicts

### Disagreements

**TC-02 status constraint severity — functional vs technical:**

- Functional reviewer (FN-02, PASS): Cites `new.md:106` as evidence the status patch is specified and passes.
- Technical reviewer (TC-02, PARTIAL): Notes that `feature-create` CLI always writes `status: planning` from the template and the patch depends on agent prose execution, not programmatic enforcement. Rates as partial.

Resolution: Technical reviewer is correct. The functional reviewer verified the instruction is present in the command prose but did not trace whether that instruction is atomically enforced. The status constraint (TC-02 item 4) is not guaranteed by the CLI — it requires a successful agent-executed edit step. The finding stands as major. Functional reviewer's PASS is too optimistic for this specific sub-criterion.

Tiebreaker applied: no — judgment is sufficient. Technical tracing of implementation depth (CLI vs prose instruction) is the deciding factor.

**Finding 3 (discuss-capability → Step 4 bypass) — functional vs quality:**

- Functional reviewer (FN-02, PASS): Does not flag the discuss-capability-to-Step-4 bypass as an issue.
- Quality reviewer (Finding 3, major): Flags the bypass as a potential runtime failure.

Resolution: Quality reviewer is correct. Functional reviewer traced the Step 3 stub creation loop (lines 93-110) and passed FN-02, but did not evaluate whether the discuss-capability path also triggers Step 3. The bypass at `new.md:80` ("Proceed to Step 4") is explicit and skips the stub creation that FN-02 depends on for the discuss-capability entrypoint. The finding stands as major.

Tiebreaker applied: no — the gap is verifiable from the text alone.

### Tensions

**FN-03 fan-out offer path vs Step 3 stub creation (Finding 1):**

- Functional reviewer considers FN-03 met: the fan-out offer is correctly implemented.
- Quality reviewer identifies that the fan-out path also skips stub creation.

Assessment: These observations are not contradictory — the fan-out AskUserQuestion is correctly implemented, and separately, the path it sits on skips stub creation. Both can be true simultaneously. The fix (insert stub creation before the fan-out offer) preserves the fan-out UX while closing the stub gap. FN-03's fan-out behavior is correct; the execution order upstream of it is not.

**framing-discovery vs discuss-feature for "new feature" path (Finding 4):**

- End-user reviewer (EU-02, met): Accepts framing-discovery as fulfilling the "route to discuss-feature" criterion without noting the workflow distinction.
- Quality reviewer (Finding 6, minor): Flags the delta as a requirements fidelity gap.

Assessment: End-user reviewer did not compare the two workflows; quality reviewer did. Priority ordering: end-user > quality. However, the end-user reviewer's EU-02 verdict was based on reading the prose flow, not on verifying that framing-discovery and discuss-feature are the same workflow. Because the AC explicitly says "discuss-feature" and these are confirmed distinct workflows, the finding is valid at minor severity. The EU-02 verdict is amended from "met" to "partially met" — the routing flow is correct in shape; the target workflow is incorrect per the literal AC. This is a minor gap, not a blocker, because framing-discovery covers the new-feature use case adequately for the current state of the system.

---

## Summary

| Severity | Count |
|----------|-------|
| Blocker  | 0     |
| Major    | 3     |
| Minor    | 2     |

| Req ID | Verdict | Severity | Source Reviewer |
|--------|---------|----------|----------------|
| EU-01  | met | — | end-user, functional, technical |
| EU-02  | partially met | minor | end-user (amended), quality |
| FN-01  | met | — | functional |
| FN-02  | partially met (discuss-capability path gap) | major | quality (functional reviewer missed this path) |
| FN-03  | met (fan-out UX) / not met (stub prerequisite) | major | quality |
| FN-04  | met | — | functional, technical |
| TC-01  | met | — | technical, functional |
| TC-02  | partial | major | technical |

### Priority Fix List

1. **[major — Finding 1]** `commands/gsd/new.md` — Insert Step 3 stub auto-creation between discuss-capability completion and the Step 4 fan-out offer. The discuss-capability path must run the stub creation loop before offering orchestrator fan-out.

2. **[major — Finding 2]** `commands/gsd/enhance.md:67`, `commands/gsd/debug.md:67`, `commands/gsd/refactor.md:67` — Add `return to top of Step 2` to the ambiguous branch after re-resolve instruction.

3. **[major — Finding 3]** `get-shit-done/bin/lib/feature.cjs` or `get-shit-done/bin/gsd-tools.cjs` — Add `--status` flag to `feature-create` CLI so it can write `status: exploring` directly, removing the agent prose dependency for the status patch.

4. **[minor — Finding 4]** Decision needed: confirm whether `new.md:86` should invoke `framing-discovery.md` or `discuss-feature.md` for the "new feature" no_match path, then update either the code or EU-02 AC to match.

5. **[minor — Finding 5]** Optional: remove Step 3 redundancy from enhance/debug/refactor if KISS is a priority. No functional impact.
