---
type: gate-doc
gate: glossary
last-verified: 2026-02-28
---

## Glossary: module [manual]
A single-purpose source file with explicit exports.

## Glossary: flow [manual]
An end-to-end data path triggered by an event or user action.

## Glossary: gate doc [manual]
Documentation authored before development that governs the project.
Read-only to automated agents.

## Glossary: derived [manual]
Doc content regenerated from code. Agent may overwrite freely.

## Glossary: authored [manual]
Doc content written with judgment. Agent never overwrites.

## Glossary: landscape map [manual]
Three-layer output from landscape-scan: relationship matrix, individual
finding cards, and dependency graph. Consumed by coherence-report.

## Glossary: coherence finding [manual]
A detected issue between two or more capabilities — conflict, gap,
overlap, or dependency. Represented as a FINDING-{NNN}.md card.

## Glossary: GAP [manual]
Finding type indicating a missing artifact or relationship. A capability
directory without CAPABILITY.md, or an undocumented dependency between
capabilities.

## Glossary: completeness [manual]
Classification of a capability's artifact coverage: full (CAPABILITY.md +
features + documentation), partial (any subset), or none (empty directory).

## Glossary: recommendations [manual]
Seven-section synthesis document from coherence-report. Contains root
causes, systemic patterns, goal alignment, resolution sequence,
contradictions, Q&A agenda. Written to .planning/refinement/RECOMMENDATIONS.md.

## Glossary: Q&A agenda categories [manual]
Three categories defined by coherence-synthesizer, consumed by refinement-qa:
decision (requires user choice), informational (clear fix, user informed),
auto-resolve (obvious fix, no discussion needed).
