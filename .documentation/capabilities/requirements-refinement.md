# Requirements Refinement
status: active

## Brief

Project-level coherence audit pipeline. Scans all capabilities and features, identifies gaps/overlaps/misalignments, presents findings for interactive Q&A, applies confirmed changes, and generates a refinement report.

### Pipeline Architecture

```
landscape-scan -> coherence-report -> refinement-qa -> change-application -> refinement-artifact
```

| Feature | Role |
|---------|------|
| landscape-scan | Discover capabilities, enumerate pairs, analyze each pair for coherence issues, produce three-layer output (matrix, findings, dependency graph) |
| coherence-report | Synthesize scan findings into actionable recommendations with root-cause grouping |
| refinement-qa | Interactive Q&A on recommendations — user accepts, modifies, rejects, or defers each finding |
| change-application | Apply confirmed changes from CHANGESET.md to capability and feature files |
| refinement-artifact | Manage refinement directory structure, pre-scan snapshots, report file writing, and cross-run delta computation |

### Key Patterns

- **Sequential pair analysis:** Each pair agent receives prior findings to avoid duplicate detection
- **Checkpoint resumability:** Pairs tracked via `A__B.complete` markers for resume-after-interrupt
- **Agent-receives-content:** Reasoning agents receive file contents, not paths — orchestrator handles I/O
- **Skip-not-halt:** Malformed output from one pair/finding is logged and skipped, not used to halt the batch
- **Single-agent synthesis:** coherence-report uses one agent invocation (not staged pipeline)
- **Zero-tool judge agent:** gsd-coherence-synthesizer has tools:[] — receives content, produces output, no file I/O
- **AskUserQuestion resolution loop:** refinement-qa presents 3 options per finding (accept/research/reject) with follow-up text capture
- **Producer-consumer contract:** CHANGESET.md written by refinement-qa, parsed by changeset-parse, consumed by change-application
- **CLI routes use positional args** (not flags) for required parameters — flag-style invocation silently produces wrong slugs
- **CLI for creates, direct edits for everything else:** change-application uses capability-create/feature-create CLI for creates, Read+Edit for modifications
- **Snapshot-then-clear:** refinement-init reads existing artifacts, then clears stale findings before new scan
- **Simplification precedent:** change-application reduced from 9 to 4 requirements — when domain is low-risk (markdown), favor simple sequential application over defensive patterns

## Requirements
See individual FEATURE.md files in `.planning/capabilities/requirements-refinement/features/`.
