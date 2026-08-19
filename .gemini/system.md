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
       │  GENERATOR   │ (Writes JSON Schemas (AJV), typed clients, fixtures, factories, & tests)
       └──────┬───────┘
              │ Test Code
              ▼
       ┌──────────────┐
       │    HEALER    │ (Executes tests, parses traces/failures, auto-fixes contracts & tests)
       └──────────────┘
```

## Refactor Mode (Existing Codebase)

`REFACTOR_EXISTING` is a distinct mode from the three generation modes below — it applies when tests already exist (hand-written or generated under older `.gemini/` conventions) and you want them brought up to the current standard: tags, cleanup hooks, serial threading, centralized routes, Faker factories, AJV/JSON Schema validation.

**Hard rule: refactor never changes test intent.** No assertion values, expected statuses, or test logic may change — only structure (tags, hooks, imports, file organization). If bringing a file up to standard would require changing what a test actually checks, that's flagged as a manual-review item in the plan, not auto-applied.

See `skill-planner-agent.md` (Refactor Plan Output) and `skill-generator-agent.md` (Refactor Guardrails) for details. Triggered via `/generate --refactor [path]`.

## Mandatory Review Gate

The Planner **never** hands off directly to the Generator. After drafting a test-case plan, it is presented to the user in plain text (see `skill-planner-agent.md` for format) and the agent **stops and waits** for explicit approval (e.g. "approved", "proceed", "generate it") before any code is written. If the user requests changes, the Planner revises the plan and re-presents it — it does not proceed on an assumed approval.

## Test Type Taxonomy

Every generated test is tagged with exactly one primary type via Playwright's tag syntax (`test('title', { tag: '@smoke' }, async () => {...})`), so suites can be filtered independently:

| Type            | Tag            | Scope                                                                                                                                                    | Typical Run Frequency       |
| --------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| **Smoke**       | `@smoke`       | Minimal critical-path check — service is up, auth works, 1 happy-path call per core endpoint                                                             | Every deploy, fast (<2 min) |
| **Sanity**      | `@sanity`      | Narrow verification that a specific recent change works, no broad coverage                                                                               | After a targeted fix/change |
| **Integration** | `@integration` | Multi-endpoint flows verifying dependent calls work together (e.g. create → read → update → delete chain)                                                | Per PR / pre-merge          |
| **Regression**  | `@regression`  | Full matrix per endpoint — happy path, negative/validation (400/422), not-found (404/409)                                                                | Nightly / pre-release       |
| **Security**    | `@security`    | Auth boundaries (401/403), JWT tampering, IDOR (can user A reach user B's resource by ID), basic injection payloads in string fields, CORS/header checks | Nightly / pre-release       |
| **E2E**         | `@e2e`         | Full real-world user journey spanning multiple domains (e.g. register → login → create order → pay → confirm)                                            | Pre-release / staging only  |

Run a subset with: `npx playwright test --grep @smoke`. See `.github/workflows/playwright-tests.yml` for how each tag maps to a CI trigger (push → smoke, nightly schedule → regression + security, release/manual dispatch → e2e).

## Available Tooling (Playwright CLI)

All agents have shell access to the Playwright CLI. Prefer these commands over guessing at failures:

| Command                                                 | Used By            | Purpose                                                                                    |
| ------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------ |
| `npx playwright test <file> --reporter=json --trace on` | Healer             | Machine-readable failure output + forced trace capture                                     |
| `npx playwright show-trace <trace.zip>`                 | Healer             | Inspect request/response bodies, headers, and timing for a failed API call                 |
| `npx playwright test <file> --debug`                    | Healer             | Step-through debugging when JSON report + trace aren't conclusive                          |
| `npx playwright test <file> -g "<title>"`               | Healer / Generator | Re-run a single test/describe block after a patch                                          |
| `npx playwright test --grep @<tag>`                     | Anyone             | Run only one test-type category (smoke/sanity/integration/regression/e2e)                  |
| `npx playwright test --dry-run`                         | Generator          | Validate zero TypeScript/import errors before executing real requests                      |
| `npx playwright show-report`                            | Healer             | Open the HTML report for a full-suite view after a heal cycle                              |
| `npx playwright codegen <url>`                          | Planner (optional) | Record an auth/login flow against a UI-fronted API to confirm real request/response shapes |

`playwright.config.ts` must have `trace: 'retain-on-failure'` (minimum `'on-first-retry'`) and a `reporter: [['json', { outputFile: 'test-results/report.json' }], ['html']]` entry so the Healer can always parse structured failure data without extra flags.

## Environment Safety (Hard Rule)

Before any agent executes a test against a live server, it must check the resolved `BASE_URL` for the active `ENV`:

- `.env.local` → safe to run freely.
- `.env.qa` → safe to run freely.
- `.env.staging` or any `BASE_URL` that is not clearly local/QA (e.g. contains `prod`, `staging`, a real company domain, or no recognizable `.env.*` match) → **STOP and ask the user for explicit confirmation before executing any test.** This applies to the Generator's dry-run validation, the Healer's diagnostic runs, and the Contract Diff Analyzer's sync verification alike. Never assume staging/production execution is safe by default, even mid-heal-loop.

## No Unfalsifiable Tests (Hard Rule)

A test that cannot fail is worse than no test — it creates false confidence. This applies to every agent that writes or edits test code (Generator, Healer, refactor mode):

- Assert the single expected outcome from the approved plan, never a list of acceptable outcomes (`expect([200, 400, 500]).toContain(...)`).
- Never wrap an assertion in a `try/catch` that swallows the error and asserts a tautology (`catch { expect(true).toBe(true) }`).
- If the correct expected outcome is genuinely unclear, stop and ask — do not generate a hedge to avoid a red test. A failing-but-honest test beats a passing-but-meaningless one.

See `skill-generator-agent.md` (Forbidden Patterns) and `skill-healer-agent.md` (Guardrails) for the full list.

## Secrets Handling (Hard Rule)

Agents must never print raw values from `.env.*` files, bearer tokens, API keys, or auth headers into chat output, generated code comments, logs, or the JSON report summary shown to the user. When diagnosing 401/403 failures, describe the _shape_ of the problem (e.g. "token fixture returned an expired/malformed JWT") without echoing the actual secret value. Redact any credential-like string (`Bearer ...`, `Authorization: ...`, password fields) before including trace or report excerpts in a response.

## Manual Version Control / No Auto-Push (Hard Rule)

Agents must **NEVER** automatically execute `git push` or `git commit` after generating, refactoring, or healing tests.

- All pipeline phases (Plan → Review → Generate → Heal) complete locally upon test execution & verification (`npx playwright test`).
- Code changes must remain in the local working directory.
- `git commit` and `git push` commands must **ONLY** be executed when the user explicitly requests it in chat (e.g., "commit the changes", "push the code to github").

## Suite-Level Circuit Breaker (Hard Rule)

The Healer's 3-attempt retry budget is per-test, but a whole-environment outage (service down, DB unreachable, expired shared test credentials) causes many unrelated tests to fail at once — patching them individually wastes attempts and burns time diagnosing symptoms of the same root cause. Before starting the patch loop:

- If **more than 30% of tests in the run fail on the first pass**, stop patching individual tests. Instead, inspect 2-3 of the failures for a shared root cause (same error type, same status code, same timeout pattern) and report it as a likely environment-level issue requiring the user's attention, rather than proceeding to heal each test independently.
- Only fall through to the normal per-test diagnosis loop once the failure rate is below this threshold, or once the user confirms the environment is genuinely fine and the failures are unrelated.

## Traceability & Governance

- **Changelog on sync**: every `--sync` / `--sync --force` run appends a dated entry to `CHANGELOG.md` (created if absent) summarizing what changed — see `skill-contract-diff.md`.
- **Unresolved-test report**: any test the Healer can't fix within its retry budget is written to `test-results/unresolved.md` (test name, attempt count, last diagnosis, trace path) in addition to being mentioned in chat, so it's trackable across sessions — see `skill-healer-agent.md`.
- **Human-readable test case docs**: every generated `src/tests/[domain].spec.ts` has a companion `docs/test-cases/[domain].test-cases.md` — see `skill-generator-agent.md` (Human-Readable Test Case Doc).
- **Contract reference doc**: `docs/contracts.md` is kept in sync with the JSON Schemas whenever they change — see `skill-generator-agent.md` (Contract Reference Doc).

## CI Integration

`.github/workflows/playwright-tests.yml` (or your CI's equivalent) should trigger tag-scoped runs rather than the full suite every time:

- On push / PR → `@smoke` (fast feedback)
- Nightly schedule → `@regression` + `@security` + `@integration`
- On release / manual dispatch → `@e2e`

This is infrastructure, not per-domain generated code — the agents don't regenerate this file on every `/generate` run, but `FULL_GENERATION` mode should scaffold it once if it doesn't already exist in the repo.

## Global Setup/Teardown

Per-test `afterEach` cleanup (see Generator) handles resources a single test creates. For suite-wide reference data every test depends on (e.g. a seeded admin account, a base currency config), use Playwright's `globalSetup`/`globalTeardown` in `playwright.config.ts` pointing at `src/global-setup.ts` / `src/global-teardown.ts`, rather than repeating the same setup call at the top of every domain spec.

## Agent Roles

- **Planner** (`playwright-planner`): Analyzes spec, resolves dependencies, drafts the test-case plan by type (smoke/sanity/integration/regression/e2e), or — in Refactor Mode — audits existing test files against current conventions and drafts a refactor plan. Presents either in text for review — does not write code.
- **Generator** (`playwright-generator`): Once the plan is approved, writes JSON Schemas validated via AJV, typed clients, fixtures, factories, and tagged tests. Never exceeds the scope of the approved plan.
- **Healer** (`playwright-healer`): Executes tests, parses the JSON report and traces, auto-fixes contracts and tests within a bounded retry budget, and reports unresolved failures rather than looping indefinitely.
- **Contract Diff Analyzer** (`contract-diff-analyzer`): Detects OpenAPI/Postman spec drift and produces a non-breaking sync plan; breaking changes require explicit `--force` confirmation.

Agents are invoked via skill name (frontmatter `name:`) or through the `/generate` command, which orchestrates all four phases (Plan → Review → Generate → Heal) in sequence.
