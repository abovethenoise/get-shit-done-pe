---
type: feature
capability: "install-and-deploy"
status: complete
created: "2026-03-03"
---

# package-identity

## Trace Table

| REQ | Research | Plan | Execute | Review | Docs | Status |
|-----|----------|------|---------|--------|------|--------|
| EU-01 | - | - | - | - | - | specified |
| EU-02 | - | - | - | - | - | specified |
| FN-01 | - | - | - | - | - | specified |
| FN-02 | - | - | - | - | - | specified |
| TC-01 | - | - | - | - | - | specified |

## End-User Requirements

### EU-01: Package installs under new identity

**Story:** As a user, I want to install `get-shit-done-pe` via npm/npx, so that I get the fork — not the upstream `get-shit-done-cc`.

**Acceptance Criteria:**

- [ ] `npx get-shit-done-pe --global` installs and deploys to ~/.claude
- [ ] `npm install -g get-shit-done-pe` works identically
- [ ] The `get-shit-done-pe` binary is available after global install
- [ ] Install banner shows fork identity (abovethenoise), not upstream (TÂCHES)

**Out of Scope:**

- Actual npm publish (manual action by author)
- GitHub repo creation (manual action)

### EU-02: Attribution credits original and fork author

**Story:** As a user (or upstream author), I want clear attribution in the package so that the lineage is transparent and respectful.

**Acceptance Criteria:**

- [ ] README credits TÂCHES/GSD as the upstream inspiration with appreciation
- [ ] README asserts the product-management pivot and abovethenoise's vision
- [ ] package.json author field shows abovethenoise
- [ ] License file present (MIT)

**Out of Scope:**

- Full README content beyond attribution section (follow-up)

## Functional Requirements

### FN-01: package.json field updates

**Receives:** Existing package.json with get-shit-done-cc identity.

**Returns:** Updated package.json with get-shit-done-pe identity.

**Behavior:**

- `name` → `get-shit-done-pe`
- `author` → `abovethenoise`
- `description` → Updated to reflect product-management focus + built on GSD by TÂCHES
- `repository.url` → `git+https://github.com/abovethenoise/get-shit-done-pe.git`
- `homepage` → `https://github.com/abovethenoise/get-shit-done-pe`
- `bugs.url` → `https://github.com/abovethenoise/get-shit-done-pe/issues`
- `bin` → `{ "get-shit-done-pe": "bin/install.js" }`
- `keywords` → updated for discoverability (keep claude, claude-code, ai; add product-management)
- `license` → MIT (unchanged)

### FN-02: Install banner update

**Receives:** bin/install.js banner string.

**Returns:** Updated banner reflecting fork identity.

**Behavior:**

- ASCII art text can stay or change — but subtitle must say `by abovethenoise` not `by TÂCHES`
- Version line remains dynamic from package.json
- Description line updated to match new package description direction

## Technical Specs

### TC-01: Static file edits

**Intent:** Pure find-and-replace in two files. No logic changes, no new code paths.

**Upstream:** Current package.json and bin/install.js banner.

**Downstream:** npm registry (after manual publish), install output (banner shown to users).

**Constraints:**

- package.json must remain valid JSON
- bin field key must match the desired CLI command name (`get-shit-done-pe`)
- Banner must fit within terminal width (~80 chars)

**Example:**

```json
{
  "name": "get-shit-done-pe",
  "bin": { "get-shit-done-pe": "bin/install.js" },
  "author": "abovethenoise",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/abovethenoise/get-shit-done-pe.git"
  }
}
```

## Decisions

- GitHub username: abovethenoise
- Package name: get-shit-done-pe
- Author: abovethenoise
- Attribution style: "Built on GSD by TÂCHES — reimagined with capability/feature model." Tone: show love and appreciation for upstream while confidently asserting the product-management-focused pivot (vs upstream's project-management approach). Include high-level details on how the approach was reimagined.
- Repo URL: github.com/abovethenoise/get-shit-done-pe
- License: MIT (matching upstream)
- Package description direction: Meta-prompting system optimized for product management insight and detailed capabilities — enhanced AI automation and agentic development. Focus on getting it right, not just advancing the project forward. Built on GSD by TÂCHES.
- npm account: user has one already; publish is a manual action
- Banner in install.js: needs updating from "by TÂCHES" to reflect fork identity
- Keywords: may need updating for discoverability
