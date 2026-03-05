---
type: flow-doc
built-from-code-at: 1ce18fe
last-verified: 2026-03-05
---

## Flow: requirements-refinement/coherence-report

## Trigger: [derived]

User invokes the coherence-report workflow after landscape-scan completes. Reads scan artifacts from `.planning/refinement/` and project context files.

## Input: [derived]

- Implicit: `.planning/refinement/matrix.md` (required)
- Implicit: `.planning/refinement/dependency-graph.md` (optional -- may not exist if scan found zero dependencies)
- Implicit: `.planning/refinement/findings/FINDING-*.md` (required directory, may contain zero files)
- Implicit: `.planning/PROJECT.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`
- Implicit: `.planning/capabilities/{slug}/CAPABILITY.md` for all capabilities

## Steps: [derived]

```
1. validate_scan_artifacts -> check .planning/refinement/ exists, matrix.md exists, findings/ exists
                           -> dependency-graph.md treated as optional
2. load_scan_artifacts     -> read matrix.md, dependency-graph.md (if exists), glob FINDING-*.md
                           -> count findings: 0 = "zero-findings" mode, else "normal" mode
3. load_project_context    -> read PROJECT.md, ROADMAP.md, STATE.md
                           -> run capability-list, read each CAPABILITY.md
4. assemble_agent_prompt   -> build XML blocks: <project_context>, <scan_artifacts>,
                              <findings>, <capabilities>, <mode>
                           -> agent receives content not paths (all context inline)
5. spawn_synthesis_agent   -> single invocation of gsd-coherence-synthesizer agent
                           -> agent returns RECOMMENDATIONS.md content as output
6. write_recommendations   -> write to temp file
                           -> gsd-tools refinement-write --type recommendations --content-file {tmp}
                           -> fallback: direct Write tool if CLI fails
```

### Zero-Findings Mode Branch

At step 2, if no FINDING-*.md files exist, MODE is set to `zero-findings`. The mode flag is passed through to the synthesis agent via `<mode>` XML block. The agent produces a minimal RECOMMENDATIONS.md confirming clean project coherence -- it does not invent issues.

## Output: [derived]

- `.planning/refinement/RECOMMENDATIONS.md` -- structured recommendations with 7 fixed sections (Executive Summary, Root Causes, Systemic Patterns, Goal Alignment, Resolution Sequence, Contradictions, Q&A Agenda)

## Side-effects: [derived]

- Reads all capability definitions and project context files (read-only)
- Writes a single file (RECOMMENDATIONS.md) via the refinement-write CLI route
- Creates a temporary content file during write (cleaned up after)

## WHY: [authored]

**Single agent invocation, not staged pipeline:** The coherence synthesizer receives all context in one prompt. Staged analysis (e.g., separate clustering then prioritization) would lose cross-section coherence -- contradictions in section 6 depend on resolution sequence from section 5 which depends on root causes from section 2.

**Content not paths passed to agent:** The synthesis agent has `tools: []` (zero-tool judge). It cannot read files. The orchestrator loads everything and assembles XML blocks so the agent operates purely on provided content.

**Zero-findings detected at orchestrator level:** The orchestrator counts findings and sets the mode flag rather than letting the agent decide. This prevents the agent from hallucinating findings when none exist.
