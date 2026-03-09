<overview>
Plans execute autonomously. Checkpoints formalize interaction points where human verification or decisions are needed.

**Core principle:** Claude automates everything with CLI/API. Checkpoints are for verification and decisions, not manual work.

**Golden rules:**
1. **If Claude can run it, Claude runs it** - Never ask user to execute CLI commands, start servers, or run builds
2. **Claude sets up the verification environment** - Start dev servers, seed databases, configure env vars
3. **User only does what requires human judgment** - Visual checks, UX evaluation, "does this feel right?"
4. **Secrets come from user, automation comes from Claude** - Ask for API keys, then Claude uses them via CLI
5. **Auto-mode bypasses verification/decision checkpoints** — When `workflow.auto_advance` is true in config: human-verify auto-approves, decision auto-selects first option, human-action still stops (auth gates cannot be automated)
</overview>

<checkpoint_types>

## checkpoint:human-verify (90%)

**When:** Claude completed automated work, human confirms it works correctly.

**Use for:** Visual UI checks, interactive flows, functional verification, audio/video playback, animation, accessibility.

```xml
<task type="checkpoint:human-verify" gate="blocking">
  <what-built>[What Claude automated and deployed/built]</what-built>
  <how-to-verify>[Exact steps to test - URLs, commands, expected behavior]</how-to-verify>
  <resume-signal>[How to continue - "approved", "yes", or describe issues]</resume-signal>
</task>
```

## checkpoint:decision (9%)

**When:** Human must make choice that affects implementation direction.

**Use for:** Technology selection, architecture decisions, design choices, feature prioritization, data model decisions.

```xml
<task type="checkpoint:decision" gate="blocking">
  <decision>[What's being decided]</decision>
  <context>[Why this decision matters]</context>
  <options>
    <option id="option-a">
      <name>[Option name]</name>
      <pros>[Benefits]</pros>
      <cons>[Tradeoffs]</cons>
    </option>
  </options>
  <resume-signal>[How to indicate choice]</resume-signal>
</task>
```

## checkpoint:human-action (1% - Rare)

**When:** Action has NO CLI/API and requires human-only interaction, OR Claude hit an authentication gate.

**Use ONLY for:** Authentication gates (Claude tried CLI/API but needs credentials), email verification links, SMS 2FA codes, manual account approvals, credit card 3D Secure flows, OAuth app approvals.

**Do NOT use for:** Deploying (use CLI), creating webhooks/databases (use API/CLI), running builds/tests (use Bash), creating files (use Write).

```xml
<task type="checkpoint:human-action" gate="blocking">
  <action>[What human must do - Claude already did everything automatable]</action>
  <instructions>[What Claude already automated, the ONE thing requiring human action]</instructions>
  <verification>[What Claude can check afterward]</verification>
  <resume-signal>[How to continue]</resume-signal>
</task>
```

**Auth gates are created dynamically** when Claude encounters auth errors during automation — NOT pre-planned.

</checkpoint_types>

<execution_protocol>

When Claude encounters `type="checkpoint:*"`:

1. **Stop immediately** - do not proceed to next task
2. **Display checkpoint clearly** with progress, task name, type-specific content
3. **Wait for user response** - do not hallucinate completion
4. **Verify if possible** - check files, run tests, whatever is specified
5. **Resume execution** - continue to next task only after confirmation

</execution_protocol>

<automation_reference>

**The rule:** If it has CLI/API, Claude does it. Never ask human to perform automatable work.

## Service CLI Reference

| Service | CLI/API | Key Commands | Auth Gate |
|---------|---------|--------------|-----------|
| Vercel | `vercel` | `--yes`, `env add`, `--prod`, `ls` | `vercel login` |
| Railway | `railway` | `init`, `up`, `variables set` | `railway login` |
| Fly | `fly` | `launch`, `deploy`, `secrets set` | `fly auth login` |
| Stripe | `stripe` + API | `listen`, `trigger`, API calls | API key in .env |
| Supabase | `supabase` | `init`, `link`, `db push`, `gen types` | `supabase login` |
| Upstash | `upstash` | `redis create`, `redis get` | `upstash auth login` |
| PlanetScale | `pscale` | `database create`, `branch create` | `pscale auth login` |
| GitHub | `gh` | `repo create`, `pr create`, `secret set` | `gh auth login` |
| Node | `npm`/`pnpm` | `install`, `run build`, `test`, `run dev` | N/A |
| Xcode | `xcodebuild` | `-project`, `-scheme`, `build`, `test` | N/A |
| Convex | `npx convex` | `dev`, `deploy`, `env set`, `env get` | `npx convex login` |

## Environment Variable Automation

**Env files:** Use Write/Edit tools. Never ask human to create .env manually.

| Platform | CLI Command | Example |
|----------|-------------|---------|
| Convex | `npx convex env set` | `npx convex env set OPENAI_API_KEY sk-...` |
| Vercel | `vercel env add` | `vercel env add STRIPE_KEY production` |
| Railway | `railway variables set` | `railway variables set API_KEY=value` |
| Fly | `fly secrets set` | `fly secrets set DATABASE_URL=...` |
| Supabase | `supabase secrets set` | `supabase secrets set MY_SECRET=value` |

**Secret collection:** Ask user for the value via checkpoint:human-action, then Claude adds it via CLI.

## Dev Server Automation

| Framework | Start Command | Ready Signal | Default URL |
|-----------|---------------|--------------|-------------|
| Next.js | `npm run dev` | "Ready in" or "started server" | http://localhost:3000 |
| Vite | `npm run dev` | "ready in" | http://localhost:5173 |
| Convex | `npx convex dev` | "Convex functions ready" | N/A (backend only) |
| Express | `npm start` | "listening on port" | http://localhost:3000 |
| Django | `python manage.py runserver` | "Starting development server" | http://localhost:8000 |

**Port conflicts:** `lsof -ti:3000 | xargs kill` or use `--port 3001`.

## CLI Installation Handling

| CLI | Auto-install? | Command |
|-----|---------------|---------|
| npm/pnpm/yarn | No - ask user | User chooses package manager |
| vercel | Yes | `npm i -g vercel` |
| gh (GitHub) | Yes | `brew install gh` (macOS) or `apt install gh` (Linux) |
| stripe | Yes | `npm i -g stripe` |
| supabase | Yes | `npm i -g supabase` |
| convex | No - use npx | `npx convex` (no install needed) |
| fly | Yes | `brew install flyctl` or curl installer |
| railway | Yes | `npm i -g @railway/cli` |

**Protocol:** Try command → "command not found" → auto-installable? → yes: install silently, retry → no: checkpoint asking user to install.

## Automatable Quick Reference

| Action | Automatable? |
|--------|--------------|
| Deploy to Vercel/Railway/Fly | Yes (`vercel`/`railway up`/`fly deploy`) |
| Create Stripe webhook | Yes (API) |
| Write .env file | Yes (Write tool) |
| Create Upstash DB | Yes (`upstash`) |
| Run tests/builds | Yes (`npm test`/`npm run build`) |
| Start dev server | Yes (`npm run dev`) |
| Add env vars to platforms | Yes (platform CLIs) |
| Seed database | Yes (CLI/API) |
| Click email verification link | No |
| Enter credit card with 3DS | No |
| Complete OAuth in browser | No |
| Visually verify UI | No |

</automation_reference>

<writing_guidelines>

**DO:** Automate everything before checkpoint. Be specific (URLs, commands, expected outcomes). Number verification steps. Provide context.

**DON'T:** Ask human to do automatable work. Assume knowledge. Skip steps. Mix multiple verifications in one checkpoint.

**Placement:** After automation completes. After UI buildout. Before dependent work. At integration points.

**Never present a checkpoint with broken verification environment.** Fix first, then checkpoint.

</writing_guidelines>
