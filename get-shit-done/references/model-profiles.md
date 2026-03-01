# Model Profiles

Model profiles control which Claude model each GSD agent uses. This allows balancing quality vs token spend.

## Profile Definitions

| Agent | `quality` | `balanced` | `budget` |
|-------|-----------|------------|----------|
| gsd-planner | opus | opus | sonnet |
| gsd-roadmapper | opus | sonnet | sonnet |
| gsd-executor | opus | sonnet | sonnet |
| gsd-project-researcher | opus | sonnet | haiku |
| gsd-research-synthesizer | sonnet | sonnet | haiku |
| gsd-debugger | opus | sonnet | sonnet |
| gsd-codebase-mapper | sonnet | haiku | haiku |
| gsd-verifier | sonnet | sonnet | haiku |
| gsd-plan-checker | sonnet | sonnet | haiku |
| gsd-integration-checker | sonnet | sonnet | haiku |

## Profile Philosophy

**quality** - Maximum reasoning power
- Opus for all decision-making agents
- Sonnet for read-only verification
- Use when: quota available, critical architecture work

**balanced** (default) - Smart allocation
- Opus only for planning (where architecture decisions happen)
- Sonnet for execution and research (follows explicit instructions)
- Sonnet for verification (needs reasoning, not just pattern matching)
- Use when: normal development, good balance of quality and cost

**budget** - Minimal Opus usage
- Sonnet for anything that writes code
- Haiku for research and verification
- Use when: conserving quota, high-volume work, less critical phases

## Resolution Logic

Orchestrators resolve model before spawning:

```
1. Read .planning/config.json
2. Check model_overrides for agent-specific override
3. If no override, look up agent in profile table
4. Pass model parameter to Task call
```

## v2 Role-Based Resolution (Executor / Judge)

v2 agents declare `role_type: executor | judge` in their YAML frontmatter. The orchestrator reads this field to determine the model — no per-agent lookup table needed.

### Role Mapping

| Role Type | Model | Rationale |
|-----------|-------|-----------|
| executor | sonnet | Does the work: gathering, planning, executing, documenting |
| judge | inherit (opus) | Validates, synthesizes, reviews, handles user Q&A |

### Resolution Priority

`resolveModelFromRole(cwd, agentPath)` checks:

1. Read agent file frontmatter
2. If `role_type` exists → use `ROLE_MODEL_MAP`
3. If `role_type` absent → fall through to v1 `resolveModelInternal()`
4. If agent file missing → fall through to v1

### v2 Agent Assignments

| Agent | Role Type | Model |
|-------|-----------|-------|
| 6x research gatherers | executor | Sonnet |
| Research synthesizer | judge | Opus |
| Planner (Phase 3) | executor | Sonnet |
| Plan validator (Phase 3) | judge | Opus |
| 4x reviewers (Phase 4) | judge | Opus |
| Review synthesizer (Phase 4) | judge | Opus |
| Documentation writer (Phase 5) | executor | Sonnet |

### Claude Code Constraint

The `model` parameter in Task/Agent calls only accepts `"sonnet"`, `"haiku"`, or `"inherit"` — `"opus"` is NOT a valid value. Therefore judges use `"inherit"` which gets Opus from the user's parent session. This requires the user to start their session on Opus. The orchestrator runs at the user's session level (Opus), executors are explicitly downgraded to Sonnet, judges inherit Opus.

### Coexistence

v1 `MODEL_PROFILES` table remains for v1 agents. v2 agents use `role_type`. Both systems coexist during bootstrap. Phase 7 cleanup removes v1 table.

## Per-Agent Overrides

Override specific agents without changing the entire profile:

```json
{
  "model_profile": "balanced",
  "model_overrides": {
    "gsd-executor": "opus",
    "gsd-planner": "haiku"
  }
}
```

Overrides take precedence over the profile. Valid values: `opus`, `sonnet`, `haiku`.

## Switching Profiles

Runtime: `/gsd:set-profile <profile>`

Per-project default: Set in `.planning/config.json`:
```json
{
  "model_profile": "balanced"
}
```

## Design Rationale

**Why Opus for gsd-planner?**
Planning involves architecture decisions, goal decomposition, and task design. This is where model quality has the highest impact.

**Why Sonnet for gsd-executor?**
Executors follow explicit PLAN.md instructions. The plan already contains the reasoning; execution is implementation.

**Why Sonnet (not Haiku) for verifiers in balanced?**
Verification requires goal-backward reasoning - checking if code *delivers* what the phase promised, not just pattern matching. Sonnet handles this well; Haiku may miss subtle gaps.

**Why Haiku for gsd-codebase-mapper?**
Read-only exploration and pattern extraction. No reasoning required, just structured output from file contents.

**Why `inherit` instead of passing `opus` directly?**
Claude Code's `"opus"` alias maps to a specific model version. Organizations may block older opus versions while allowing newer ones. GSD returns `"inherit"` for opus-tier agents, causing them to use whatever opus version the user has configured in their session. This avoids version conflicts and silent fallbacks to Sonnet.
