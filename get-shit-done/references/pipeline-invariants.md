# Pipeline Invariants

10 behaviors that define correct GSD pipeline operation. Violating any invariant produces incorrect, incomplete, or unrecoverable pipeline output.

---

## 1. Fresh Context Per Executor

**What:** Each plan executor runs in its own Task with a full 200k context window. The orchestrator stays lean (~10-15% context).

**Why:** Executors need full context to implement complex tasks. If the orchestrator passes content instead of paths, it exhausts its own context window and degrades quality for subsequent plans.

**Where:**
- `get-shit-done/workflows/execute-phase.md` -- `execute_waves` step spawns Task per plan
- `get-shit-done/workflows/framing-pipeline.md` -- stage 4 spawns executor

**Verify:** Check that execute-phase.md uses `Task()` with `<files_to_read>` paths, not inline content.

---

## 2. Wave Dependency Analysis

**What:** Plans are grouped by `wave` (from plan frontmatter `depends_on`). Wave 1 runs first, wave 2 only after wave 1 completes. Within a wave, plans run in parallel.

**Why:** Executing dependent plans before their prerequisites produces broken code, missing imports, or incomplete state.

**Where:**
- `get-shit-done/workflows/execute-phase.md` -- `discover_and_group_plans` step
- `get-shit-done/bin/gsd-tools.cjs` -- `phase-plan-index` CLI command reads plan frontmatter

**Verify:** `node gsd-tools.cjs phase-plan-index {phase}` returns plans grouped by wave with correct dependency chains.

---

## 3. Plan-Checker Verification Loop

**What:** Draft plans go through: planner creates -> checker verifies -> Q&A loop if issues -> planner revises -> checker re-verifies. Max 3 revision rounds.

**Why:** Plans are prompts for executors. A bad plan produces bad execution. Catching issues before execution saves context budget and prevents rework.

**Where:**
- `get-shit-done/workflows/plan-phase.md` -- steps 10-12 (spawn checker, handle verdict, revision loop)

**Verify:** plan-phase.md contains checker spawn, verdict parsing, and revision loop with iteration limit.

---

## 4. Atomic Commits Per Task

**What:** Each task in a plan produces exactly one git commit. Commit format: `{type}({scope}): {description}`.

**Why:** Atomic commits enable: git bisect for debugging, clear audit trail, per-task revert capability, SUMMARY.md commit hash tracking.

**Where:**
- `get-shit-done/workflows/execute-plan.md` -- `task_commit_protocol` section
- `agents/gsd-executor.md` -- `task_commit_protocol` section

**Verify:** After execution, `git log --oneline` shows one commit per task with correct format.

---

## 5. Context Loading Via Paths Not Content

**What:** Orchestrators pass file paths to subagents. Agents read files themselves in their own context window. No content is passed between agents.

**Why:** Passing content bloats the orchestrator context. File paths are ~50 bytes; file content can be 10-50KB. The orchestrator would run out of context after 2-3 plans.

**Where:**
- All workflow `.md` files use `<files_to_read>` blocks with paths
- `get-shit-done/workflows/execute-phase.md` -- Task prompts contain paths only

**Verify:** Search workflow files for `<files_to_read>` blocks; confirm they contain paths (starting with `.planning/` or `get-shit-done/`), not inline markdown content.

---

## 6. State Progression Via CLI

**What:** STATE.md updates are performed exclusively through `gsd-tools.cjs state` commands. No direct STATE.md file writes by agents.

**Why:** Direct writes can corrupt frontmatter sync, break field patterns, or lose concurrent updates. The CLI ensures: frontmatter stays in sync, field names are consistent, timestamp updates happen automatically.

**Where:**
- `get-shit-done/bin/gsd-tools.cjs` -- `state advance-plan`, `state update-progress`, `state record-metric`, `state add-decision`, `state add-blocker`, `state record-session`
- `get-shit-done/bin/lib/state.cjs` -- all `cmdState*` functions

**Verify:** `node gsd-tools.cjs state json` returns valid JSON with all STATE.md fields.

---

## 7. Session Handoff

**What:** STATE.md `Session Continuity` section + SUMMARY.md frontmatter provide complete context for recovering from `/clear` or session interruption.

**Why:** Claude Code sessions have limited lifetime. When a session ends mid-execution, the next session needs: current position, completed work, decisions, blockers, and what to do next. Without handoff, work gets repeated or lost.

**Where:**
- `get-shit-done/workflows/transition.md` -- updates session fields
- `get-shit-done/templates/state.md` -- `Session Continuity` section template
- SUMMARY.md frontmatter -- `key-decisions`, `requirements-completed`, `key-files`

**Verify:** STATE.md `Stopped at` field is current. SUMMARY.md exists for completed plans. `state record-session` writes correct values.

---

## 8. Requirement ID Chain

**What:** Every task traces to at least one requirement ID. Plans declare `requirements: [REQ-01, ...]` in frontmatter. Tasks include `<reqs>` tags. Execution marks requirements complete.

**Why:** Untraceable work means: no way to verify coverage, no way to detect gaps, no audit trail from requirement to implementation.

**Where:**
- `get-shit-done/workflows/plan-phase.md` -- step 9.7 (`plan-validate` CLI)
- `get-shit-done/workflows/execute-plan.md` -- `update_requirements` step
- `get-shit-done/bin/gsd-tools.cjs` -- `plan-validate`, `requirements mark-complete`

**Verify:** `node gsd-tools.cjs plan-validate REQUIREMENTS.md {plan-file}` returns coverage analysis. REQUIREMENTS.md checkboxes match completed plans.

---

## 9. Summary Frontmatter

**What:** Every completed plan produces a SUMMARY.md with structured YAML frontmatter: `requires`, `provides`, `affects`, `key-files`, `key-decisions`, `requirements-completed`, `duration`.

**Why:** SUMMARY.md frontmatter is the machine-readable record of what happened. It feeds: progress tracking, dependency analysis, session handoff, verification, and the history digest.

**Where:**
- `get-shit-done/workflows/execute-plan.md` -- `create_summary` step
- `get-shit-done/templates/summary.md` -- template structure

**Verify:** `node gsd-tools.cjs summary-extract {path}` returns valid structured data. Frontmatter contains all required fields.

---

## 10. Spot-Check on Executor Output

**What:** After an executor reports completion, verify claims before accepting: check files exist, check git commits exist, check Self-Check marker in SUMMARY.md.

**Why:** Executors can hallucinate completion. A "PASS" with missing files or phantom commits wastes the entire downstream pipeline.

**Where:**
- `get-shit-done/workflows/execute-phase.md` -- `execute_waves` step 4 (post-execution verification)
- `agents/gsd-executor.md` -- `self_check` section

**Verify:** SUMMARY.md contains `## Self-Check: PASSED`. Files listed in `key-files` exist on disk. Commit hashes in task table appear in `git log`.

---

## Quick Reference

| # | Invariant | Impact if Violated | v2 Impact |
|---|-----------|-------------------|-----------|
| 1 | Fresh context per executor | Quality degradation, context exhaustion | None |
| 2 | Wave dependency analysis | Broken builds, missing prerequisites | Low (path update) |
| 3 | Plan-checker verification loop | Bad plans waste execution context | None |
| 4 | Atomic commits per task | Lost audit trail, can't bisect/revert | None |
| 5 | Context via paths not content | Orchestrator context exhaustion | None |
| 6 | State progression via CLI | Corrupted STATE.md, lost sync | Medium (v2 fields) |
| 7 | Session handoff | Lost work on /clear | Medium (v2 fields) |
| 8 | Requirement ID chain | No coverage verification | Low (namespace) |
| 9 | Summary frontmatter | Broken progress tracking | Low (field rename) |
| 10 | Spot-check executor output | Phantom completions propagate | None |
