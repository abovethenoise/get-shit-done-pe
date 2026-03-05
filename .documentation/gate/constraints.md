---
type: gate-doc
gate: constraints
last-verified: 2026-02-28
---

## Constraint: no-implicit-state [manual]
All state must be explicit and documented in state.md. No hidden caches,
no undocumented side effects, no global mutable state.

## Constraint: no-unnecessary-deps [manual]
Every dependency must justify its existence. If it can be done in <20
lines of vanilla code, it should be.

## Constraint: no-silent-failures [manual]
Every error path must be handled explicitly. No empty catch blocks,
no swallowed exceptions, no fire-and-forget.

## Constraint: no-hardcoded-config [manual]
All configuration values externalized. No magic numbers, no embedded
URLs, no inline credentials.

## Constraint: no-premature-abstraction [manual]
Don't abstract until the second use case. No interfaces with one
implementation, no factories that produce one type.

## Constraint: single-responsibility [manual]
One module, one job. If the description requires "and", split it.

## Constraint: explicit-boundaries [manual]
Module inputs and outputs are typed and documented. No passing
unstructured objects across module boundaries.

## Constraint: agent-receives-content [manual]
Reasoning agents receive content, not paths. All file I/O is performed
by the orchestrator or gsd-tools layer. Agents must not read or write
files directly.

## Constraint: skip-not-halt-batch [manual]
For batch workflows processing independent items, malformed output from
one item should be logged and skipped, not used to halt the entire batch.
The skip must be visible (logged to stderr or captured in output).
Companion to no-silent-failures — errors are surfaced, but isolated
failures don't block independent work.

## Constraint: double-underscore-separator [manual]
When composing multiple slug values into a single filename, use
double-underscore (`__`) as separator to avoid collision with hyphens
in slugs.

## Constraint: graceful-degradation-for-optimizations [manual]
Unimplemented optimizations must degrade to correct-but-slow behavior,
never skip work. Emit a stderr warning when falling back.

## Constraint: zero-tool-judge-agent [manual]
Agents with role_type "judge" use tools: [], reads: [], writes: [].
All context passed via prompt. Output IS the artifact. Orchestrator
handles all file I/O. Stricter specialization of agent-receives-content.
