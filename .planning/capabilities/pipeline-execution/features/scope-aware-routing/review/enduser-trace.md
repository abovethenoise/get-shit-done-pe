---
feature: pipeline-execution/scope-aware-routing
reviewer: end-user trace
date: 2026-03-04
---

# End-User Trace Report: scope-aware-routing

## Phase 1: Requirements Internalized

### EU-01: Lens commands work at capability level

"Met" requires ALL of the following to be true in code:

1. `/gsd:new {cap}`, `/gsd:enhance {cap}`, `/gsd:debug {cap}`, `/gsd:refactor {cap}` each accept a capability slug as input
2. Capability-level invocation routes to capability-orchestrator (fans out to features)
3. Feature-level invocation continues to call framing-discovery (no regression)
4. Ambiguous slugs prompt user via AskUserQuestion with candidates listed

### EU-02: /gsd:new asks capability vs feature for unknown slugs

"Met" requires ALL of the following to be true in code (new.md only):

1. no_match slug triggers AskUserQuestion "New capability or new feature under existing capability?"
2. "New capability" choice routes to discuss-capability flow
3. "New feature" choice asks which capability, then routes to discuss-feature (framing-discovery)
4. After discuss-capability completes, user is offered AskUserQuestion: "Continue to pipeline for all features?" or "I'll run them individually"

---

## Phase 2: Trace Against Code

### EU-01: Lens commands work at capability level

**Verdict:** met (proven)

**Evidence:**

#### Criterion 1: All four commands accept capability slugs

- `/commands/gsd/new.md:47-50` — `RESOLVED=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" slug-resolve "$ARGUMENTS")` — slug-resolve is invoked for any $ARGUMENTS; the JSON parse explicitly handles `type: "capability"` at line 56.
- `/commands/gsd/enhance.md:47-50` — identical slug-resolve call; capability branch at line 58-60.
- `/commands/gsd/debug.md:47-50` — identical slug-resolve call; capability branch at line 58-60.
- `/commands/gsd/refactor.md:47-50` — identical slug-resolve call; capability branch at line 58-60.
- Reasoning: all four commands call `slug-resolve $ARGUMENTS` and parse `type`, so a capability slug is accepted by each.

#### Criterion 2: Capability-level invocation routes to capability-orchestrator

- `/commands/gsd/enhance.md:58-60` — `**If resolved and type is "capability":** Invoke capability-orchestrator.md with CAPABILITY_SLUG and LENS=enhance / The orchestrator will fan out to all features in DAG wave order`
- `/commands/gsd/enhance.md:83-87` (Step 3) — `@{GSD_ROOT}/get-shit-done/workflows/capability-orchestrator.md / Pass: CAPABILITY_SLUG, LENS=enhance`
- `/commands/gsd/debug.md:58-60` and lines 83-87 — same pattern, LENS=debug.
- `/commands/gsd/refactor.md:58-60` and lines 83-87 — same pattern, LENS=refactor.
- `/commands/gsd/new.md:56-58` — capability path proceeds to Step 3 (stub creation) then Step 4 orchestrator invocation at lines 112-132.
- Reasoning: all four commands explicitly invoke capability-orchestrator with the correct LENS when slug resolves as capability type.

#### Criterion 3: Feature-level invocation continues to work (no regression)

- `/commands/gsd/enhance.md:54-57` — `**If resolved and type is "feature":** Invoke framing-discovery.md with LENS=enhance and CAPABILITY_SLUG (derived from feature path) / Preserve all workflow gates (fuzzy resolution confirmation, capability status check, MVU tracking, misclassification detection, mandatory summary playback)`
- `/commands/gsd/enhance.md:77-81` (Step 3) — `@{GSD_ROOT}/get-shit-done/workflows/framing-discovery.md / Pass: LENS=enhance, CAPABILITY_SLUG (from resolution)`
- `/commands/gsd/debug.md:54-57` and lines 77-81 — identical pattern, LENS=debug.
- `/commands/gsd/refactor.md:54-57` and lines 77-81 — identical pattern, LENS=refactor.
- `/commands/gsd/new.md:61-64` — `**If resolved and type is "feature":** Invoke framing-discovery.md with LENS=new and CAPABILITY_SLUG (derived from feature path) / Preserve all workflow gates ... / Stop after framing-discovery completes`
- Reasoning: each command's feature branch explicitly delegates to framing-discovery with workflow gates preserved. The phrase "Preserve all workflow gates" appears in all four commands and is identical to the original framing-discovery delegation contract.

#### Criterion 4: Ambiguous slugs prompt user

- `/commands/gsd/enhance.md:62-68` — `**If not resolved and reason is "ambiguous":** Use AskUserQuestion: header: "Multiple Matches" / question: "Multiple matches found for '$ARGUMENTS'. Which did you mean?" / options: list each candidate with type and full_path`
- `/commands/gsd/debug.md:62-68` — identical AskUserQuestion block.
- `/commands/gsd/refactor.md:62-68` — identical AskUserQuestion block.
- `/commands/gsd/new.md:65-70` — `**If not resolved and reason is "ambiguous":** Use AskUserQuestion: header: "Multiple Matches" / question: "Multiple matches found for '$ARGUMENTS'. Which did you mean?" / options: list each candidate with type and full_path / Re-resolve with the selected candidate, return to top of Step 2`
- Reasoning: all four commands present AskUserQuestion with candidates for ambiguous resolution. The AC wording says "prompt user" — this is satisfied by the AskUserQuestion directive.

**Cross-layer observations:** The AC wording is "Is this a new capability or a new feature?" for ambiguous slugs, but all four commands instead ask "Which did you mean?" with a candidate list. This is a different framing (selection from candidates vs. capability/feature classification), but is the correct behavior for ambiguous slug resolution — the AC text appears to conflate the ambiguous case with the no_match case. Flagged as secondary; not changing the verdict because the implemented behavior (present candidate list, let user select) is more precise than the AC wording suggests.

---

### EU-02: /gsd:new asks capability vs feature for unknown slugs

**Verdict:** met (proven)

**Evidence:**

#### Criterion 1: no_match triggers "New capability or new feature under existing capability?" prompt

- `/commands/gsd/new.md:72-76` — `**If not resolved and reason is "no_match" (or no $ARGUMENTS):** Use AskUserQuestion: header: "New Work" / question: "What kind of new work is this?" / options: "New capability", "New feature under an existing capability"`
- Reasoning: no_match triggers AskUserQuestion with options that map to the two paths in the AC. The AC wording "New capability or new feature under existing capability?" is present via the two discrete options.

#### Criterion 2: "New capability" routes to discuss-capability flow

- `/commands/gsd/new.md:77-80` — `**If new capability:** Invoke discuss-capability workflow / After discuss-capability completes, use the capability slug it created as CAPABILITY_SLUG / Proceed to Step 4 (fan-out offer)`
- `/commands/gsd/new.md:28-33` (execution_context) — `@{GSD_ROOT}/get-shit-done/workflows/discuss-capability.md` is loaded as context.
- Reasoning: new capability choice explicitly invokes discuss-capability workflow and discuss-capability.md is in execution_context. Criterion met.

#### Criterion 3: "New feature" asks which capability then routes to discuss-feature (framing-discovery)

- `/commands/gsd/new.md:81-87` — `**If new feature:** Use AskUserQuestion: header: "Which Capability?" / question: "Which capability does this feature belong to? Enter the capability slug." / Run slug-resolve on the user's input; if not resolved as a capability, ask again / Invoke framing-discovery.md with LENS=new and CAPABILITY_SLUG / Stop after framing-discovery completes`
- Reasoning: new feature choice asks which capability (AskUserQuestion), validates the input via slug-resolve, then routes to framing-discovery which is the discuss-feature flow. Criterion met.

#### Criterion 4: After discuss-capability completes, offer fan-out or individual

- `/commands/gsd/new.md:119-129` — `**Fan-out offer (only when arriving from discuss-capability path):** Before invoking orchestrator, use AskUserQuestion: header: "Pipeline Ready" / question: "Capability and features defined. Continue to pipeline for all features now?" / options: "Continue (run pipeline for all features)", "I'll run them individually" / If "I'll run them individually": display next steps ("Run /gsd:new {feature_slug} for each feature") and stop / If "Continue": invoke capability-orchestrator`
- Reasoning: the fan-out offer is presented via AskUserQuestion after discuss-capability completes, with both options the AC requires ("Continue to pipeline for all features?" maps to "Continue (run pipeline for all features)"; "I'll run them individually" maps directly).

---

## Summary

| Req ID | Verdict | Key Evidence |
|--------|---------|--------------|
| EU-01  | met     | enhance.md:58-60, debug.md:58-60, refactor.md:58-60, new.md:56-58 — all four commands branch on capability type to capability-orchestrator; feature branch preserved at enhance/debug/refactor/new.md:54-57 and new.md:61-64; ambiguous AskUserQuestion at all four commands lines 62-68 |
| EU-02  | met     | new.md:72-76 — no_match AskUserQuestion "New Work"; new.md:77-80 — capability routes to discuss-capability; new.md:81-87 — feature asks which capability then routes to framing-discovery; new.md:119-129 — fan-out offer after discuss-capability |
