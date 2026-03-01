# E2E Simulation Notes

**Date:** 2026-03-01
**Synthetic project:** /tmp/gsd-e2e-* (todo-app with task-management feature)

## Simulation Sequence

### Step 1: Init new project (empty dir)
- **Route:** `init project --cwd=<empty>`
- **Result:** PASS — exit 0, valid JSON, `detected_mode: "new"`, correct shape
- **Notes:** Clean detection, all fields present

### Step 2: Create project scaffolding
- Manually created: STATE.md, REQUIREMENTS.md, ROADMAP.md, config.json
- Capability: `todo-app` with feature `task-management`
- Git initialized and committed

### Step 3: Framing discovery (new lens)
- **Route:** `init framing-discovery new --cwd=<dir>`
- **Result:** PASS — returns lens, MVU slots, anchor questions path, capability list
- **Notes:** All framing context present. `anchor_questions_exists: true`, `framing_lenses_exists: true`

### Step 4: Discuss capability
- **Route:** `init discuss-capability --cwd=<dir>`
- **Result:** PASS — returns capability list with todo-app
- **Notes:** `doc_capabilities` empty (no .documentation/ dir yet) — correct behavior

### Step 5: Discuss feature
- **Route:** `init discuss-feature --cwd=<dir>`
- **Result:** PASS — returns capability list with nested features, flat feature list
- **Notes:** Feature paths correctly formed (`todo-app/task-management`)

### Step 6: Plan feature
- **Route:** `init plan-feature todo-app task-management --cwd=<dir>`
- **Result:** PASS — returns planning context with model config, capability/feature paths
- **Notes:** `research_enabled: false` (from config.json), `plan_checker_enabled: true`

### Step 7: Execute feature
- **Route:** `init execute-feature todo-app task-management --cwd=<dir>`
- **Result:** PASS — returns executor/verifier models, capability/feature context
- **Notes:** `plan_count: 0` (no plans yet) — correct for scaffolded-but-unplanned feature

### Step 8: Progress
- **Route:** `init progress --cwd=<dir>`
- **Result:** PASS — returns milestone info, empty phases (v2 uses capabilities not phases)
- **Notes:** `phase_count: 0` is correct — v2 doesn't use phase structure for progress tracking. But `project_exists: false` — the progress route checks for PROJECT.md which we didn't create. This is accurate behavior.

### Step 9: Resume
- **Route:** `init resume --cwd=<dir>`
- **Result:** PASS — returns state/roadmap existence, no interrupted agent
- **Notes:** `project_exists: false` same as progress. `has_interrupted_agent: false` — correct for fresh project.

## Findings

### Friction
1. **`/gsd:new-project` doesn't exist** — init.md after-text says "Run `/gsd:new-project`" but the actual command is `/gsd:new`. Same issue in init-project.md workflow and plan.md error message. (3 locations)
2. **`/gsd:discuss-phase` dead reference** — research.md template line 21 references this v1 command.

### Cosmetic
1. **Progress route returns phases not capabilities** — `init progress` returns `phases: []` and `phase_count: 0`. The v2 model uses capabilities/features, not phases. The progress route still uses phase terminology internally. Not a blocker since the progress.md workflow handles the display, but the JSON shape is v1-flavored.
2. **`feature-op` accepts no args silently** — Returns JSON with null capability/feature fields instead of erroring. Other routes (`plan-feature`, `execute-feature`) properly validate and error.

### No Issues
- All 9 routes produce valid JSON
- Output shapes match what consuming commands/workflows expect
- Capability/feature paths resolve correctly
- Config settings (commit_docs, research, parallelization) propagate correctly
- State detection works for both new and existing projects
