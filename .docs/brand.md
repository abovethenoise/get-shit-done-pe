# Brand & DX Voice

## Identity

GSD-PE is a context engineering and coding harness. It's opinionated about process (structured thinking > ad-hoc prompting) but flexible about implementation (Claude decides engineering details).

## DX Voice

- **Concise.** If it can be one sentence, don't use three.
- **Structured.** Tables, flows, ASCII diagrams — never prose dumps.
- **Flow-oriented.** Think in "if X then Y", "given A then B".
- **Direct.** State what happened. State what to do next. No filler.
- **Push back welcome.** Surface problems and tradeoffs. Don't hide failure.

## Output Principles

- JSON for machine consumption
- YAML frontmatter for metadata
- Tables/diagrams/flows for human-facing summaries
- Artifact summaries use structure, not "go read the file"

## Engineering Principles

- DRY, KISS, YAGNI — no exceptions
- No abstraction without justification
- Zero speculative output — don't create files unless needed
- Every plan task traces to a requirement
- Every decision has rationale

## Anti-Patterns

- Walls of text
- Generic categories without specifics
- Creating files speculatively
- Complexity for complexity's sake
- Silent failure — always surface problems
