# Pipeline Invariants

10 behaviors that define correct GSD pipeline operation. Violating any invariant produces incorrect, incomplete, or unrecoverable pipeline output.

---

## 1. Fresh Context Per Executor

**What:** Each plan executor runs in its own Task with a full 200k context window. The orchestrator stays lean (~10-15% context).

**Why:** Executors need full context to implement complex tasks. If the orchestrator passes content instead of paths, it exhausts its own context window and degrades quality for subsequent plans.

**Verify:** Check that execute.md uses `Task()` with `<files_to_read>` paths, not inline content.

---

## 2. Wave Dependency Analysis

**What:** Plans are grouped by `wave` (from plan frontmatter `depends_on`). Wave 1 runs first, wave 2 only after wave 1 completes. Within a wave, plans run in parallel.

**Why:** Executing dependent plans before their prerequisites produces broken code, missing imports, or incomplete state.

**Verify:** Plans in target directory are grouped by wave with correct dependency chains.

---

## 3. Plan-Checker Verification Loop

**What:** Draft plans go through: planner creates -> checker verifies -> Q&A loop if issues -> planner revises -> checker re-verifies. Max 3 revision rounds.

**Why:** Plans are prompts for executors. A bad plan produces bad execution. Catching issues before execution saves context budget and prevents rework.

**Verify:** plan.md contains checker spawn, verdict parsing, and revision loop with iteration limit.

---

## 4. Atomic Commits Per Task

**What:** Each task in a plan produces exactly one git commit. Commit format: `{type}({scope}): {description}`.

**Why:** Atomic commits enable: git bisect for debugging, clear audit trail, per-task revert capability, SUMMARY.md commit hash tracking.

**Verify:** After execution, `git log --oneline` shows one commit per task with correct format.

---

## 5. Context Loading Via Paths Not Content

**What:** Orchestrators pass file paths to subagents. Agents read files themselves in their own context window. No content is passed between agents.

**Why:** Passing content bloats the orchestrator context. File paths are ~50 bytes; file content can be 10-50KB.

**Verify:** Search workflow files for `<files_to_read>` blocks; confirm they contain paths, not inline markdown content.

---

## 6. State Progression Via CLI

**What:** STATE.md updates are performed exclusively through `gsd-tools.cjs state` commands. No direct STATE.md file writes by agents.

**Why:** Direct writes can corrupt frontmatter sync, break field patterns, or lose concurrent updates. The CLI ensures: frontmatter stays in sync, field names are consistent, timestamp updates happen automatically.

**Verify:** `node gsd-tools.cjs state json` returns valid JSON with all STATE.md fields.

---

## 7. Session Handoff

**What:** STATE.md `Session Continuity` section + SUMMARY.md frontmatter provide complete context for recovering from `/clear` or session interruption.

**Why:** Claude Code sessions have limited lifetime. When a session ends mid-execution, the next session needs: current position, completed work, decisions, blockers, and what to do next.

**Verify:** STATE.md `Stopped at` field is current. SUMMARY.md exists for completed plans. `state record-session` writes correct values.

---

## 8. Two-Level Planning

**What:** Planning maps to the target type. Capability plans: tasks map to contract sections (Receives/Returns/Rules/Failure/Constraints). Feature plans: tasks map to flow steps from FEATURE.md.

**Why:** Misaligned planning produces scope bleed -- capability plans with UX tasks or feature plans with implementation tasks. Each level has its own shape and verification criteria.

**Verify:** Capability plan tasks trace to contract sections. Feature plan tasks trace to flow steps. No cross-level contamination.

---

## 9. Feature Gate

**What:** Feature planning is blocked until all composed capabilities (listed in `composes: []` frontmatter) are verified. Run `gsd-tools gate-check <feat> --raw` before planning.

**Why:** Features compose capabilities. If a composed capability has no contract or is unverified, the feature plan will reference non-existent primitives. Downstream execution fails.

**Verify:** `gsd-tools gate-check` returns all-clear before any feature plan is created.

---

## 10. Composition Invariant

**What:** Features compose capabilities via `composes: []` frontmatter. Features orchestrate existing capability contracts -- they never implement new logic directly. Features live at `.planning/features/{slug}/`, capabilities at `.planning/capabilities/{slug}/`.

**Why:** If features implement logic, capability contracts become unreliable. The contract boundary is the system's primary correctness guarantee.

**Verify:** Feature PLAN.md tasks reference capability contracts, not raw implementation. No feature task creates new primitive logic.

---

## 11. Summary Frontmatter

**What:** Every completed plan produces a SUMMARY.md with structured YAML frontmatter: `requires`, `provides`, `affects`, `key-files`, `key-decisions`, `duration`.

**Why:** SUMMARY.md frontmatter is the machine-readable record of what happened. It feeds: progress tracking, dependency analysis, session handoff, verification, and the history digest.

**Verify:** `node gsd-tools.cjs summary-extract {path}` returns valid structured data. Frontmatter contains all required fields.

---

## 12. Spot-Check on Executor Output

**What:** After an executor reports completion, verify claims before accepting: check files exist, check git commits exist, check Self-Check marker in SUMMARY.md.

**Why:** Executors can hallucinate completion. A "PASS" with missing files or phantom commits wastes the entire downstream pipeline.

**Verify:** SUMMARY.md contains `## Self-Check: PASSED`. Files listed in `key-files` exist on disk. Commit hashes in task table appear in `git log`.

---

## Quick Reference

| # | Invariant | Impact if Violated |
|---|-----------|-------------------|
| 1 | Fresh context per executor | Quality degradation, context exhaustion |
| 2 | Wave dependency analysis | Broken builds, missing prerequisites |
| 3 | Plan-checker verification loop | Bad plans waste execution context |
| 4 | Atomic commits per task | Lost audit trail, can't bisect/revert |
| 5 | Context via paths not content | Orchestrator context exhaustion |
| 6 | State progression via CLI | Corrupted STATE.md, lost sync |
| 7 | Session handoff | Lost work on /clear |
| 8 | Two-level planning | Scope bleed between capability and feature |
| 9 | Feature gate | Plans reference non-existent contracts |
| 10 | Composition invariant | Capability contracts become unreliable |
| 11 | Summary frontmatter | Broken progress tracking |
| 12 | Spot-check executor output | Phantom completions propagate |
