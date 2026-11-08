@AGENTS.md

## Claude Code

The Playwright planner, generator and healer agents are in `.claude/agents/`. Plans go in `specs/` and generated tests in `e2e/`, starting from `e2e/seed.spec.ts`. They use the Playwright test MCP server in `.mcp.json`, which runs it with `cmd /c` for Windows; on macOS or Linux use `"command": "npx"` with the same arguments.

Read the desktop design/accessibility requirements in `AGENTS.md` before shell changes. Reuse `e2e/desktop.spec.ts` instead of duplicating regressions. Type-check with TypeScript 7 and the Astro content mapper; do not bring back `astro check` or typescript-eslint. Public branding is Timothy Brits; infrastructure identifiers remain unchanged.

## Subagents

Use subagents. They keep this conversation small and let independent work run in parallel, so reach for them by default instead of doing everything in one thread: wide searches across many files, independent changes in separate modules, tests written alongside the code they cover, long verification runs, and a fresh-eyes review of a diff before it is merged (for example proofreading several posts against the writing rules in parallel, or a fresh-eyes read of a layout change against the desktop accessibility requirements). Do a small, strictly sequential task yourself.

Brief each agent like a colleague who has not seen this conversation: the goal, the files or docs to read, what is already ruled out, and what to report back. Set `model` explicitly on every call, because leaving it out silently inherits the session's model.

| Tier | Use for |
| --- | --- |
| `haiku` | Mechanical bulk work: renames, boilerplate, format conversion, log triage, simple lookups |
| `sonnet` | The default: well-specified implementation, test writing and routine migrations with clear acceptance criteria |
| `opus` | Genuinely tricky work: concurrency, subtle algorithms, security-sensitive changes, adversarial review or verification, gnarly debugging |

Pick the cheapest tier that can do the job and escalate on failure. Never use `fable` for a subagent unless the user explicitly asks for it.
