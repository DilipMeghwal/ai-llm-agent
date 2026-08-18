# Playwright API Automation Framework (AI Agent Assisted)

An enterprise-grade Playwright API test automation framework powered by a tri-agent architecture (Planner, Generator, and Healer) located inside the `.gemini/` configuration directory.

This repository allows you to parse OpenAPI/Postman specs, generate strongly-typed test suites with Zod runtime contract validation, append single endpoints without regression, sync evolving API contracts, and autonomously diagnose and heal test failures.

## 1. Directory Structure

```
├── .gemini/                               # AI Agent Configuration & Skills
│   ├── system.md                          # Global agent rules, SDET standards, architecture
│   ├── skills/
│   │   ├── skill-planner-agent.md         # Phase 1: Spec analysis & dependency DAG
│   │   ├── skill-generator-agent.md       # Phase 2: Codegen for models, clients, & specs
│   │   ├── skill-healer-agent.md          # Phase 3: Autonomous error diagnosis & patching
│   │   └── skill-contract-diff.md         # Phase 4: OpenAPI contract drift detection
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
│       └── [domain].spec.ts               # Test suites (happy paths, 4xx, security, edge cases)
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

## 3. The Tri-Agent Architecture

```
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

**Planner Agent** (`skill-planner-agent.md`, skill name `playwright-planner`): Analyzes the OpenAPI/Postman specification, resolves execution order, maps CRUD dependencies, and produces a complete test matrix (2xx, 4xx validation, 401/403 security, 404 resource state). Can optionally use `npx playwright codegen <url>` to record a real auth/login flow when the spec is fronted by a live UI, to confirm actual request/response shapes before modeling schemas.

**Generator Agent** (`skill-generator-agent.md`, skill name `playwright-generator`): Implements code following clean SDET patterns:
- Registers immutable routes in `src/config/endpoints.ts`.
- Generates runtime Zod schemas and inferred TypeScript interfaces in `src/models/`.
- Generates typed domain clients in `src/clients/`.
- Connects clients and isolated contexts via `src/fixtures/api.fixture.ts`.
- Generates dynamic data builders via `@faker-js/faker` in `src/factories/`.
- Generates comprehensive Playwright test suites in `src/tests/`.
- Runs `npx playwright test <spec-path> --dry-run` before handoff to confirm zero TypeScript/import errors.

**Healer Agent** (`skill-healer-agent.md`, skill name `playwright-healer`): Never guesses at a fix — diagnoses failures using the Playwright CLI as the source of truth:
1. Runs `npx playwright test <spec-path> --reporter=json --trace on` and parses the structured JSON report for the failing assertion, HTTP status, and error stack.
2. If the JSON report doesn't explain the failure, opens the trace with `npx playwright show-trace` to inspect the real request/response payloads and timing.
3. Falls back to `npx playwright test -g "<title>" --debug` for interactive step-through if still unclear.

It classifies the root cause (schema mismatch, bad factory data, client/route bug, auth/fixture issue, or a genuine backend contract break) and patches only the layer responsible — it will never silently weaken a Zod schema or delete a failing test to force a pass. Genuine contract breaks are flagged for `contract-diff-analyzer` / the backend team instead of being patched around.

**Contract Diff Analyzer** (`skill-contract-diff.md`, skill name `contract-diff-analyzer`): Diffs an updated OpenAPI/Postman spec against the already-generated schemas, clients, and route registry. Non-breaking changes (new optional fields, new endpoints) are auto-applied. Breaking changes (type changes, removed/renamed required fields, removed endpoints) are surfaced in a sync report — old shape vs. new shape and affected files — rather than silently rewritten, and require confirmation before `playwright-generator` regenerates the affected layer.

### CLI Tooling Reference (used by the agents)

| Command | Used By | Purpose |
|---|---|---|
| `npx playwright test <file> --reporter=json --trace on` | Healer | Structured failure diagnosis (status, matcher diff, error stack) |
| `npx playwright show-trace <trace.zip>` | Healer | Inspect real request/response payloads, headers, and timing for a failed call |
| `npx playwright test <file> -g "<title>" --debug` | Healer | Interactive step-through when the report/trace aren't conclusive |
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

- **Planner**: Parses schemas, maps CRUD lifecycles, and drafts the test matrix.
- **Generator**: Scaffolds `endpoints.ts`, Zod schemas, typed client classes, custom Playwright fixtures, Faker factories, and test specs.
- **Generator**: Runs a dry run (`npx playwright test --dry-run`) to verify zero TypeScript or import errors.
- **Healer**: Executes with `--reporter=json --trace on`, diagnoses any failures from the report/trace, patches, and re-runs until green.

### Scenario 2: Add a Single New Endpoint (Zero-Regression Append)

To add test coverage for a single new endpoint without modifying or breaking existing tests:

```
/generate POST /api/v1/users/{id}/reset-password with body { "newPassword": "string" }
```

**Behavior**: Operates in Strict Append Mode. Adds the route to `endpoints.ts`, appends the Zod schema and client method, adds a dynamic Faker builder, and appends a new `test.describe()` block at the end of the existing domain spec.

### Scenario 3: Sync Modified OpenAPI Specs (Contract Drift)

When backend teams update existing endpoints, add required fields, or change response models:

```
/generate openapi.yaml --sync
```

**Behavior**: Runs `contract-diff-analyzer` to identify breaking and non-breaking contract changes. Non-breaking changes (new optional fields, new endpoints) are applied directly. Breaking changes are surfaced in a sync report and require confirmation before schemas, factories, or test assertions are regenerated.

### Scenario 4: Autonomous Test Debugging & Self-Healing

If any test fails during execution:

```
The tests in src/tests/user.spec.ts failed with error 422. Use playwright-healer to inspect and fix the payload data.
```

**Behavior**: The healer re-runs the test with `--reporter=json --trace on`, inspects the JSON report and (if needed) the trace for the actual request/response bodies, classifies the root cause (bad factory data, schema mismatch, client bug, etc.), patches only the responsible layer, and re-verifies until the test passes — falling back to `--debug` for interactive step-through if the cause still isn't clear.

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
```

## 6. Architectural Rules & Best Practices

- **Centralized Routes**: Never hardcode endpoint strings in test specs; reference `src/config/endpoints.ts`.
- **Runtime Contract Validation**: Always use `Schema.parse(responseBody)` to catch backend contract breaks at runtime.
- **Automatic Authentication**: Rely on `src/fixtures/api.fixture.ts` for automatic token retrieval, caching, and role-based client injection (`userClient`, `adminUserClient`, `unauthRequest`).
- **Dynamic Data**: Always use `@faker-js/faker` factories in `src/factories/` rather than hardcoding static payload data.
- **Non-Destructive Appending**: When adding new endpoints to an existing codebase, never overwrite or delete existing working tests.
- **Evidence-Based Healing**: The Healer never patches or weakens a test based on guesswork — every fix must trace back to the JSON report or trace output. It will never delete/skip a failing test or loosen a Zod schema to force a pass; genuine backend contract breaks are flagged, not patched around.
- **Trace & Reporter Config Required**: `playwright.config.ts` must configure `trace: 'retain-on-failure'` and a JSON reporter output so the Healer always has structured diagnostic data available.
