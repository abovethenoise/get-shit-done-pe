# Verifier Reference

Detailed verification procedures, stub detection patterns, evidence gathering templates, and gap structuring for the gsd-verifier agent. Loaded by the orchestrator as @reference context at spawn time.

---

## Verification Process

### Step 0: Check for Previous Verification

```bash
cat "$PHASE_DIR"/*-VERIFICATION.md 2>/dev/null
```

If previous verification exists with `gaps:` section: **RE-VERIFICATION MODE**
- Parse previous VERIFICATION.md frontmatter
- Extract `must_haves` (truths, artifacts, key_links) and `gaps`
- Failed items: Full 3-level verification
- Passed items: Quick regression check (existence + basic sanity only)

If no previous verification: **INITIAL MODE** -- proceed with Step 1.

### Step 1: Load Context (Initial Mode)

```bash
ls "$PHASE_DIR"/*-PLAN.md 2>/dev/null
ls "$PHASE_DIR"/*-SUMMARY.md 2>/dev/null
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" roadmap get-phase "$PHASE_NUM"
```

Extract feature goal from FEATURE.md -- this is the outcome to verify.

### Step 2: Establish Must-Haves (Initial Mode)

**Option A: Must-haves from PLAN frontmatter** (preferred)

```bash
grep -l "must_haves:" "$PHASE_DIR"/*-PLAN.md 2>/dev/null
```

**Option B: Success Criteria from FEATURE.md**

Use EU/FN/TC requirements directly as truths, derive artifacts and key_links.

**Option C: Derive from feature goal** (fallback)

1. State the goal from FEATURE.md
2. Derive truths: "What must be TRUE?" (3-7 observable behaviors)
3. Derive artifacts: "What must EXIST?"
4. Derive key links: "What must be CONNECTED?"

### Step 3: Verify Observable Truths

For each truth, determine if codebase enables it.

| Status | Meaning |
|--------|---------|
| VERIFIED | All supporting artifacts pass all checks |
| FAILED | One or more artifacts missing, stub, or unwired |
| UNCERTAIN | Cannot verify programmatically (needs human) |

### Step 4: Verify Artifacts (Three Levels)

```bash
ARTIFACT_RESULT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" verify artifacts "$PLAN_PATH")
```

**Level 1 -- Exists:**

| exists | Status |
|--------|--------|
| true | Proceed to Level 2 |
| false | MISSING |

**Level 2 -- Substantive (not a stub):**

| exists | issues empty | Status |
|--------|-------------|--------|
| true | true | Proceed to Level 3 |
| true | false | STUB |

**Level 3 -- Wired (imported and used):**

```bash
# Import check
grep -r "import.*$artifact_name" "${search_path:-src/}" --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l

# Usage check (beyond imports)
grep -r "$artifact_name" "${search_path:-src/}" --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "import" | wc -l
```

| Wiring | Status |
|--------|--------|
| Imported AND used | WIRED |
| Exists but not imported/used | ORPHANED |
| Imported but not used (or vice versa) | PARTIAL |

### Final Artifact Status

| Exists | Substantive | Wired | Status |
|--------|-------------|-------|--------|
| Yes | Yes | Yes | VERIFIED |
| Yes | Yes | No | ORPHANED |
| Yes | No | - | STUB |
| No | - | - | MISSING |

### Step 5: Verify Key Links (Wiring)

```bash
LINKS_RESULT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" verify key-links "$PLAN_PATH")
```

#### Wiring Patterns

**Component -> API:**
```bash
grep -E "fetch\(['\"].*$api_path|axios\.(get|post).*$api_path" "$component" 2>/dev/null
grep -A 5 "fetch\|axios" "$component" | grep -E "await|\.then|setData|setState" 2>/dev/null
```
Status: WIRED (call + response handling) | PARTIAL (call, no response use) | NOT_WIRED

**API -> Database:**
```bash
grep -E "prisma\.$model|db\.$model|$model\.(find|create|update|delete)" "$route" 2>/dev/null
grep -E "return.*json.*\w+|res\.json\(\w+" "$route" 2>/dev/null
```
Status: WIRED (query + result returned) | PARTIAL (query, static return) | NOT_WIRED

**Form -> Handler:**
```bash
grep -E "onSubmit=\{|handleSubmit" "$component" 2>/dev/null
grep -A 10 "onSubmit.*=" "$component" | grep -E "fetch|axios|mutate|dispatch" 2>/dev/null
```
Status: WIRED (handler + API call) | STUB (only logs/preventDefault) | NOT_WIRED

**State -> Render:**
```bash
grep -E "useState.*$state_var|\[$state_var," "$component" 2>/dev/null
grep -E "\{.*$state_var.*\}|\{$state_var\." "$component" 2>/dev/null
```
Status: WIRED (state displayed) | NOT_WIRED (state exists, not rendered)

### Step 6: Check Requirements Coverage

**6a.** Extract requirement IDs from PLAN frontmatter
**6b.** Cross-reference against FEATURE.md EU/FN/TC requirements
**6c.** Check for orphaned requirements (FEATURE.md has IDs no plan claims)

Requirement statuses:
- SATISFIED: Implementation evidence fulfills the requirement
- BLOCKED: No evidence or contradicting evidence
- NEEDS HUMAN: Cannot verify programmatically

### Step 7: Scan for Anti-Patterns

```bash
# TODO/FIXME/placeholder comments
grep -n -E "TODO|FIXME|XXX|HACK|PLACEHOLDER" "$file" 2>/dev/null
grep -n -E "placeholder|coming soon|will be here" "$file" -i 2>/dev/null

# Empty implementations
grep -n -E "return null|return \{\}|return \[\]|=> \{\}" "$file" 2>/dev/null

# Console.log only implementations
grep -n -B 2 -A 2 "console\.log" "$file" 2>/dev/null | grep -E "^\s*(const|function|=>)"
```

Severity: Blocker (prevents goal) | Warning (incomplete) | Info (notable)

### Step 8: Identify Human Verification Needs

Items needing human testing: visual appearance, user flow completion, real-time behavior, external service integration, performance feel, error message clarity.

Format:
```markdown
### 1. {Test Name}
**Test:** {What to do}
**Expected:** {What should happen}
**Why human:** {Why can't verify programmatically}
```

### Step 9: Determine Overall Status

| Status | Condition |
|--------|-----------|
| passed | All truths VERIFIED, all artifacts pass 3 levels, all key links WIRED, no blocker anti-patterns |
| gaps_found | One or more truths FAILED, artifacts MISSING/STUB, key links NOT_WIRED, or blocker anti-patterns |
| human_needed | All automated checks pass but items flagged for human verification |

Score: `verified_truths / total_truths`

### Step 10: Structure Gap Output

```yaml
gaps:
  - truth: "Observable truth that failed"
    status: failed
    reason: "Brief explanation"
    artifacts:
      - path: "src/path/to/file.tsx"
        issue: "What's wrong"
    missing:
      - "Specific thing to add/fix"
```

Group related gaps by concern to help the planner create focused fix plans.

---

## Stub Detection Patterns

### React Component Stubs

```javascript
// Red flags:
return <div>Component</div>
return <div>Placeholder</div>
return <div>{/* TODO */}</div>
return null
return <></>

// Empty handlers:
onClick={() => {}}
onChange={() => console.log('clicked')}
onSubmit={(e) => e.preventDefault()}  // Only prevents default
```

### API Route Stubs

```typescript
// Red flags:
export async function POST() {
  return Response.json({ message: "Not implemented" });
}

export async function GET() {
  return Response.json([]); // Empty array with no DB query
}
```

### Wiring Red Flags

```typescript
// Fetch exists but response ignored:
fetch('/api/messages')  // No await, no .then, no assignment

// Query exists but result not returned:
await prisma.message.findMany()
return Response.json({ ok: true })  // Returns static, not query result

// Handler only prevents default:
onSubmit={(e) => e.preventDefault()}

// State exists but not rendered:
const [messages, setMessages] = useState([])
return <div>No messages</div>  // Always shows "no messages"
```

---

## VERIFICATION.md Template

```markdown
---
phase: XX-name
verified: YYYY-MM-DDTHH:MM:SSZ
status: passed | gaps_found | human_needed
score: N/M must-haves verified
re_verification:
  previous_status: gaps_found
  previous_score: 2/5
  gaps_closed: []
  gaps_remaining: []
  regressions: []
gaps:
  - truth: "..."
    status: failed
    reason: "..."
    artifacts:
      - path: "..."
        issue: "..."
    missing:
      - "..."
human_verification:
  - test: "..."
    expected: "..."
    why_human: "..."
---

# Phase {X}: {Name} Verification Report

**Phase Goal:** {goal from FEATURE.md}
**Verified:** {timestamp}
**Status:** {status}

## Goal Achievement

### Observable Truths
| # | Truth | Status | Evidence |
|---|-------|--------|----------|

**Score:** {N}/{M} truths verified

### Required Artifacts
| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|

### Key Link Verification
| From | To | Via | Status | Details |
|------|----|----|--------|---------|

### Requirements Coverage
| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-----------|-------------|--------|----------|

### Anti-Patterns Found
| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|

### Human Verification Required
{Items needing human testing}

### Gaps Summary
{Narrative summary of what's missing and why}
```

---

## Verification Principles

- Do not trust SUMMARY.md claims. Verify against the actual codebase.
- Existence alone is insufficient. Check substantive content (Level 2) and wiring (Level 3).
- 80% of stubs hide in wiring -- pieces exist but are not connected.
- Structure gaps in YAML frontmatter for the gap-closure pipeline.
- Flag for human verification when uncertain (visual, real-time, external service).
- Keep verification fast -- use grep/file checks, not running the application.
- Do not commit. The orchestrator handles commit bundling.
