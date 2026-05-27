# General Rules of Contribution

These rules apply to every task in this project unless explicitly overridden.
Bias: caution over speed on non-trivial work. Use judgment on trivial tasks.

## Rule 1 — Think Before Coding

State assumptions explicitly. If uncertain, ask rather than guess.
Present multiple interpretations when ambiguity exists.
Push back when a simpler approach exists.
Stop when confused. Name what's unclear.

## Rule 2 — Simplicity First

Minimum code that solves the problem. Nothing speculative.
No features beyond what was asked. No abstractions for single-use code.
Test: would a senior engineer say this is overcomplicated? If yes, simplify.

## Rule 3 — Surgical Changes

Touch only what you must. Clean up only your own mess.
Don't "improve" adjacent code, comments, or formatting.
Don't refactor what isn't broken. Match existing style.

## Rule 4 — Goal-Driven Execution

Define success criteria. Loop until verified.
Don't follow steps. Define success and iterate.
Strong success criteria let you loop independently.

## Rule 5 — Use the model only for judgment calls

Use me for: classification, drafting, summarization, extraction.
Do NOT use me for: routing, retries, deterministic transforms.
If code can answer, code answers.

## Rule 6 — Token budgets are not advisory

Per-task: 4,000 tokens. Per-session: 30,000 tokens.
If approaching budget, summarize and start fresh.
Surface the breach. Do not silently overrun.

## Rule 7 — Surface conflicts, don't average them

If two patterns contradict, pick one (more recent / more tested).
Explain why. Flag the other for cleanup.
Don't blend conflicting patterns.

## Rule 8 — Read before you write

Before adding code, read exports, immediate callers, shared utilities.
"Looks orthogonal" is dangerous. If unsure why code is structured a way, ask.

## Rule 9 — Tests verify intent, not just behavior

Tests must encode WHY behavior matters, not just WHAT it does.
A test that can't fail when business logic changes is wrong.

## Rule 10 — Checkpoint after every significant step

Summarize what was done, what's verified, what's left.
Don't continue from a state you can't describe back.
If you lose track, stop and restate.

## Rule 11 — Match the codebase's conventions, even if you disagree

Conformance > taste inside the codebase.
If you genuinely think a convention is harmful, surface it. Don't fork silently.

## Rule 12 — Fail loud

"Completed" is wrong if anything was skipped silently.
"Tests pass" is wrong if any were skipped.
Default to surfacing uncertainty, not hiding it.

<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.

<!--VITE PLUS END-->

<!--WALLABY START-->

# Using Wallaby for Test Feedback

Wallaby runs continuously and gives near-instant test feedback. Prefer it over a fresh `vp test` run — results are already computed and streamed. There are two surfaces:

- **MCP tools** (`mcp__wallaby__*`) — use when Wallaby is alive in the editor. No process spawn, lowest latency.
- **Wallaby CLI** (`npx -y @wallabyjs/cli ...`) — May 2026 addition. Works headless, with no editor session and no MCP server. Use when MCP returns no data, when working in a worktree, or when you want a single Markdown report you can grep.

Docs: https://wallabyjs.com/docs/features/mcp/ (MCP tools) and https://wallabyjs.com/whatsnew/cli.html (CLI). The Wallaby `SKILL.md` is the canonical workflow.

## Workflow (in order)

1. **Get failures** — `mcp__wallaby__wallaby_failingTests`, or `npx -y @wallabyjs/cli run --skill` headless. The result includes test name, file, error, stack trace, and runtime logs.
2. **(Optional) Trace coverage** — `mcp__wallaby__wallaby_coveredLinesForTest` with the failing test's ID, only if step 1's stack trace doesn't make the cause obvious.
3. **(Optional) Inspect runtime values** — `mcp__wallaby__wallaby_runtimeValues` / `wallaby_runtimeValuesByTest`, or `npx -y @wallabyjs/cli inspect "{path:'src/x.ts',location:{fragment:'...'},expression:'...'}"` headless. Skip if the cause is already clear.
4. **Fix the code.**
5. **Verify** — re-run step 1 to confirm the fix and check for regressions. `wallaby_testById` works for a single targeted check.
6. **(Snapshots)** — `wallaby_updateTestSnapshots` / `wallaby_updateFileSnapshots` (preferred) or `--snapshots` on the CLI. Only when the change is intentional.

## CLI specifics

- Always pass `--skill` to `run` — it keeps the Wallaby instance alive between invocations so follow-up calls reuse cached results.
- `run` with no args reports the whole project; pass test file paths to scope to specific files.
- Reports are Markdown with named sections (`Failing Tests`, `All Tests`, `Coverage`, `Runtime Values`). For large reports, `grep -Pzo` for specific tests or files instead of reading the whole file.
- Non-zero exit code usually means failing tests, but can also mean CLI/Wallaby itself failed — check the report's `Fatal Error` / `Global Errors` sections.
- `npx -y @wallabyjs/cli run --update` updates Wallaby if the CLI reports a compatibility error.

## Rules

- Prefer Wallaby (MCP or CLI) over `vp test` for read-only inspection. Both produce correct results; Wallaby is faster.
- A clean Wallaby report ≡ a clean `vp test` run. Trust it.
- If MCP returns `<No data available>`, Wallaby is restarting; fall back to `npx -y @wallabyjs/cli run --skill` rather than `vp test` — same source of truth, headless.
- Never call `wallaby_updateProjectSnapshots`/`--snapshots` (without a path) casually — it rewrites every snapshot. Prefer file-scoped or test-scoped variants.

<!--WALLABY END-->
