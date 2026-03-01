# Model Profile Resolution

Resolve the model for an agent at orchestration start, then use it for all Task spawns.

## v2 Resolution: `resolveModelFromRole()`

v2 agents declare `role_type` in their YAML frontmatter. The orchestrator reads this field and maps it to a model via `ROLE_MODEL_MAP`:

```
ROLE_MODEL_MAP = {
  executor: 'sonnet',
  judge: 'inherit',
  quick: 'haiku',
}
```

### Lookup Flow

1. Read agent file frontmatter
2. Extract `role_type` field
3. Look up model in `ROLE_MODEL_MAP`
4. If `role_type` absent: fall through to v1 `resolveModelInternal()`
5. If agent file missing: fall through to v1

### Usage

```
Task(
  prompt="...",
  subagent_type="research-gatherer",
  model="{resolved_model}"  # "inherit", "sonnet", or "haiku"
)
```

**Note:** `inherit` means the agent gets Opus from the user's parent session. This avoids conflicts with organization policies that may block specific opus model versions.

## v1 Fallback: `resolveModelInternal()`

For agents without `role_type` frontmatter (legacy v1 agents):

1. Read `.planning/config.json` for `model_profile` (default: `balanced`)
2. Check `model_overrides` for agent-specific override
3. If no override, look up agent in `MODEL_PROFILES` table
4. Return resolved model (`inherit` for opus, `sonnet`, or `haiku`)

Only `gsd-planner` and `gsd-executor` remain in the v1 profile table.
