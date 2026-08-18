# Playwright API Automation Framework (AI Agent Assisted)

An enterprise-grade Playwright API test automation framework powered by a four-phase agent pipeline (Planner → **Review Gate** → Generator → Healer) located inside the `.gemini/` configuration directory.

This repository allows you to parse OpenAPI/Postman specs, get a **plain-text test-case plan for review before any code is written**, generate strongly-typed **smoke, sanity, integration, regression, and end-to-end (E2E)** test suites with Zod runtime contract validation, append single endpoints without regression, sync evolving API contracts, and autonomously diagnose and heal test failures within a bounded retry budget.

## 1. Directory Structure

```
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
│   │   ├── env.config.ts                  # Zod-validated environment loader
│   │   └── endpoints.ts                   # Centralized immutable API route constants
│   ├── models/
│   │   ├── schemas/                       # Runtime response validation schemas (Zod)
│   │   └── types/                         # Inferred TypeScript interfaces
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

## 2. Prerequisites & Setup

### 2.1 Install Dependencies

Run the following command in your terminal to install the required runtime validation, fake data generation, environment, and Playwright packages:

```bash
npm install zod @faker-js/faker dotenv
npm install -D @playwright/test @types/node typescript
```

### 2.2 Install Playwright & Browser Binaries

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

### 2.3 Install the Playwright CLI Globally (Optional)

For running Playwright commands (`codegen`, `show-report`, `test`, etc.) outside of `npx`, install the CLI globally:

```bash
# Install Playwright CLI globally
npm install -g @playwright/test

# Verify installation
playwright --version

# Generate boilerplate config/tests via the CLI wizard (optional, for new projects)
npm init playwright@latest
```

### 2.4 Install Playwright Skills / VS Code Extension (Optional but Recommended)

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

### 2.5 Configure Multi-Environment Files

Create environment files (e.g., `.env.local`, `.env.qa`, `.env.staging`) in the project root:

```
BASE_URL=https://api.example.com
TEST_USER_EMAIL=user@example.com
TEST_USER_PASSWORD=SecretPassword123
TEST_ADMIN_EMAIL=admin@example.com
TEST_ADMIN_PASSWORD=AdminPassword123
```

### 2.6 Bootstrap the `.gemini/` Directory

If the `.gemini/` files are not yet created, run the bootstrap command in your project terminal:

```bash
mkdir -p .gemini/skills .gemini/commands
```

## 3. The Agent Pipeline

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
       │  GENERATOR   │ (Writes Zod schemas, typed clients, fixtures, factories, & tagged tests)
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
| **Regression** | `@regression` | Full per-endpoint matrix — happy path, negative/validation (400/422), security (401/403), not-found (404/409) | Nightly / pre-release |
| **E2E** | `@e2e` | A realistic multi-domain user journey (e.g. register → login → create order → pay → confirm) | Pre-release / staging only |

Run a subset with: `npx playwright test --grep @smoke`

**Planner Agent** (`skill-planner-agent.md`, skill name `playwright-planner`): Analyzes the OpenAPI/Postman specification, resolves execution order and shared-state dependencies, and drafts the test-case plan organized by type above — presented as a text table for review, never as code. Can optionally use `npx playwright codegen <url>` to record a real auth/login flow when the spec is fronted by a live UI, to confirm actual request/response shapes before drafting the plan.

**Generator Agent** (`skill-generator-agent.md`, skill name `playwright-generator`): Once the plan is approved, implements code following clean SDET patterns:
- Registers immutable routes in `src/config/endpoints.ts`.
- Generates runtime Zod schemas and inferred TypeScript interfaces in `src/models/`.
- Generates typed domain clients in `src/clients/`.
- Connects clients and isolated contexts via `src/fixtures/api.fixture.ts`.
- Generates dynamic data builders via `@faker-js/faker` in `src/factories/`.
- Generates comprehensive, **tagged** Playwright test suites in `src/tests/` (`{ tag: '@smoke' }`, etc.).
- Threads shared state for integration/e2e chains via `test.describe.serial()` with a module-scoped variable (e.g. a created user ID passed from create → read → delete).
- Adds `afterEach`/`afterAll` cleanup so any resource a test creates gets deleted/reverted — no orphaned test data left behind.
- Generates **exactly** what was approved in the plan — no silent scope expansion.
- Runs `npx playwright test <spec-path> --dry-run` before handoff to confirm zero TypeScript/import errors, and checks Environment Safety (below) before executing anything live.

**Healer Agent** (`skill-healer-agent.md`, skill name `playwright-healer`): Never guesses at a fix — diagnoses failures using the Playwright CLI as the source of truth:
1. Checks the resolved environment is local/QA before running anything (see Environment Safety below).
2. Runs `npx playwright test <spec-path> --reporter=json --trace on` and parses the structured JSON report for the failing assertion, HTTP status, and error stack — redacting any tokens/credentials before showing report content.
3. If the JSON report doesn't explain the failure, opens the trace with `npx playwright show-trace` to inspect the real request/response payloads and timing.
4. Falls back to `npx playwright test -g "<title>" --debug` for interactive step-through if still unclear.

It classifies the root cause (schema mismatch, bad factory data, client/route bug, auth/fixture issue, broken shared-state threading, or a genuine backend contract break) and patches only the layer responsible. **Retry budget: 3 patch attempts per failing test** — if still failing after that, it stops, reports the test as unresolved with its last diagnosis, and moves on rather than looping indefinitely. It will never silently weaken a Zod schema or delete a failing test to force a pass; genuine contract breaks are flagged for `contract-diff-analyzer` / the backend team instead of being patched around.

**Contract Diff Analyzer** (`skill-contract-diff.md`, skill name `contract-diff-analyzer`): Diffs an updated OpenAPI/Postman spec against the already-generated schemas, clients, and route registry. Non-breaking changes (new optional fields, new endpoints) are auto-applied. Breaking changes (type changes, removed/renamed required fields, removed endpoints) are only listed by default — re-run with `--sync --force` to actually apply them, with each one still logged individually in the sync report.

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

## 4. How to Use the Agent in Gemini Chat

Open your IDE's AI chat interface (e.g., VS Code Gemini extension, Cursor, or terminal agent). The assistant automatically loads the `.gemini/` configuration.

### Scenario 1: Full Test Suite Generation from Spec

Place your `openapi.yaml`, `swagger.json`, or Postman collection in the root directory, then run:

```
/generate openapi.yaml
```

1. **Planner**: Parses schemas, maps dependencies, and drafts a test-case plan organized by type (smoke/sanity/integration/regression/e2e), presented as a text table.
2. **Review Gate**: Stops and waits. Example output:
   ```
   | # | Type | Endpoint(s) | Description | Expected Result |
   |---|------|-------------|--------------|------------------|
   | 1 | smoke | POST /auth/login | Valid credentials login | 200 + valid token |
   | 2 | regression | POST /users | Missing "email" field | 422 + validation error |
   | 3 | integration | POST /users → GET /users/:id → DELETE /users/:id | Full lifecycle | Each step 2xx, final GET 404 |

   Total: 1 smoke, 0 sanity, 1 integration, 1 regression, 0 e2e (3 test cases)
   Reply "approved" to generate this, or tell me what to change.
   ```
   Reply `approved`, or describe changes (e.g. "add an e2e test for the full checkout flow") and the Planner will revise and re-present.
3. **Generator**: Once approved, scaffolds `endpoints.ts`, Zod schemas, typed client classes, custom Playwright fixtures, Faker factories, and tagged test specs — exactly matching the approved plan, with cleanup hooks for anything created.
4. **Generator**: Runs a dry run (`npx playwright test --dry-run`) to verify zero TypeScript or import errors.
5. **Healer**: Executes with `--reporter=json --trace on`, diagnoses any failures from the report/trace, patches (up to 3 attempts per test), and re-runs until green — or reports the test as unresolved.

### Scenario 2: Add a Single New Endpoint (Zero-Regression Append)

To add test coverage for a single new endpoint without modifying or breaking existing tests:

```
/generate POST /api/v1/users/{id}/reset-password with body { "newPassword": "string" }
```

**Behavior**: Still goes through the Planner and Review Gate first (a short plan for just this one endpoint), then operates in Strict Append Mode. Adds the route to `endpoints.ts`, appends the Zod schema and client method, adds a dynamic Faker builder, and appends a new tagged `test.describe()` block at the end of the existing domain spec — never touches existing tests.

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
- Missing `Schema.parse(responseJson)` runtime validation
- Hardcoded credentials → fixture/`process.env` sourcing

**Hard rule: refactor never changes test intent.** No assertion values, expected statuses, or test logic are altered — only structure. Anything that would require changing what a test actually checks is flagged as **"Manual review needed"** in the plan and never auto-applied, even after you approve the rest.

Once approved, the Generator refactors one file at a time and re-runs it after each edit (`npx playwright test <file>`) to confirm identical pass/fail behavior to before the refactor — if behavior changes, it reverts that file and flags it back to you instead of continuing.

## 5. Running the Tests

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

## 6. Architectural Rules & Best Practices

- **Centralized Routes**: Never hardcode endpoint strings in test specs; reference `src/config/endpoints.ts`.
- **Runtime Contract Validation**: Always use `Schema.parse(responseBody)` to catch backend contract breaks at runtime.
- **Automatic Authentication**: Rely on `src/fixtures/api.fixture.ts` for automatic token retrieval, caching, and role-based client injection (`userClient`, `adminUserClient`, `unauthRequest`).
- **Dynamic Data**: Always use `@faker-js/faker` factories in `src/factories/` rather than hardcoding static payload data.
- **Non-Destructive Appending**: When adding new endpoints to an existing codebase, never overwrite or delete existing working tests.
- **Evidence-Based Healing**: The Healer never patches or weakens a test based on guesswork — every fix must trace back to the JSON report or trace output. It will never delete/skip a failing test or loosen a Zod schema to force a pass; genuine backend contract breaks are flagged, not patched around.
- **Bounded Healing**: The Healer stops after 3 patch attempts per test and reports it as unresolved rather than looping indefinitely.
- **Trace & Reporter Config Required**: `playwright.config.ts` must configure `trace: 'retain-on-failure'` and a JSON reporter output so the Healer always has structured diagnostic data available.
- **Test Isolation & Cleanup**: Any test that creates a resource must clean it up via `afterEach`/`afterAll` — no orphaned data left in the target environment.
- **Shared-State Threading**: Dependent multi-step flows (integration/e2e) use `test.describe.serial()` with module-scoped state, never independent/parallel tests for steps that depend on each other.
- **Environment Safety**: No agent executes a test against anything other than `.env.local`/`.env.qa` without your explicit confirmation first.
- **Secrets Handling**: No agent ever prints raw credentials, tokens, or auth headers into chat, code, or reports.
- **Plan Before Code**: The Planner always presents a text test-case plan and waits for approval before the Generator writes anything.
- **Refactor Never Changes Intent**: Refactor mode only touches structure (tags, cleanup, imports, route/factory references) — never assertion values or test logic. Anything requiring a logic change is flagged for manual review, not auto-applied.
