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
