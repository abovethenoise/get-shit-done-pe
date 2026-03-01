# Naming Convention Audit Findings

**Audited:** 2026-03-01
**Convention source:** 10-CONTEXT.md (GSD Naming Conventions)

---

## 1. Agent Files (`agents/`)

Convention: ALL agent files MUST have `gsd-` prefix.

| Filename | Has `gsd-` prefix | Verdict |
|---|---|---|
| gsd-research-domain.md | Yes | OK |
| gsd-research-system.md | Yes | OK |
| gsd-research-intent.md | Yes | OK |
| gsd-research-tech.md | Yes | OK |
| gsd-research-edges.md | Yes | OK |
| gsd-research-prior-art.md | Yes | OK |
| gsd-review-enduser.md | Yes | OK |
| gsd-review-functional.md | Yes | OK |
| gsd-review-technical.md | Yes | OK |
| gsd-review-quality.md | Yes | OK |
| gsd-review-synthesizer.md | Yes | OK |
| gsd-doc-writer.md | Yes | OK |
| gsd-research-synthesizer.md | Yes | OK |
| gsd-executor.md | Yes | OK |
| gsd-planner.md | Yes | OK |
| gsd-plan-checker.md | Yes | OK |
| gsd-verifier.md | Yes | OK |

**Result: 17/17 compliant. No violations.**

---

## 2. Workflow Files (`get-shit-done/workflows/`)

Convention: Workflows MUST NOT have `gsd-` prefix.

| Filename | Has `gsd-` prefix | Verdict |
|---|---|---|
| verify-phase.md | No | OK |
| gather-synthesize.md | No | OK |
| review-phase.md | No | OK |
| doc-phase.md | No | OK |
| init-project.md | No | OK |
| discuss-capability.md | No | OK |
| discuss-feature.md | No | OK |
| framing-discovery.md | No | OK |
| transition.md | No | OK |
| progress.md | No | OK |
| resume-work.md | No | OK |
| execute-plan.md | No | OK |
| execute-phase.md | No | OK |
| research-workflow.md | No | OK |
| research-phase.md | No | OK |
| framing-pipeline.md | No | OK |
| plan-phase.md | No | OK |

**Result: 17/17 compliant. No violations.**

---

## 3. Command Files (`commands/gsd/`)

Convention: Live under `commands/gsd/`, no prefix required.

| Filename | Verdict |
|---|---|
| progress.md | OK |
| review-phase.md | OK |
| doc-phase.md | OK |
| init.md | OK |
| discuss-capability.md | OK |
| debug.md | OK |
| new.md | OK |
| enhance.md | OK |
| refactor.md | OK |
| discuss-feature.md | OK |
| resume-work.md | OK |
| plan-phase.md | OK |
| execute-phase.md | OK |
| research-phase.md | OK |

**Result: 14/14 compliant. All under correct directory.**

---

## 4. Template Files (`get-shit-done/templates/`)

Convention: No `gsd-` prefix, live in `templates/` directory.

| Filename | Has `gsd-` prefix | Verdict |
|---|---|---|
| DEBUG.md | No | OK -- uppercase naming is template convention |
| UAT.md | No | OK |
| VALIDATION.md | No | OK |
| codebase/architecture.md | No | OK -- subdirectory for codebase templates |
| codebase/concerns.md | No | OK |
| codebase/conventions.md | No | OK |
| codebase/integrations.md | No | OK |
| codebase/stack.md | No | OK |
| codebase/structure.md | No | OK |
| codebase/testing.md | No | OK |
| config.json | No | OK -- config, not a template doc |
| context.md | No | OK |
| continue-here.md | No | OK |
| debug-subagent-prompt.md | No | OK |
| discovery.md | No | OK |
| milestone-archive.md | No | OK |
| milestone.md | No | OK |
| project.md | No | OK |
| requirements.md | No | OK |
| research-project/ARCHITECTURE.md | No | OK -- subdirectory for research templates |
| research-project/FEATURES.md | No | OK |
| research-project/PITFALLS.md | No | OK |
| research-project/STACK.md | No | OK |
| research-project/SUMMARY.md | No | OK |
| research.md | No | OK |
| retrospective.md | No | OK |
| roadmap.md | No | OK |
| summary-minimal.md | No | OK |
| user-setup.md | No | OK |
| verification-report.md | No | OK |
| capability.md | No | OK -- new v2 template |
| feature.md | No | OK -- new v2 template |
| review.md | No | OK |
| docs.md | No | OK |
| discovery-brief.md | No | OK -- new v2 template |
| phase-prompt.md | No | OK |
| planner-subagent-prompt.md | No | OK |
| state.md | No | OK |
| summary.md | No | OK |
| summary-standard.md | No | OK |
| summary-complex.md | No | OK |

**Result: 0 naming violations. No `gsd-` prefixes found in templates.**

Note: `codebase/` and `research-project/` subdirectories exist. CONTEXT.md says "All templates live in the same templates/ directory." These subdirectories predate that decision and may be in scope for the template keep/kill audit (separate from naming).

---

## 5. Naming Violations

**None found.** All 4 directories follow their respective conventions:
- Agents: 17/17 have `gsd-` prefix
- Workflows: 17/17 lack `gsd-` prefix
- Commands: 14/14 under `commands/gsd/`
- Templates: 0 have `gsd-` prefix

---

## 6. Misplaced Files

**None found.** Cross-reference checks:
- No agent-like files in workflows directory
- No workflow-like files in agents directory
- All commands are under `commands/gsd/` (no stray command files elsewhere)

---

## 7. Risk Flags

No renaming needed, so no reference-breakage risk from this audit.

**One observation for other Phase 10 work items:**
- Template subdirectories (`codebase/`, `research-project/`) may conflict with the CONTEXT.md decision that "All templates live in the same templates/ directory (stale v1 templates deleted, only v2 remains)." This is a template keep/kill question, not a naming question -- flagging for awareness.
