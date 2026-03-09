# Continuation Format

Standard format for presenting next steps after completing a command or workflow.

## Core Structure

```
---

## ▶ Next Up

**{identifier}: {name}** — {one-line description}

`{command to copy-paste}`

<sub>`/clear` first → fresh context window</sub>

---

**Also available:**
- `{alternative option 1}` — description
- `{alternative option 2}` — description

---
```

## Format Rules

1. **Always show what it is** — name + description, never just a command path
2. **Pull context from source** — ROADMAP.md for features, PLAN.md `<objective>` for plans
3. **Command in inline code** — backticks, easy to copy-paste, renders as clickable link
4. **`/clear` explanation** — always include, keeps it concise but explains why
5. **"Also available" not "Other options"** — sounds more app-like
6. **Visual separators** — `---` above and below to make it stand out

## Variants

### Execute Next Plan

```
---

## ▶ Next Up

**02-03: Refresh Token Rotation** — Add /api/auth/refresh with sliding expiry

`/gsd:execute Authentication`

<sub>`/clear` first → fresh context window</sub>

---

**Also available:**
- Review plan before executing

---
```

### Execute Final Plan in Feature

Add note that this is the last plan and what comes after:

```
---

## ▶ Next Up

**02-03: Refresh Token Rotation** — Add /api/auth/refresh with sliding expiry
<sub>Final plan in Authentication</sub>

`/gsd:execute Authentication`

<sub>`/clear` first → fresh context window</sub>

---

**After this completes:**
- Next feature ready for planning
- Next: **Core Features** — User dashboard and settings

---
```

### Plan a Feature

```
---

## ▶ Next Up

**Authentication** — JWT login flow with refresh tokens

`/gsd:plan Authentication`

<sub>`/clear` first → fresh context window</sub>

---

**Also available:**
- `/gsd:discuss Authentication` — gather context first
- `/gsd:research Authentication` — investigate unknowns
- Review roadmap

---
```

### Feature Complete, Ready for Next

Show completion status before next action:

```
---

## ✓ Authentication Complete

3/3 plans executed

## ▶ Next Up

**Core Features** — User dashboard, settings, and data export

`/gsd:plan Core Features`

<sub>`/clear` first → fresh context window</sub>

---

**Also available:**
- `/gsd:discuss Core Features` — gather context first
- `/gsd:research Core Features` — investigate unknowns
- Review what Authentication built

---
```

### Multiple Equal Options

When there's no clear primary action:

```
---

## ▶ Next Up

**Core Features** — User dashboard, settings, and data export

**To plan directly:** `/gsd:plan Core Features`

**To discuss context first:** `/gsd:discuss Core Features`

**To research unknowns:** `/gsd:research Core Features`

<sub>`/clear` first → fresh context window</sub>

---
```

### Milestone Complete

```
---

## 🎉 Milestone v1.0 Complete

All features shipped

## ▶ Next Up

**Start v1.1** — questioning → research → requirements → roadmap

`/gsd:init`

<sub>`/clear` first → fresh context window</sub>

---
```

## Pulling Context

### For features/capabilities (from ROADMAP.md):

```markdown
### Authentication
**Goal**: JWT login flow with refresh tokens
```

Extract: `**Authentication** — JWT login flow with refresh tokens`

### For plans (from PLAN.md):

```markdown
Plans:
- [ ] 02-03: Add refresh token rotation
```

Or from PLAN.md `<objective>`:

```xml
<objective>
Add refresh token rotation with sliding expiry window.

Purpose: Extend session lifetime without compromising security.
</objective>
```

Extract: `**02-03: Refresh Token Rotation** — Add /api/auth/refresh with sliding expiry`

## Anti-Patterns

### Don't: Command-only (no context)

```
## To Continue

Run `/clear`, then paste:
/gsd:execute Authentication
```

User has no idea what 02-03 is about.

### Don't: Missing /clear explanation

```
`/gsd:plan Core Features`

Run /clear first.
```

Doesn't explain why. User might skip it.

### Don't: "Other options" language

```
Other options:
- Review roadmap
```

Sounds like an afterthought. Use "Also available:" instead.

### Don't: Fenced code blocks for commands

```
```
/gsd:plan Core Features
```
```

Fenced blocks inside templates create nesting ambiguity. Use inline backticks instead.
