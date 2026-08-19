# Playwright API Automation Framework (AI Agent Assisted)

An enterprise-grade Playwright API test automation framework powered by a four-phase agent pipeline (Planner → **Review Gate** → Generator → Healer) located inside the `.gemini/` configuration directory.

This repository allows you to parse OpenAPI/Postman specs, get a **plain-text test-case plan for review before any code is written**, generate strongly-typed **smoke, sanity, integration, regression, and end-to-end (E2E)** test suites with AJV/JSON Schema runtime contract validation, append single endpoints without regression, sync evolving API contracts, and autonomously diagnose and heal test failures within a bounded retry budget.

## 1. Directory Structure

```
├── .github/
│   └── workflows/
│       └── playwright-tests.yml            # CI: smoke on push, regression+security nightly, e2e on release
├── docs/
│   ├── test-cases/
│   │   └── [domain].test-cases.md         # Jira-style human-readable test cases (see accounts.test-cases.md)
│   └── contracts.md                        # Human-readable schema/field reference, generated from JSON Schemas
├── CHANGELOG.md                            # Auto-appended by contract-diff-analyzer on every --sync
├── .gemini/                               # AI Agent Configuration & Skills
│   ├── system.md                          # Global agent rules, SDET standards, architecture
│   ├── skills/
│   │   ├── skill-planner-agent.md         # Phase 1: Spec analysis & test-case plan (by type)
│   │   ├── skill-generator-agent.md       # Phase 3: Codegen for models, clients, & tagged tests
│   │   ├── skill-healer-agent.md          # Phase 4: Bounded autonomous error diagnosis & patching
│   │   └── skill-contract-diff.md         # OpenAPI contract drift detection & sync
│   └── commands/
│       └── generate.md                    # Unified orchestrator command (/generate)
├── src/
│   ├── config/
│   │   ├── env.config.ts                  # AJV-validated environment loader
│   │   └── endpoints.ts                   # Centralized immutable API route constants
│   ├── models/
│   │   ├── schemas/                       # JSON Schema contracts + AJV-compiled parseX() helpers
│   │   └── types/                         # TS types inferred via json-schema-to-ts (FromSchema<>)
│   ├── clients/
│   │   ├── base.client.ts                 # Request wrapper (timing, logging, interceptors)
│   │   └── [domain].client.ts             # Domain-specific typed API clients
│   ├── fixtures/
│   │   └── api.fixture.ts                 # Custom Playwright fixtures (auth & client injection)
│   ├── factories/
│   │   └── [domain].factory.ts            # Dynamic test data generators (@faker-js/faker)
│   └── tests/
│       └── [domain].spec.ts               # Tagged tests: @smoke @sanity @integration @regression @e2e
├── .env.local / .env.qa / .env.staging
├── playwright.config.ts
├── package.json
└── tsconfig.json
```

## 2. Architecture Principles

| Principle | Where it shows up |
|---|---|
| **Separation of Concerns** | Routes, schemas, clients, fixtures, factories, tests each own exactly one job |
| **Contract-First / Schema-Driven Testing** | JSON Schemas lifted from the OpenAPI spec are the single source of truth for both types and validation |
| **DRY via Centralization** | `endpoints.ts` is the only place routes are defined; `api.fixture.ts` is the only place auth logic lives |
| **Fail-Fast & Falsifiability** | Every assertion must be able to fail — no hedged multi-status matchers, no error-swallowing try/catch |
| **Gated Autonomy (Human-in-the-Loop)** | Review Gate before generation; `--force` required for breaking sync changes; confirmation required for non-local environments |
| **Non-Destructive, Additive Change** | Append-only generation; refactor mode that only touches structure, never logic |
| **Evidence-Based Automation** | The Healer only acts on structured JSON report / trace data — never guesses |
| **Bounded Autonomy (Circuit Breakers)** | 3-attempt retry cap per test; suite-level 30%-failure-rate breaker for environment-wide issues |
| **Least Privilege / Secrets Hygiene** | No agent ever echoes tokens/credentials into chat, code, or reports |
| **Test Pyramid Alignment** | Smoke/sanity/integration/regression/security/e2e tags map directly to CI cadence (fast-and-frequent → slow-and-rare) |
| **Immutable Contracts** | Routes registered as immutable constants, never string literals scattered across files |
| **Traceable Governance** | `CHANGELOG.md`, `test-results/unresolved.md`, and Jira-style test-case docs make drift and failures auditable over time, not just visible in the moment |

## 3. Prerequisites & Setup

### 3.1 Install Dependencies

Run the following command in your terminal to install the required runtime validation, fake data generation, environment, and Playwright packages:

```bash
npm install ajv ajv-formats @faker-js/faker dotenv
npm install -D @playwright/test @types/node typescript json-schema-to-ts
```

> **Migrating from Zod?** Remove it with `npm uninstall zod` — the framework now uses AJV for runtime validation and `json-schema-to-ts` (dev-only, type-level) for inferred TypeScript types instead of `z.infer<>`.

### 3.2 Install Playwright & Browser Binaries

Install the Playwright test runner package and download the required browser binaries (Chromium, Firefox, WebKit) along with their OS-level dependencies:

```bash
# Install Playwright test runner (if not already installed via 2.1)
npm install -D @playwright/test

# Download browser binaries required to run tests
npx playwright install

# Install OS-level dependencies for the browsers (Linux CI/containers)
npx playwright install-deps

# Or do both browsers + system deps in a single step
npx playwright install --with-deps
```

### 3.3 Install the Playwright CLI Globally (Optional)

For running Playwright commands (`codegen`, `show-report`, `test`, etc.) outside of `npx`, install the CLI globally:

```bash
# Install Playwright CLI globally
npm install -g @playwright/test

# Verify installation
playwright --version

# Generate boilerplate config/tests via the CLI wizard (optional, for new projects)
npm init playwright@latest
```

### 3.4 Install Playwright Skills / VS Code Extension (Optional but Recommended)

These tools enhance local development with test recording, trace viewing, and inline debugging:

```bash
# Install the Playwright VS Code extension via CLI (requires VS Code `code` CLI on PATH)
code --install-extension ms-playwright.playwright

# Open the interactive UI Mode test runner
npx playwright test --ui

# Launch Codegen to record actions and auto-generate test skills/scripts
npx playwright codegen <your-app-or-api-url>

# Open the Trace Viewer for a captured trace file
npx playwright show-trace trace.zip
```

### 3.5 Configure Multi-Environment Files

Create environment files (e.g., `.env.local`, `.env.qa`, `.env.staging`) in the project root:

```
BASE_URL=https://api.example.com
TEST_USER_EMAIL=user@example.com
TEST_USER_PASSWORD=SecretPassword123
TEST_ADMIN_EMAIL=admin@example.com
TEST_ADMIN_PASSWORD=AdminPassword123
```

### 3.6 Bootstrap the `.gemini/` Directory

If the `.gemini/` files are not yet created, run the bootstrap command in your project terminal:

```bash
mkdir -p .gemini/skills .gemini/commands
```

## 4. The Agent Pipeline

```
       ┌──────────────┐
       │   PLANNER    │ (Analyzes spec, resolves dependencies, drafts test-case PLAN)
       └──────┬───────┘
              │ Test Plan (text, by test type)
              ▼
       ┌──────────────┐
       │ USER REVIEW  │ (You approve, edit, or reject the plan — MANDATORY GATE)
       └──────┬───────┘
              │ Approved Plan
              ▼
       ┌──────────────┐
       │  GENERATOR   │ (Writes JSON Schemas (AJV), typed clients, fixtures, factories, & tagged tests)
       └──────┬───────┘
              │ Test Code
              ▼
       ┌──────────────┐
       │    HEALER    │ (Executes tests, parses traces/failures, auto-fixes within a 3-attempt budget)
       └──────────────┘
```

### Mandatory Review Gate

The Planner never hands off directly to code generation. It first drafts a plain-text test-case plan and **stops**. Nothing is written to disk until you explicitly approve it (e.g. "approved", "proceed", "generate it"). If you ask for changes, the Planner revises and re-presents the plan rather than assuming approval.

### Test Type Taxonomy

Every generated test is tagged with exactly one type using Playwright's native tag syntax, so suites can be run independently:

| Type | Tag | Scope | Typical Run Frequency |
|---|---|---|---|
| **Smoke** | `@smoke` | One happy-path call per core endpoint — service is up, auth works | Every deploy, fast (<2 min) |
| **Sanity** | `@sanity` | Narrow check that a specific recent change works | After a targeted fix/change |
| **Integration** | `@integration` | Multi-endpoint flows verifying dependent calls work together (e.g. create → read → update → delete) | Per PR / pre-merge |
| **Regression** | `@regression` | Full per-endpoint matrix — happy path, negative/validation (400/422), not-found (404/409) | Nightly / pre-release |
| **Security** | `@security` | Auth boundaries (401/403), JWT tampering, IDOR checks, injection probes, CORS/header checks | Nightly / pre-release |
| **E2E** | `@e2e` | A realistic multi-domain user journey (e.g. register → login → create order → pay → confirm) | Pre-release / staging only |

Run a subset with: `npx playwright test --grep @smoke`

### Assertion Scope (beyond status + schema)

Status code + `parseX()`/schema validation only proves a response has the right *shape* — not that it's *correct*. The Planner tags every test case with which of these categories apply, and the Generator implements all of them, not just the first two:

1. **Status code**
2. **Schema/contract validation** (shape only)
3. **Field-value assertions** — response values actually match what was sent/computed (e.g. echoed fields, `total = price * quantity`, valid timestamps) — the most commonly-skipped category
4. **Header assertions** — `Content-Type`, `Location` on creates, pagination headers
5. **Error-body assertions** — the actual error message/code, not just the status number
6. **Business-rule assertions** — uniqueness, non-negative balances, state-transition rules
7. **Boundary/edge-case assertions** — min/max length, numeric limits
8. **Idempotency** — repeated `PUT`/`DELETE` produces a consistent end state
9. **Pagination/sorting/filtering correctness** — returned items actually respect the request
10. **Performance threshold** (optional, only if requested — adds CI flakiness risk)

**Planner Agent** (`skill-planner-agent.md`, skill name `playwright-planner`): Analyzes the OpenAPI/Postman specification, resolves execution order and shared-state dependencies, and drafts the test-case plan organized by type above — presented as a text table for review, never as code. Each row lists which assertion categories apply, so gaps are visible before code is generated. Can optionally use `npx playwright codegen <url>` to record a real auth/login flow when the spec is fronted by a live UI, to confirm actual request/response shapes before drafting the plan.

**Generator Agent** (`skill-generator-agent.md`, skill name `playwright-generator`): Once the plan is approved, implements code following clean SDET patterns:
- Registers immutable routes in `src/config/endpoints.ts`.
- Generates JSON Schema contracts (compiled with AJV) and TypeScript interfaces inferred via `json-schema-to-ts` in `src/models/` — see the AJV Schema Convention below.
- Generates typed domain clients in `src/clients/`.
- Connects clients and isolated contexts via `src/fixtures/api.fixture.ts`.
- Generates dynamic data builders via `@faker-js/faker` in `src/factories/`.
- Generates comprehensive, **tagged** Playwright test suites in `src/tests/` (`{ tag: '@smoke' }`, etc.), implementing every assertion category listed in the plan for that test case — not just status/schema. Field values are checked against what was actually sent/computed, error bodies are checked for specific message content, headers and business rules are asserted where the plan calls for them.
- Threads shared state for integration/e2e chains via `test.describe.serial()` with a module-scoped variable (e.g. a created user ID passed from create → read → delete).
- Adds `afterEach`/`afterAll` cleanup so any resource a test creates gets deleted/reverted — no orphaned test data left behind.
- Generates **exactly** what was approved in the plan — no silent scope expansion.
- Runs `npx playwright test <spec-path> --dry-run` before handoff to confirm zero TypeScript/import errors, and checks Environment Safety (below) before executing anything live.

#### AJV Schema Convention

Every domain schema file exports a JSON Schema (`as const`), an inferred TS type, and a `parseX()` helper that throws on validation failure — this keeps the same call-site ergonomics as Zod's `.parse()`:

```ts
// src/models/schemas/user.schema.ts
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import type { FromSchema } from 'json-schema-to-ts';

const ajv = new Ajv({ allErrors: true, strict: true });
addFormats(ajv);

export const userSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    email: { type: 'string', format: 'email' },
    createdAt: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'email', 'createdAt'],
  additionalProperties: false,
} as const;

export type User = FromSchema<typeof userSchema>;

const validateUser = ajv.compile(userSchema);

export function parseUser(data: unknown): User {
  if (!validateUser(data)) {
    throw new Error(`User schema validation failed: ${ajv.errorsText(validateUser.errors)}`);
  }
  return data as User;
}
```

Test specs call `parseUser(responseJson)` — never `ajv.compile()` inline in a test. When generating from `openapi.yaml`, schemas are lifted directly from `components.schemas` where possible (OpenAPI schemas are JSON Schema already), with OpenAPI 3.0's `nullable: true` converted to a proper `type: [X, "null"]` union during extraction.

**Healer Agent** (`skill-healer-agent.md`, skill name `playwright-healer`): Never guesses at a fix — diagnoses failures using the Playwright CLI as the source of truth:
1. Checks the resolved environment is local/QA before running anything (see Environment Safety below).
2. Runs `npx playwright test <spec-path> --reporter=json --trace on` and parses the structured JSON report for the failing assertion, HTTP status, and error stack — redacting any tokens/credentials before showing report content.
3. If the JSON report doesn't explain the failure, opens the trace with `npx playwright show-trace` to inspect the real request/response payloads and timing.
4. Falls back to `npx playwright test -g "<title>" --debug` for interactive step-through if still unclear.

It classifies the root cause (schema mismatch, bad factory data, client/route bug, auth/fixture issue, broken shared-state threading, or a genuine backend contract break) and patches only the layer responsible. **Retry budget: 3 patch attempts per failing test** — if still failing after that, it stops, reports the test as unresolved with its last diagnosis, and moves on rather than looping indefinitely. It will never silently weaken a JSON Schema (e.g. removing a field from `required`, widening a `type`, or flipping `additionalProperties` to `true`) or delete a failing test to force a pass; genuine contract breaks are flagged for `contract-diff-analyzer` / the backend team instead of being patched around.

**Contract Diff Analyzer** (`skill-contract-diff.md`, skill name `contract-diff-analyzer`): Diffs an updated OpenAPI/Postman spec against the already-generated schemas, clients, and route registry. Non-breaking changes (new optional fields, new endpoints) are auto-applied. Breaking changes (type changes, removed/renamed required fields, removed endpoints) are only listed by default — re-run with `--sync --force` to actually apply them, with each one still logged individually in the sync report.

### No Unfalsifiable Tests (Hard Rule)

A test that can't fail is worse than no test — it creates false confidence. Agents never generate:
- Multi-status OR matching (`expect([200, 400, 500]).toContain(response.status())`) — the plan specifies one expected status per test case; different possible outcomes are different test cases, not one hedged test.
- Error-swallowing try/catch (`catch { expect(true).toBe(true) }`) — if a request can throw, the test should let it throw and fail.
- Any tautological assertion that passes regardless of the actual response.

If the correct expected outcome is genuinely unclear, the agent stops and asks rather than generating a hedge.

### Environment Safety (Hard Rule)

Before any agent executes a test against a live server, it checks the resolved `BASE_URL`:
- `.env.local` or `.env.qa` → runs freely.
- `.env.staging` or anything not clearly local/QA → **agents stop and ask for your explicit confirmation first.** This applies to the Generator's dry-run, the Healer's diagnostic runs, and Contract Diff's sync verification alike — never assumed safe by default, even mid-heal-loop.

### Secrets Handling (Hard Rule)

Agents never print raw `.env.*` values, bearer tokens, or auth headers into chat, generated code, or report summaries. Auth failures are described by shape (e.g. "token fixture returned an expired JWT"), not by echoing the actual secret.

### CLI Tooling Reference (used by the agents)

| Command | Used By | Purpose |
|---|---|---|
| `npx playwright test <file> --reporter=json --trace on` | Healer | Structured failure diagnosis (status, matcher diff, error stack) |
| `npx playwright show-trace <trace.zip>` | Healer | Inspect real request/response payloads, headers, and timing for a failed call |
| `npx playwright test <file> -g "<title>" --debug` | Healer | Interactive step-through when the report/trace aren't conclusive |
| `npx playwright test --grep @<tag>` | Anyone | Run only one test-type category (smoke/sanity/integration/regression/e2e) |
| `npx playwright test --dry-run` | Generator | Validate zero TypeScript/import errors before executing real requests |
| `npx playwright show-report` | Healer | Full-suite HTML view after a heal cycle |
| `npx playwright codegen <url>` | Planner (optional) | Record a real auth/login flow to confirm request/response shapes |

> **Config requirement**: `playwright.config.ts` must set `trace: 'retain-on-failure'` (or at minimum `'on-first-retry'`) and a JSON reporter (`reporter: [['json', { outputFile: 'test-results/report.json' }], ['html']]`) so the Healer always has structured data to parse without extra flags.

### Suite-Level Circuit Breaker

The Healer's 3-attempt retry budget is per test — but if the environment itself is down (or shared test credentials expired), many unrelated tests fail at once and patching each one individually just wastes attempts diagnosing the same root cause repeatedly. Before starting the patch loop, the Healer checks the overall failure rate: **if more than 30% of tests fail on the first pass**, it stops, inspects a couple of failures for a shared pattern, and reports a likely environment-level issue instead of grinding through per-test fixes.

### Test Data Collision Safety

Factories suffix unique fields (email, username) with a worker-scoped or run-scoped identifier, so parallel/sharded runs never collide on uniqueness constraints:

```ts
export function buildUser() {
  const uniqueSuffix = `${test.info().workerIndex}-${Date.now()}`;
  return { email: `test.${uniqueSuffix}@example.com`, username: `user_${uniqueSuffix}` };
}
```

### Rate-Limit & Backoff Handling

`src/clients/base.client.ts` treats `429`/`503` as retryable with exponential backoff, transparently to the test — a test never asserts on a rate-limit status as an accepted outcome (that's the multi-status forbidden pattern from earlier). See `skill-generator-agent.md` for the implementation.

### CI Integration

`.github/workflows/playwright-tests.yml` is included in this repo, wiring the test-type tags into actual CI triggers instead of leaving them unused:

| Trigger | Runs | Purpose |
|---|---|---|
| Push / PR | `@smoke` | Fast feedback, every change |
| Nightly schedule | `@regression` + `@security` + `@integration` | Deeper coverage without blocking every PR |
| Release / manual dispatch | `@e2e` | Full user-journey coverage before shipping |

The nightly job also surfaces `test-results/unresolved.md` directly in the GitHub Actions run summary, so unresolved Healer failures are visible without digging through logs. `FULL_GENERATION` mode scaffolds this file once on a brand-new project if it doesn't already exist — the agents don't regenerate it on every `/generate` run since it's infrastructure, not per-domain code.

### Traceability & Governance

- **`CHANGELOG.md`**: every `--sync`/`--sync --force` run appends a dated entry summarizing what changed (applied non-breaking, flagged breaking, applied-with-force) — schema drift becomes auditable over time instead of only visible in the moment.
- **`test-results/unresolved.md`**: any test the Healer can't fix within its retry budget is written here (test name, attempt count, last diagnosis, trace path), not just mentioned in chat — trackable across sessions.
- **`docs/contracts.md`**: a human-readable field/type/required/format listing generated from the JSON Schemas, kept in sync whenever a schema changes — a reference doc without hand-maintaining it separately.

### Global Setup/Teardown

Per-test `afterEach` cleanup handles what a single test creates. For suite-wide reference data every test depends on (a seeded admin account, base config), use Playwright's `globalSetup`/`globalTeardown` in `playwright.config.ts` pointing at `src/global-setup.ts`/`src/global-teardown.ts`, rather than duplicating setup logic across every domain spec.

### Human-Readable Test Case Docs (Jira-Style)

Every `src/tests/[domain].spec.ts` has a companion `docs/test-cases/[domain].test-cases.md` — written for humans who won't read the TypeScript (QA leads, product, auditors). Each approved plan row becomes one entry in Jira user-story format, with a step table, acceptance criteria checklist, and a direct link back to the automated test:

```markdown
## TC-001: Successful deposit into an active account

**Jira Story:** ACC-101 | **Type:** 🔥 Smoke | **Priority:** P0

**As a** account holder
**I want** to deposit funds into my account
**So that** my available balance increases by the deposited amount

**Test Steps:**
| Step | Action | Expected Result |
|---|---|---|
| 1 | POST /accounts/{id}/deposit with { amount: 100 } | 200 OK |
| 2 | Inspect response body | newBalance equals startingBalance + 100 exactly |

**Acceptance Criteria:**
- [ ] Response status is exactly 200
- [ ] newBalance is arithmetically correct, not just present

**Automation Reference:** src/tests/accounts.spec.ts → "POST /deposit - should deposit funds..." (@smoke)
**Status:** ✅ Automated
```

See `docs/test-cases/accounts.test-cases.md` in this repo for a full worked example covering all five test types, including an IDOR security case and a multi-step E2E onboarding flow. The **Status** field is kept live by the Healer (`⚠️ Unresolved`) and Contract Diff Analyzer (`🔴 Needs update`) — it's not a static snapshot.

## 5. How to Use the Agent in Gemini Chat

Open your IDE's AI chat interface (e.g., VS Code Gemini extension, Cursor, or terminal agent). The assistant automatically loads the `.gemini/` configuration.

### Scenario 1: Full Test Suite Generation from Spec

Place your `openapi.yaml`, `swagger.json`, or Postman collection in the root directory, then run:

```
/generate openapi.yaml
```

1. **Planner**: Parses schemas, maps dependencies, and drafts a test-case plan organized by type (smoke/sanity/integration/regression/e2e), presented as a text table.
2. **Review Gate**: Stops and waits. Example output:
   ```
   | # | Type | Endpoint(s) | Description | Assertions | Expected Result |
   |---|------|-------------|--------------|------------|------------------|
   | 1 | smoke | POST /auth/login | Valid credentials login | status, schema, field-value (token is non-empty JWT) | 200 + valid token |
   | 2 | regression | POST /users | Missing "email" field | status, error-body (message mentions "email") | 422 + specific validation error |
   | 3 | integration | POST /users → GET /users/:id → DELETE /users/:id | Full lifecycle | status+schema each step, field-value (GET matches POST), 404 confirms delete | Each step 2xx, final GET 404 |

   Total: 1 smoke, 0 sanity, 1 integration, 1 regression, 0 e2e (3 test cases)
   Reply "approved" to generate this, or tell me what to change.
   ```
   Reply `approved`, or describe changes (e.g. "add an e2e test for the full checkout flow") and the Planner will revise and re-present.
3. **Generator**: Once approved, scaffolds `endpoints.ts`, JSON Schemas + AJV `parseX()` helpers, typed client classes, custom Playwright fixtures, Faker factories, and tagged test specs — exactly matching the approved plan, with cleanup hooks for anything created.
4. **Generator**: Runs a dry run (`npx playwright test --dry-run`) to verify zero TypeScript or import errors.
5. **Healer**: Executes with `--reporter=json --trace on`, diagnoses any failures from the report/trace, patches (up to 3 attempts per test), and re-runs until green — or reports the test as unresolved.

### Scenario 2: Add a Single New Endpoint (Zero-Regression Append)

To add test coverage for a single new endpoint without modifying or breaking existing tests:

```
/generate POST /api/v1/users/{id}/reset-password with body { "newPassword": "string" }
```

**Behavior**: Still goes through the Planner and Review Gate first (a short plan for just this one endpoint), then operates in Strict Append Mode. Adds the route to `endpoints.ts`, appends the JSON Schema + `parseX()` helper and client method, adds a dynamic Faker builder, and appends a new tagged `test.describe()` block at the end of the existing domain spec — never touches existing tests.

### Scenario 3: Sync Modified OpenAPI Specs (Contract Drift)

When backend teams update existing endpoints, add required fields, or change response models:

```
/generate openapi.yaml --sync
```

**Behavior**: Runs `contract-diff-analyzer` to identify breaking and non-breaking contract changes. Non-breaking changes (new optional fields, new endpoints) are applied directly. Breaking changes (type changes, removed/renamed required fields, removed endpoints) are only **listed** in the sync report by default — nothing is applied. To actually apply them:

```
/generate openapi.yaml --sync --force
```

Each breaking change is still individually logged (old shape vs. new shape, affected files) even with `--force`, so there's a clear record of what changed and why tests were touched.

### Scenario 4: Autonomous Test Debugging & Self-Healing

If any test fails during execution:

```
The tests in src/tests/user.spec.ts failed with error 422. Use playwright-healer to inspect and fix the payload data.
```

**Behavior**: The healer first checks the resolved environment is local/QA, then re-runs the test with `--reporter=json --trace on`, inspects the JSON report and (if needed) the trace for the actual request/response bodies (redacting any tokens), classifies the root cause (bad factory data, schema mismatch, client bug, broken shared-state threading, etc.), patches only the responsible layer, and re-verifies — up to 3 attempts. If still failing after that, it reports the test as unresolved with its last diagnosis instead of continuing to loop.

### Scenario 5: Refactor an Existing Codebase to Current Conventions

If tests already exist — hand-written, or generated under older `.gemini/` conventions — and you want them brought up to the current standard (tags, cleanup hooks, serial threading, centralized routes, Faker factories), don't hand-edit them one by one. Run:

```
/generate --refactor
```

or target one file:

```
/generate --refactor src/tests/user.spec.ts
```

**Behavior**: The Planner audits the file(s) against the checklist below and presents a **refactor plan** (same review-gate pattern — nothing is edited until you approve):

- Missing tags (`@smoke`/`@sanity`/`@integration`/`@regression`/`@e2e`) — inferred from what the test does, marked as "suggested"
- Missing cleanup for resources a test creates
- Tests that could be consolidated into `test.describe.serial()` for shared state
- Hardcoded routes → `src/config/endpoints.ts` references
- Hardcoded payloads → `@faker-js/faker` factories
- Missing `parseX(responseJson)` runtime validation (no AJV schema check on the response)
- **Shallow assertions** — a test only checks status code/schema shape with no field-value, error-body, or business-rule checks; flagged as "Manual review needed" since strengthening it changes test intent
- Hardcoded credentials → fixture/`process.env` sourcing

**Hard rule: refactor never changes test intent.** No assertion values, expected statuses, or test logic are altered — only structure. Anything that would require changing what a test actually checks is flagged as **"Manual review needed"** in the plan and never auto-applied, even after you approve the rest.

Once approved, the Generator refactors one file at a time and re-runs it after each edit (`npx playwright test <file>`) to confirm identical pass/fail behavior to before the refactor — if behavior changes, it reverts that file and flags it back to you instead of continuing.

## 6. Running the Tests

Execute tests using standard Playwright CLI commands:

```bash
# Run all API tests
npx playwright test

# Run tests for a specific domain
npx playwright test src/tests/user.spec.ts

# Run only a specific endpoint test block
npx playwright test -g "reset-password"

# Run tests against a specific environment
ENV=staging npx playwright test

# Open the HTML test report
npx playwright show-report

# Run with structured JSON output + forced trace (what the Healer uses to diagnose failures)
npx playwright test src/tests/user.spec.ts --reporter=json --trace on

# Inspect a captured trace (request/response bodies, headers, timing)
npx playwright show-trace test-results/<test-name>/trace.zip

# Step through a specific failing test interactively
npx playwright test -g "reset-password" --debug

# Run only one test-type category
npx playwright test --grep @smoke
npx playwright test --grep @sanity
npx playwright test --grep @integration
npx playwright test --grep @regression
npx playwright test --grep @e2e
```

## 7. Architectural Rules & Best Practices

- **Centralized Routes**: Never hardcode endpoint strings in test specs; reference `src/config/endpoints.ts`.
- **Runtime Contract Validation**: Always use the domain's `parseX(responseBody)` helper (AJV-compiled) to catch backend contract breaks at runtime.
- **Automatic Authentication**: Rely on `src/fixtures/api.fixture.ts` for automatic token retrieval, caching, and role-based client injection (`userClient`, `adminUserClient`, `unauthRequest`).
- **Dynamic Data**: Always use `@faker-js/faker` factories in `src/factories/` rather than hardcoding static payload data.
- **Non-Destructive Appending**: When adding new endpoints to an existing codebase, never overwrite or delete existing working tests.
- **Evidence-Based Healing**: The Healer never patches or weakens a test based on guesswork — every fix must trace back to the JSON report or trace output. It will never delete/skip a failing test or loosen a JSON Schema (removing a `required` field, widening a `type`, enabling `additionalProperties`) to force a pass; genuine backend contract breaks are flagged, not patched around.
- **Bounded Healing**: The Healer stops after 3 patch attempts per test and reports it as unresolved rather than looping indefinitely.
- **Trace & Reporter Config Required**: `playwright.config.ts` must configure `trace: 'retain-on-failure'` and a JSON reporter output so the Healer always has structured diagnostic data available.
- **Test Isolation & Cleanup**: Any test that creates a resource must clean it up via `afterEach`/`afterAll` — no orphaned data left in the target environment.
- **Shared-State Threading**: Dependent multi-step flows (integration/e2e) use `test.describe.serial()` with module-scoped state, never independent/parallel tests for steps that depend on each other.
- **Environment Safety**: No agent executes a test against anything other than `.env.local`/`.env.qa` without your explicit confirmation first.
- **Secrets Handling**: No agent ever prints raw credentials, tokens, or auth headers into chat, code, or reports.
- **Plan Before Code**: The Planner always presents a text test-case plan and waits for approval before the Generator writes anything.
- **Refactor Never Changes Intent**: Refactor mode only touches structure (tags, cleanup, imports, route/factory references) — never assertion values or test logic. Anything requiring a logic change is flagged for manual review, not auto-applied.
- **Assertions Beyond Status/Schema**: Every test implements all applicable assertion categories from the plan (field values, error-body content, headers, business rules) — status code and schema validation are the floor, not the whole test.
- **No Unfalsifiable Tests**: Never a multi-status OR match, never a try/catch that swallows an error behind `expect(true).toBe(true)`, never an assertion that can't fail. If the expected outcome is unclear, the agent asks instead of hedging.
- **Bounded at the Suite Level Too**: Beyond the per-test retry cap, the Healer stops entirely and reports a likely shared root cause if more than 30% of tests fail on the first pass, rather than patching each one as if it were an isolated bug.
- **Collision-Safe Test Data**: Unique fields in factories are suffixed with a worker/run-scoped identifier — no hardcoded unique values that break under parallel or repeated runs.
- **Transparent Backoff, Never Hedged Assertions**: Rate limits (429/503) are retried with backoff inside the client layer; a test never treats a rate-limit status as an accepted outcome.
- **Documentation Stays Live**: `docs/test-cases/[domain].test-cases.md` and `docs/contracts.md` are generated/updated alongside code, not maintained separately — and their Status fields are updated by the Healer and Contract Diff Analyzer as reality changes, not left stale.
