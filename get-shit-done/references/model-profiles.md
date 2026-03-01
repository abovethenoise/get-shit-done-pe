# Model Profiles

Model profiles control which Claude model GSD agents use. v2 uses role-based resolution; v1 per-agent table is deprecated.

## v2 Role-Based Model Map (Primary)

All v2 agents declare `role_type` in their YAML frontmatter. The orchestrator reads this field to determine the model.

| Role Type | Model | Rationale |
|-----------|-------|-----------|
| Main/Orchestrator | inherit (opus) | Runs at user session level — planning, orchestration, user Q&A |
| executor | sonnet | Does the work: gathering, planning, executing, documenting |
| judge | inherit (opus) | Validates, synthesizes, reviews — needs strong reasoning |
| quick | haiku | Lightweight tasks: slugs, timestamps, simple lookups |

### Resolution via `resolveModelFromRole(cwd, agentPath)`

1. Read agent file frontmatter
2. If `role_type` exists: use `ROLE_MODEL_MAP`
3. If `role_type` absent: fall through to v1 `resolveModelInternal()`
4. If agent file missing: fall through to v1

### v2 Agent Assignments

| Agent | Role Type | Model |
|-------|-----------|-------|
| 6x research gatherers | executor | Sonnet |
| Research synthesizer | judge | Opus |
| Planner | executor | Sonnet |
| Plan validator | judge | Opus |
| 4x reviewers | judge | Opus |
| Review synthesizer | judge | Opus |
| Documentation writer | executor | Sonnet |

### Claude Code Constraint

The `model` parameter in Task/Agent calls only accepts `"sonnet"`, `"haiku"`, or `"inherit"` — `"opus"` is NOT a valid value. Therefore judges use `"inherit"` which gets Opus from the user's parent session. This requires the user to start their session on Opus. The orchestrator runs at the user's session level (Opus), executors are explicitly downgraded to Sonnet, judges inherit Opus.

## v1 Profile Table (Deprecated — Fallback Only)

Only `gsd-planner` and `gsd-executor` remain as v1 fallbacks for code paths that haven't migrated to role-based resolution.

| Agent | `quality` | `balanced` | `budget` |
|-------|-----------|------------|----------|
| gsd-planner | opus | opus | sonnet |
| gsd-executor | opus | sonnet | sonnet |

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

**Why `inherit` instead of passing `opus` directly?**
Claude Code's `"opus"` alias maps to a specific model version. Organizations may block older opus versions while allowing newer ones. GSD returns `"inherit"` for opus-tier agents, causing them to use whatever opus version the user has configured in their session. This avoids version conflicts and silent fallbacks to Sonnet.
