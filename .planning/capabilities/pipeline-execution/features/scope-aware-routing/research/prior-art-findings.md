## Prior Art Findings

### Approaches Identified

| Approach | Description | Maturity | Fit for Context | Source |
|----------|-------------|----------|-----------------|--------|
| GSD execute/plan/doc inline routing | slug-resolve -> type check -> branch (capability -> orchestrator, feature -> workflow) — already implemented in /gsd:execute, /gsd:plan, /gsd:doc | proven (deployed in this codebase) | high | `/Users/philliphall/get-shit-done-pe/commands/gsd/execute.md`, `plan.md`, `doc.md` |
| framing-discovery delegated routing | Lens commands delegate ALL routing to framing-discovery.md, which internally handles slug-resolve and feature/capability branching in Step 2 | proven (deployed in this codebase) | medium — only covers capability-level today, no capability-orchestrator branch | `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/framing-discovery.md` Step 2 |
| Turborepo filter-based scope selection | `turbo run build --filter=my-app` resolves package graph membership, routes task to package-level or workspace-level execution based on filter match | proven (production monorepo tooling) | low — library dependency, overkill for slug-type dispatch in a prose workflow system | [Turborepo Run Command](https://deepwiki.com/vercel/turborepo/4.1-run-command) |
| AWS Agentic Classifier-Then-Branch | LLM classifies intent (legal vs technical vs scheduling), routes to specialized subagent or tool chain. Dynamic cognitive dispatching replaces hard-coded rules. | proven (AWS Bedrock production) | low — GSD already has a deterministic type signal from `slug-resolve` (returns `type: capability | feature`); LLM classification adds noise where structure already exists | [AWS Routing Dynamic Dispatch](https://docs.aws.amazon.com/prescriptive-guidance/latest/agentic-ai-patterns/routing-dynamic-dispatch-patterns.html) |
| OpenAI Agents SDK Handoff Pattern | Triage agent routes conversation to specialist via handoff; specialist becomes active agent. Structured outputs can also classify explicitly before routing. | proven (OpenAI production SDK) | low — handoff model assumes conversational multi-turn; GSD routing is single-turn slug dispatch, not conversation hand-off | [OpenAI Agents SDK Multi-Agent](https://openai.github.io/openai-agents-python/multi_agent/) |

---

### Recommended Starting Point

**GSD execute/plan inline routing pattern**: The pattern is already proven in this codebase, battle-tested across `/gsd:execute`, `/gsd:plan`, and `/gsd:doc`. It is the direct solution to scope-aware routing with zero new infrastructure.

The exact pattern, copied from `/gsd:execute`:
```
1. RESOLVED=$(gsd-tools slug-resolve "$ARGUMENTS")
2. Parse JSON: resolved, type, capability_slug, feature_slug, candidates, reason
3. if type == "capability" -> invoke capability-orchestrator.md with CAPABILITY_SLUG + LENS
   if type == "feature"    -> invoke framing-pipeline.md (current behavior)
   if reason == "ambiguous" -> AskUserQuestion with candidates
   if reason == "no_match"  -> AskUserQuestion with create/retry options
```

The four lens commands (`/gsd:new`, `/gsd:enhance`, `/gsd:debug`, `/gsd:refactor`) currently skip this and delegate entirely to `framing-discovery.md`. The fix is to promote the slug-resolve + branch pattern from inside `framing-discovery` to the command level, mirroring what `/gsd:execute` and `/gsd:plan` already do.

Source: `/Users/philliphall/get-shit-done-pe/commands/gsd/execute.md` (Steps 1-3), `/Users/philliphall/get-shit-done-pe/commands/gsd/plan.md` (identical pattern)

---

### Anti-Patterns

- **LLM semantic routing for slug type detection**: Having Claude infer whether an argument is a capability or feature from natural language. This fails because `slug-resolve` already returns a deterministic `type` field. Replacing a structured tool output with LLM inference introduces unnecessary hallucination risk and nondeterminism. The project's own prior art (`/gsd:execute`, `/gsd:plan`) proves the deterministic path works. — [First principles: if a tool already returns a typed result, adding an LLM classification layer over it violates KISS and introduces entropy without benefit]

- **Shared routing middleware/abstraction layer**: Extracting routing into a shared workflow file invoked by all 4 lens commands. Appealing from a DRY standpoint but the FEATURE.md Decisions section explicitly rejects this: "Routing is simple: resolve slug type, branch accordingly. No shared routing layer needed — each lens command handles it." The failure mode: shared abstractions in prose-based prompt workflows are harder to trace, version, and debug than inline repetition. — `/Users/philliphall/get-shit-done-pe/.planning/capabilities/pipeline-execution/features/scope-aware-routing/FEATURE.md` (Decisions section)

- **Relying on framing-discovery.md to handle capability routing**: Currently, `/gsd:new` etc. delegate everything to `framing-discovery.md`, which resolves slugs internally (Step 2). The problem: `framing-discovery.md` only handles the discovery Q&A path — it has no branch to `capability-orchestrator.md`. Patching the routing into `framing-discovery` would conflate discovery-workflow logic with routing-dispatch logic. The execute/plan pattern shows the right layering: command file owns routing, workflows own execution. — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/framing-discovery.md` Step 2 vs `/Users/philliphall/get-shit-done-pe/commands/gsd/execute.md` pattern

- **Capability-level iteration inline (as /gsd:doc does)**: `/gsd:doc` at capability level iterates features directly inline rather than calling `capability-orchestrator.md`. This pattern is documented as intentional for doc (`/gsd:doc` success criteria: "Capability-level routing uses inline iteration (not capability-orchestrator.md)"). For lens commands, the requirement explicitly routes capability-level to `capability-orchestrator.md` (FN-01, TC-01). Do not replicate the doc inline-iteration pattern for lens commands. — `/Users/philliphall/get-shit-done-pe/commands/gsd/doc.md` success criteria, `/Users/philliphall/get-shit-done-pe/.planning/capabilities/pipeline-execution/features/scope-aware-routing/FEATURE.md` FN-01

---

### Libraries / Tools

- **gsd-tools slug-resolve**: Already deployed CLI tool. Accepts a slug string, returns JSON with `resolved` (bool), `type` (`capability` | `feature`), `capability_slug`, `feature_slug`, `candidates[]`, `reason` (`ambiguous` | `no_match`). Supports `--type feature` to force feature-only matching (used by `/gsd:review`). This is the only tool needed for routing resolution. — `/Users/philliphall/get-shit-done-pe/commands/gsd/execute.md` Step 1, `review.md` Step 1

- **gsd-tools capability-status**: Returns capability metadata including `features[]` with per-feature slug and status. Used by `capability-orchestrator.md` Step 1 for DAG construction. Relevant to FN-02 (stub auto-creation needs feature slug enumeration from CAPABILITY.md). — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/capability-orchestrator.md` Step 1

---

### Canonical Patterns

- **Command-level routing, workflow-level execution**: The clean layering pattern established by `/gsd:execute` and `/gsd:plan` — the slash command file owns slug resolution and branch dispatch; the workflow files (capability-orchestrator, execute-plan, framing-pipeline) own execution logic. Commands are thin routers; workflows are thick executors. Use this boundary for all 4 lens command updates. — `/Users/philliphall/get-shit-done-pe/commands/gsd/execute.md`, `/Users/philliphall/get-shit-done-pe/commands/gsd/plan.md`

- **AskUserQuestion for ambiguity, not silent resolution**: When `slug-resolve` returns `reason: ambiguous`, present candidates via `AskUserQuestion` and let the user pick. Never auto-select. When `reason: no_match`, offer structured options (create/retry/cancel). This pattern is consistent across execute, plan, review, doc. — All existing commands with slug-resolve step

- **LENS propagation through orchestrator**: When routing capability-level, pass `LENS` (not a hardcoded verb) to `capability-orchestrator.md`. The orchestrator already accepts `LENS` as a variable input and passes it through to `framing-pipeline.md` per feature. This allows a single routing update to support all 4 lenses without per-lens orchestrator variants. — `/Users/philliphall/get-shit-done-pe/get-shit-done/workflows/capability-orchestrator.md` Step 1 (`Inputs: CAPABILITY_SLUG, LENS`) and Step 4b (passes LENS to framing-pipeline)

- **Type-hint filtering for feature-only commands**: `/gsd:review` passes `--type feature` to `slug-resolve` to constrain matching to features only. For lens commands that should also accept capabilities, omit the type hint (default behavior resolves both). This is the existing discriminator for "feature-only" vs "capability-or-feature" commands. — `/Users/philliphall/get-shit-done-pe/commands/gsd/review.md` Step 1
