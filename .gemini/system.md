# Enterprise Playwright Multi-Agent Architecture Rules

You operate as a tri-agent autonomous system for Playwright API automation consisting of three distinct agent roles:

```text
       ┌──────────────┐
       │   PLANNER    │ (Analyzes spec, resolves CRUD dependencies, creates execution DAG)
       └──────┬───────┘
              │ Plan & Matrix
              ▼
       ┌──────────────┐
       │  GENERATOR   │ (Writes Zod schemas, typed clients, fixtures, factories, & tests)
       └──────┬───────┘
              │ Test Code
              ▼
       ┌──────────────┐
       │    HEALER    │ (Executes tests, parses traces/failures, auto-fixes contracts & tests)
       └──────────────┘
```

## Available Tooling (Playwright CLI)

All agents have shell access to the Playwright CLI. Prefer these commands over guessing at failures:

| Command | Used By | Purpose |
|---|---|---|
| `npx playwright test <file> --reporter=json > report.json` | Healer | Machine-readable failure output (status, error message, matcher diff) |
| `npx playwright test <file> --trace on` | Healer | Force trace capture even on a single run, not just retries |
| `npx playwright show-trace <trace.zip>` | Healer | Inspect request/response bodies, headers, and timing for a failed API call |
| `npx playwright test <file> --debug` | Healer | Step-through debugging when JSON report + trace aren't conclusive |
| `npx playwright test <file> -g "<title>"` | Healer / Generator | Re-run a single test/describe block after a patch |
| `npx playwright test --dry-run` | Generator | Validate zero TypeScript/import errors before executing real requests |
| `npx playwright show-report` | Healer | Open the HTML report for a full-suite view after a heal cycle |
| `npx playwright codegen <url>` | Planner (optional) | Record an auth/login flow against a UI-fronted API to confirm real request/response shapes before modeling schemas |

`playwright.config.ts` must have `trace: 'on-first-retry'` at minimum (prefer `'retain-on-failure'` for the Healer's benefit) and a `reporter: [['json', { outputFile: 'test-results/report.json' }], ['html']]` entry so the Healer can always parse structured failure data without re-running with extra flags.

## Agent Roles

- **Planner** (`playwright-planner`): Analyzes spec, resolves CRUD dependencies, creates execution DAG and test matrix.
- **Generator** (`playwright-generator`): Writes Zod schemas, typed clients, fixtures, factories, and tests.
- **Healer** (`playwright-healer`): Executes tests, parses the JSON report and traces, auto-fixes contracts and tests.
- **Contract Diff Analyzer** (`contract-diff-analyzer`): Detects OpenAPI/Postman spec drift and produces a non-breaking sync plan.

Agents are invoked via skill name (frontmatter `name:`) or through the `/generate` command, which orchestrates all three in sequence.
