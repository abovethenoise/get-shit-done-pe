---
type: feature
capability: "install-and-deploy"
status: complete
created: "2026-03-03"
---

# auto-latest

## Trace Table

| REQ | Research | Plan | Execute | Review | Docs | Status |
|-----|----------|------|---------|--------|------|--------|
| EU-01 | - | - | - | - | - | specified |
| FN-01 | - | - | - | - | - | specified |
| FN-02 | - | - | - | - | - | specified |
| FN-03 | - | - | - | - | - | specified |
| TC-01 | - | - | - | - | - | specified |

## End-User Requirements

### EU-01: GSD always runs the latest version

**Story:** As a user, I want GSD to automatically update itself when I start a Claude Code session, so that I always have the latest features and fixes without running any commands.

**Acceptance Criteria:**

- [ ] After initial install, user never needs to manually update
- [ ] Updates happen silently on session start (no prompts, no output)
- [ ] If update fails (network, npm, install error), current version continues working
- [ ] npm is not hit more than once per 24 hours

**Out of Scope:**

- Rollback to previous versions
- Changelog display after update
- Pinning to a specific version

## Functional Requirements

### FN-01: Version check against npm registry

**Receives:** Session start trigger (hook fires).

**Returns:** Boolean: newer version available (true/false), or skip (if throttled or network fails).

**Behavior:**

- Read last-check timestamp from cache file
- If less than 24 hours since last check: skip (return false)
- Query npm registry for latest version of `get-shit-done-pe`
- Compare against currently installed version (from local package.json)
- If newer version exists: return true
- If network fails or npm errors: return false (silent skip)
- Update last-check timestamp on successful check

### FN-02: Silent auto-update

**Receives:** Version check returns true (newer version available).

**Returns:** Updated installation, or silent fallback to current version.

**Behavior:**

- Run `npx get-shit-done-pe@latest --global` in background
- If install succeeds: new version active for next session (current session continues with old version)
- If install fails: log error to cache/debug file, continue with current version
- No terminal output to user in either case

### FN-03: Throttle cache

**Receives:** Version check requests.

**Returns:** Whether a check should proceed or be skipped.

**Behavior:**

- Store last-check timestamp in a cache file (e.g., `~/.claude/get-shit-done/.update-check`)
- On session start: read timestamp, compare to current time
- If < 24 hours: skip check entirely (no network call)
- If >= 24 hours or file missing: proceed with check
- Update timestamp after successful npm query (not after skip)

## Technical Specs

### TC-01: Session-start update hook

**Intent:** Use Claude Code's hook system to trigger version checks on session start without user intervention.

**Upstream:** npm registry (version query), local package.json (current version).

**Downstream:** bin/install.js (runs if update needed), cache file (throttle state).

**Constraints:**

- Hook must be non-blocking — session must not wait for npm check to complete
- Must work on macOS and Linux (Node.js child_process)
- npm registry query must have a short timeout (e.g., 5 seconds) to avoid hanging
- Cache file location: `~/.claude/get-shit-done/.update-check` (JSON with `lastCheck` timestamp and `currentVersion`)
- The update installs for the *next* session — current session uses whatever was loaded at startup
- Hook registration handled by install.js (same pattern as existing hooks)

**Example:**

```json
// ~/.claude/get-shit-done/.update-check
{
  "lastCheck": "2026-03-03T12:00:00Z",
  "currentVersion": "2.1.0"
}
```

```
Session start
  → hook fires
  → read .update-check → last check 2h ago → skip
  → session proceeds normally

Session start (next day)
  → hook fires
  → read .update-check → last check 25h ago → check npm
  → npm says 2.2.0, local is 2.1.0 → run update in background
  → session proceeds with 2.1.0, next session gets 2.2.0
```

## Decisions

- Auto-update on session start, not on every command invocation
- Throttled to once per 24 hours to avoid unnecessary npm hits
- Silent on all failures — never interrupt the user's session
- Update applies to next session, not current (avoids mid-session state changes)
- No user prompt before updating — fully automatic
- Uses existing hook registration pattern from install.js
- Depends on package-identity (must be published to npm as get-shit-done-pe)
