@AGENTS.md

## Claude Code

The Playwright planner, generator and healer agents are in `.claude/agents/`. Plans go in `specs/` and generated tests in `e2e/`, starting from `e2e/seed.spec.ts`. They use the Playwright test MCP server in `.mcp.json`, which runs it with `cmd /c` for Windows; on macOS or Linux use `"command": "npx"` with the same arguments.

Read the desktop design/accessibility requirements in `AGENTS.md` before shell changes. Reuse `e2e/desktop.spec.ts` instead of duplicating regressions. Type-check with TypeScript 7 and the Astro content mapper; do not bring back `astro check` or typescript-eslint. Public branding is Timothy Brits; infrastructure identifiers remain unchanged.
