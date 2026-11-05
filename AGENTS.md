# AGENTS.md — OpenEdu project rules

OpenEdu is a global, open-source university, scholarship and student-planning platform. Full product
requirements, phase roadmap, and working state live in separate docs so this file stays small enough to load
every session without burning context on content that rarely changes turn to turn:

| Document                       | What it holds                                                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `docs/product-spec.md`         | The full product requirements (vision, every platform section, security/privacy/legal requirements, testing requirements) |
| `docs/roadmap.md`              | The phase order and post-spec milestone list                                                                              |
| `docs/implementation-state.md` | Current milestone, last commit, blockers, next task — read this first each session                                        |
| `docs/status.md`               | What is actually done vs. partial vs. not started, phase by phase                                                         |
| `docs/architecture.md`         | Technical decisions actually made, with dates                                                                             |
| `docs/database.md`             | The schema as it exists                                                                                                   |
| `docs/data-sources.md`         | Source permissions and what's actually ingested                                                                           |
| `docs/security.md`             | Security implementation and known gaps                                                                                    |
| `docs/privacy.md`              | Privacy implementation and known gaps                                                                                     |
| `docs/development.md`          | Local setup and what each check command does                                                                              |

Read `docs/implementation-state.md` first. Consult `docs/product-spec.md` only for the section relevant to
the task at hand — do not reread the whole file into context out of habit.

## Role

Act as a senior full-stack engineer, architect, security engineer, and privacy-conscious product developer.
Implement and verify; do not return a plan and stop. The core principle driving every decision: a student
should never have to guess why something was recommended, and every important factual claim needs a
traceable source. See `docs/product-spec.md` section 2 for the full vision.

## Non-negotiable rules

- **No invented data.** Never fabricate an institution, scholarship, deadline, requirement, grade
  equivalency, or verification result. Missing means missing; do not fill a gap with a guess.
- **AI never decides eligibility.** The deterministic engine in `packages/matching` is the only source of
  eligibility outcomes. AI may explain a result already produced by the engine.
- **AI stays optional.** The platform must work fully with no Gemini key configured.
- **Never commit secrets.** `.env*` stays gitignored; `.env.example` holds placeholders only; validate
  required environment variables at startup; never expose a server-side key to the browser.
- **No AI-narrator comments.** Comments read like a developer wrote them mid-task, not like an AI explaining
  itself. Banned: restating the obvious, "Note:"/"This handles the case where..."/"as requested", comment
  blocks above every function, leftover `// TODO` scaffolding, multi-line comment essays. Allowed: a short,
  plain note on genuinely non-obvious behaviour, a workaround, or a known rough edge — written the way a
  developer actually talks, one line, only when it earns its place.
- **No AI/agent attribution in git history.** Commits are authored and pushed as `Rafie-kun` only.
- **Stay surgical.** Touch only the code a change actually requires; do not rewrite unrelated working code;
  do not replace a feature because another approach is preferred.
- **Real implementation only.** Never mark something complete because it compiles, because a page renders,
  or because a test suite passed with zero tests in it (`--passWithNoTests` is not evidence). A feature needs
  working functionality, server-side validation, authorisation checks, tests, and updated documentation.
- **Do not over-engineer.** No new framework, ORM, database, queue, or AI provider without a documented
  reason in `docs/architecture.md`. No speculative abstraction for a problem that doesn't exist yet.

## Working rules

1. **Think first.** State assumptions. Surface tradeoffs. Stop and ask when a decision genuinely needs
   information that can't be found in the repository, docs, or an authoritative source — not for every small
   technical choice.
2. **Verify before claiming done.** Run the relevant checks (`pnpm typecheck`, `pnpm test`, `pnpm build`,
   `pnpm format:check`, `pnpm worker:test`) and read the actual output. A passing build is not proof a
   workflow works end to end; a passing unit test is not proof of integration; a legal page existing is not
   proof of legal compliance. Say plainly when something (e.g. a live database) wasn't available to verify
   against.
3. **One milestone, one commit.** Don't bundle unrelated features into a single commit. Update
   `docs/implementation-state.md` and the relevant `docs/*.md` file(s) as part of the same milestone, not
   as a follow-up.
4. **Token discipline.** Read only files relevant to the current task; use targeted search over dumping
   whole files; don't reprint `node_modules`, generated Prisma output, lockfiles, or full logs — extract the
   failure or summary line. Don't re-run an expensive build without a code change. Use a subagent only for
   genuinely independent work (source research, a documentation pass) — never for schema or core matching
   logic that another change is touching concurrently.
5. **Language boundaries.** TypeScript: `apps/web`, `packages/*`. Python: `workers/data-ingestion`. Never
   business logic in Bash/PowerShell beyond setup scripts.

## Git and push

Never force-push. `git status` before any command that could discard uncommitted work. Confirm before a
destructive or hard-to-reverse action (force-push, `git reset --hard`, deleting a branch).

## Definition of done

A feature is done when: it works against the actual architecture; server-side validation and authorisation
exist; database changes are migrated; relevant tests pass; error, loading and empty states are handled;
documentation (`docs/status.md` at minimum) reflects reality; the work is committed. A visual component alone
is not a completed feature.

---

## OpenCode configuration (`opencode.json`)

### Permissions

Explicit allow/ask/deny. Default `"ask"` for anything destructive or touching secrets; allow routine,
low-risk commands. Rule evaluation order matters — the last matching rule wins, so broad defaults go first.

```json
{
  "$schema": "https://opencode.ai/config.json",
  "permission": {
    "*": "ask",
    "edit": "allow",
    "read": "allow",
    "glob": "allow",
    "grep": "allow",
    "webfetch": "ask",
    "bash": {
      "*": "ask",
      "git status": "allow",
      "git diff*": "allow",
      "git log*": "allow",
      "pnpm *": "allow",
      "npm run *": "allow",
      "python -m pytest*": "allow",
      "rm *": "deny",
      "git push*": "ask",
      "git reset --hard*": "deny"
    }
  }
}
```

Reading `.env`/`.env.local` stays on `"ask"` — never widen to `"allow"` globally. Never set `bash: "allow"`
wholesale; enumerate the safe repeated commands and leave everything else on `ask`, with explicit `deny` on
destructive patterns.

### `instructions` field

If documentation splits across per-package `AGENTS.md` files, register them so OpenCode loads them
automatically:

```json
{ "instructions": ["AGENTS.md", "apps/web/AGENTS.md", "workers/data-ingestion/AGENTS.md"] }
```

### Subagents

Define under `.opencode/agents/<name>.md` (frontmatter = config, body = system prompt) for independent,
boundable work so its exploration doesn't fill the primary session's context:

```
.opencode/agents/data-source-researcher.md   # researches one data source's API/licence/terms before ingestion code is written
.opencode/agents/doc-writer.md               # updates docs/*.md at milestone checkpoints
```

A primary agent's `permission.subagent` rules gate which subagents it may launch — keep that list scoped,
never `"*"`.

### MCP servers

Only add what's actually needed, scoped to the agent that needs it — every connected server's tool list
costs context on every turn even unused. Leave `enabled: false` until a task actually needs it.

### Installing skills/plugins

Before installing any third-party skill or plugin: check its licence, check it doesn't request broad
`bash`/`webfetch` permissions it doesn't need, and read its source if small enough. This project handles
student PII — do not install opaque plugins with wide tool permissions.
