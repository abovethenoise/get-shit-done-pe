---
type: docs
capability: "{slug}"
built_from_code_at: "{git-sha}"
---

# Documentation: {capability}

Generate three output files for this capability, targeting `.documentation/{capability}/`.

All output files must have YAML frontmatter. Optimize content for mgrep searches and the four framings: new (building something that depends on this), extend (adding to this capability), debug (fixing something broken), refactor (restructuring this code).

## Output Files

### design.md

Architecture decisions, data flow, and why things are structured this way.

Target: `.documentation/{capability}/design.md`

Frontmatter: `type: design`, `capability: {slug}`, `generated: {date}`

Content guidance:
- Architecture decisions with rationale (not just what, but why)
- Data flow diagrams (ASCII)
- Layer responsibilities and boundaries
- Key tradeoffs and alternatives considered
- Invariants and constraints that shaped the design

### features.md

Per-feature reference: what it does, how to use it, key functions/modules.

Target: `.documentation/{capability}/features.md`

Frontmatter: `type: features`, `capability: {slug}`, `generated: {date}`

Content guidance:
- One section per feature
- What it does (behavior summary)
- How to use it (entry points, parameters, return values)
- Key functions and modules with file paths
- Edge cases and error handling

### lessons.md

Things learned, gotchas, patterns that worked or did not.

Target: `.documentation/{capability}/lessons.md`

Frontmatter: `type: lessons`, `capability: {slug}`, `generated: {date}`

Content guidance:
- Patterns that worked well (reuse these)
- Patterns that failed or were abandoned (avoid these)
- Gotchas and non-obvious behavior
- Performance insights
- Testing lessons
