<ui_patterns>

Visual patterns for user-facing GSD output. Orchestrators @-reference this file.

## Stage Banners

Use for major workflow transitions.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► {STAGE NAME}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Stage names (uppercase):**
- `QUESTIONING`
- `RESEARCHING`
- `DEFINING REQUIREMENTS`
- `CREATING ROADMAP`
- `PLANNING {FEATURE}`
- `EXECUTING WAVE {N}`
- `VERIFYING`
- `FEATURE {FEAT} COMPLETE ✓`
- `FOCUS GROUP COMPLETE 🎉`

---

## Checkpoint Boxes

User action required. 62-character width.

```
╔══════════════════════════════════════════════════════════════╗
║  CHECKPOINT: {Type}                                          ║
╚══════════════════════════════════════════════════════════════╝

{Content}

──────────────────────────────────────────────────────────────
→ {ACTION PROMPT}
──────────────────────────────────────────────────────────────
```

**Types:**
- `CHECKPOINT: Verification Required` → `→ Type "approved" or describe issues`
- `CHECKPOINT: Decision Required` → `→ Select: option-a / option-b`
- `CHECKPOINT: Action Required` → `→ Type "done" when complete`

---

## Status Symbols

```
✓  Complete / Passed / Verified
✗  Failed / Missing / Blocked
◆  In Progress
○  Pending
⚡ Auto-approved
⚠  Warning
🎉 Milestone complete (only in banner)
```

---

## Progress Display

**Capability/feature level:**
```
Progress: ████████░░ 80%
```

**Task level:**
```
Tasks: 2/4 complete
```

**Plan level:**
```
Plans: 3/5 complete
```

---

## Spawning Indicators

```
◆ Spawning researcher...

◆ Spawning 4 researchers in parallel...
  → Stack research
  → Features research
  → Architecture research
  → Pitfalls research

✓ Researcher complete: STACK.md written
```

---

## Next Up Block

Always at end of major completions.

```
───────────────────────────────────────────────────────────────

## ▶ Next Up

**{Identifier}: {Name}** — {one-line description}

`{copy-paste command}`

<sub>`/clear` first → fresh context window</sub>

───────────────────────────────────────────────────────────────

**Also available:**
- `/gsd:alternative-1` — description
- `/gsd:alternative-2` — description

───────────────────────────────────────────────────────────────
```

---

## Error Box

```
╔══════════════════════════════════════════════════════════════╗
║  ERROR                                                       ║
╚══════════════════════════════════════════════════════════════╝

{Error description}

**To fix:** {Resolution steps}
```

---

## Tables

```
| Feature | Status | Plans | Progress |
|---------|--------|-------|----------|
| Auth    | ✓      | 3/3   | 100%     |
| Search  | ◆      | 1/4   | 25%      |
| Export  | ○      | 0/2   | 0%       |
```

---

## ASCII Flow Diagrams

Use for wave dependency visualization. Render only when plan has **2+ waves OR 3+ plans** (complexity gate). Omit for trivially simple plans (1 wave, 1-2 plans).

**Notation:**
```
[Plan-01: objective summary] --> [Plan-02: objective summary]
                             --> [Plan-03: objective summary]

[Plan-04: objective summary] (after Plan-02 + Plan-03)
```

Rules:
- Use `-->` for sequential dependency
- Plans at same wave level appear on separate lines under a shared arrow column
- Parenthetical notes for multi-dependency convergence: `(after Plan-XX + Plan-YY)`
- No box-drawing characters (`┌`, `─`, `┐`) — use `[brackets]` and `-->` only
- Objective summary: 3-6 words, enough to identify the plan's purpose

---

## Anti-Patterns

- Varying box/banner widths
- Mixing banner styles (`===`, `---`, `***`)
- Skipping `GSD ►` prefix in banners
- Random emoji (`🚀`, `✨`, `💫`)
- Missing Next Up block after completions
- Flow diagrams on trivially simple plans (1 wave, ≤2 plans)

</ui_patterns>
