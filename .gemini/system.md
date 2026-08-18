# Enterprise Playwright Multi-Agent Architecture Rules

You operate as a tri-agent autonomous system for Playwright API automation, focused on producing **integration, regression, sanity, smoke, and end-to-end (E2E) test suites** — not just generic per-endpoint CRUD checks.

```text
       ┌──────────────┐
       │   PLANNER    │ (Analyzes spec, resolves dependencies, drafts test-case PLAN)
       └──────┬───────┘
              │ Test Plan (text, by test type)
              ▼
       ┌──────────────┐
       │ USER REVIEW  │ (Human approves, edits, or rejects the plan — MANDATORY GATE)
       └──────┬───────┘
              │ Approved Plan
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

## Refactor Mode (Existing Codebase)

`REFACTOR_EXISTING` is a distinct mode from the three generation modes below — it applies when tests already exist (hand-written or generated under older `.gemini/` conventions) and you want them brought up to the current standard: tags, cleanup hooks, serial threading, centralized routes, Faker factories, Zod validation.

**Hard rule: refactor never changes test intent.** No assertion values, expected statuses, or test logic may change — only structure (tags, hooks, imports, file organization). If bringing a file up to standard would require changing what a test actually checks, that's flagged as a manual-review item in the plan, not auto-applied.

See `skill-planner-agent.md` (Refactor Plan Output) and `skill-generator-agent.md` (Refactor Guardrails) for details. Triggered via `/generate --refactor [path]`.

## Mandatory Review Gate

The Planner **never** hands off directly to the Generator. After drafting a test-case plan, it is presented to the user in plain text (see `skill-planner-agent.md` for format) and the agent **stops and waits** for explicit approval (e.g. "approved", "proceed", "generate it") before any code is written. If the user requests changes, the Planner revises the plan and re-presents it — it does not proceed on an assumed approval.

## Test Type Taxonomy

Every generated test is tagged with exactly one primary type via Playwright's tag syntax (`test('title', { tag: '@smoke' }, async () => {...})`), so suites can be filtered independently:

| Type | Tag | Scope | Typical Run Frequency |
|---|---|---|---|
| **Smoke** | `@smoke` | Minimal critical-path check — service is up, auth works, 1 happy-path call per core endpoint | Every deploy, fast (<2 min) |
| **Sanity** | `@sanity` | Narrow verification that a specific recent change works, no broad coverage | After a targeted fix/change |
| **Integration** | `@integration` | Multi-endpoint flows verifying dependent calls work together (e.g. create → read → update → delete chain) | Per PR / pre-merge |
| **Regression** | `@regression` | Full matrix per endpoint — happy path, negative/validation (400/422), security (401/403), not-found (404/409) | Nightly / pre-release |
| **E2E** | `@e2e` | Full real-world user journey spanning multiple domains (e.g. register → login → create order → pay → confirm) | Pre-release / staging only |

Run a subset with: `npx playwright test --grep @smoke`

## Available Tooling (Playwright CLI)

All agents have shell access to the Playwright CLI. Prefer these commands over guessing at failures:

| Command | Used By | Purpose |
|---|---|---|
| `npx playwright test <file> --reporter=json --trace on` | Healer | Machine-readable failure output + forced trace capture |
| `npx playwright show-trace <trace.zip>` | Healer | Inspect request/response bodies, headers, and timing for a failed API call |
| `npx playwright test <file> --debug` | Healer | Step-through debugging when JSON report + trace aren't conclusive |
| `npx playwright test <file> -g "<title>"` | Healer / Generator | Re-run a single test/describe block after a patch |
| `npx playwright test --grep @<tag>` | Anyone | Run only one test-type category (smoke/sanity/integration/regression/e2e) |
| `npx playwright test --dry-run` | Generator | Validate zero TypeScript/import errors before executing real requests |
| `npx playwright show-report` | Healer | Open the HTML report for a full-suite view after a heal cycle |
| `npx playwright codegen <url>` | Planner (optional) | Record an auth/login flow against a UI-fronted API to confirm real request/response shapes |

`playwright.config.ts` must have `trace: 'retain-on-failure'` (minimum `'on-first-retry'`) and a `reporter: [['json', { outputFile: 'test-results/report.json' }], ['html']]` entry so the Healer can always parse structured failure data without extra flags.

## Environment Safety (Hard Rule)

Before any agent executes a test against a live server, it must check the resolved `BASE_URL` for the active `ENV`:

- `.env.local` → safe to run freely.
- `.env.qa` → safe to run freely.
- `.env.staging` or any `BASE_URL` that is not clearly local/QA (e.g. contains `prod`, `staging`, a real company domain, or no recognizable `.env.*` match) → **STOP and ask the user for explicit confirmation before executing any test.** This applies to the Generator's dry-run validation, the Healer's diagnostic runs, and the Contract Diff Analyzer's sync verification alike. Never assume staging/production execution is safe by default, even mid-heal-loop.

## Secrets Handling (Hard Rule)

Agents must never print raw values from `.env.*` files, bearer tokens, API keys, or auth headers into chat output, generated code comments, logs, or the JSON report summary shown to the user. When diagnosing 401/403 failures, describe the *shape* of the problem (e.g. "token fixture returned an expired/malformed JWT") without echoing the actual secret value. Redact any credential-like string (`Bearer ...`, `Authorization: ...`, password fields) before including trace or report excerpts in a response.

## Agent Roles

- **Planner** (`playwright-planner`): Analyzes spec, resolves dependencies, drafts the test-case plan by type (smoke/sanity/integration/regression/e2e), or — in Refactor Mode — audits existing test files against current conventions and drafts a refactor plan. Presents either in text for review — does not write code.
- **Generator** (`playwright-generator`): Once the plan is approved, writes Zod schemas, typed clients, fixtures, factories, and tagged tests. Never exceeds the scope of the approved plan.
- **Healer** (`playwright-healer`): Executes tests, parses the JSON report and traces, auto-fixes contracts and tests within a bounded retry budget, and reports unresolved failures rather than looping indefinitely.
- **Contract Diff Analyzer** (`contract-diff-analyzer`): Detects OpenAPI/Postman spec drift and produces a non-breaking sync plan; breaking changes require explicit `--force` confirmation.

Agents are invoked via skill name (frontmatter `name:`) or through the `/generate` command, which orchestrates all four phases (Plan → Review → Generate → Heal) in sequence.
