# Doc Report: pipeline-execution/scope-aware-routing

**Generated:** 2026-03-04
**Git SHA:** d5d9aa7f56a13f708001ec6ed87ed264694cb5ac
**Framing context:** new

---

## Generated Files

| Path | Type |
|------|------|
| `.documentation/modules/pipeline-execution-scope-aware-routing.md` | module-doc |
| `.documentation/flows/pipeline-execution/scope-aware-routing.md` | flow-doc |

---

## 3-Pass Validation Results

### Pass 1 — Structural Compliance

| Check | Result |
|-------|--------|
| Module doc has all required headings (Module, Purpose, Exports, Depends-on, Constraints, WHY) | PASS |
| Flow doc has all required headings (Flow, Trigger, Input, Steps, Output, Side-effects, WHY) | PASS |
| Every section has ownership tag ([derived] or [authored]) | PASS |
| Heading anchors match canonical format (case-sensitive) | PASS |
| `last-verified` timestamp present in both docs | PASS |
| `built-from-code-at` SHA present in both docs | PASS |
| Frontmatter `type` fields correct (module-doc, flow-doc) | PASS |

### Pass 2 — Referential Integrity

| Check | Result | Notes |
|-------|--------|-------|
| `commands/gsd/new.md` exists | PASS | Verified |
| `commands/gsd/enhance.md` exists | PASS | Verified |
| `commands/gsd/debug.md` exists | PASS | Verified |
| `commands/gsd/refactor.md` exists | PASS | Verified |
| `get-shit-done/workflows/capability-orchestrator.md` exists | PASS | Verified |
| `get-shit-done/workflows/framing-discovery.md` exists | PASS | Verified |
| `get-shit-done/workflows/discuss-capability.md` exists | PASS | Verified |
| `get-shit-done/bin/gsd-tools.cjs` exists | PASS | Verified |
| `get-shit-done/bin/lib/feature.cjs` exists | PASS | Verified |
| `get-shit-done/templates/feature.md` exists | PASS | Verified |
| `get-shit-done/references/framing-lenses.md` — referenced in Depends-on | PASS | Confirmed in all 4 command execution_context blocks |
| `get-shit-done/references/ui-brand.md` — referenced in Depends-on | PASS | Confirmed in all 4 command execution_context blocks |
| Flow Steps module references resolve to docs in `.documentation/modules/` | PASS — with note | `scope-aware-routing` → `.documentation/modules/pipeline-execution-scope-aware-routing.md`; `framing-discovery` → covered by `framing-pipeline-workflow.md` (framing-discovery is the entry point to that pipeline); `capability-orchestrator` has no standalone module doc but is an existing workflow |
| All export behaviors listed in module doc trace to actual `process` blocks in command files | PASS | Verified step-by-step against new.md, enhance.md, debug.md, refactor.md |
| slug-resolve JSON fields listed (`resolved`, `tier`, `type`, `capability_slug`, `feature_slug`, `full_path`, `candidates`, `reason`) match actual parse instructions in all 4 commands | PASS | Verified verbatim in each command's Step 1 |

### Pass 3 — Gate Doc Consistency

**Glossary check (5 terms):**

| Term | Used Correctly |
|------|---------------|
| module | PASS — module doc uses "workflow prompt files" not raw "module" for the command files, which is accurate |
| flow | PASS — flow doc describes an end-to-end data path triggered by user action |
| gate doc | N/A — not referenced in generated docs |
| derived | PASS — all regenerated sections tagged [derived] |
| authored | PASS — all judgment sections tagged [authored] |

**Constraints check (7 constraints):**

| Constraint | Check |
|------------|-------|
| no-implicit-state | PASS — all state (stub creation, status patch) documented in Side-effects |
| no-unnecessary-deps | PASS — no deps mentioned that aren't used |
| no-silent-failures | PASS — all error paths documented (empty table error, no_match error, ambiguous re-loop) |
| no-hardcoded-config | PASS — no config values embedded in docs |
| no-premature-abstraction | PASS — WHY block documents the inline-per-command decision explicitly |
| single-responsibility | PASS — module doc describes routing only, stub creation is a sub-step of the capability path |
| explicit-boundaries | PASS — Exports section documents inputs for each command, Depends-on lists all downstream targets |

**State.md check:** State.md contains only a schema template (no entries). Checked: no doc references to state entries that don't exist. PASS.

**Coverage statement:** Checked 5 glossary terms, 7 constraints, 0 state entries (none defined in state.md).

---

## Impact Flags

Grep of existing flow docs and module docs for references to the 4 modified commands:

- `.documentation/modules/framing-pipeline-workflow.md` — references `framing-discovery.md` and the 6-stage pipeline. Does NOT directly reference the lens commands. No rewrite needed.
- `.documentation/flows/pipeline-execution/research-overhaul.md` — references `framing-pipeline-workflow` and `plan-workflow`. Does NOT reference lens commands. No rewrite needed.

**No existing docs reference `/gsd:new`, `/gsd:enhance`, `/gsd:debug`, or `/gsd:refactor` by name.** No impact flags raised.

---

## Notes

- `capability-orchestrator.md` is referenced as a dependency but has no standalone module doc in `.documentation/modules/`. This is a pre-existing gap, not introduced by this feature. Flagged for awareness; no action required from this doc run.
- Flow Steps reference `framing-discovery` by workflow name. The closest module doc is `framing-pipeline-workflow.md` (which covers the full pipeline that framing-discovery triggers). The reference is structurally sound but the terminology gap (framing-discovery vs framing-pipeline) is pre-existing.
- Finding 4 from review (framing-discovery vs discuss-feature for "new feature" no_match path) was dismissed: the WHY block in the module doc documents the decision that framing-discovery subsumes discuss-feature as its first step.
