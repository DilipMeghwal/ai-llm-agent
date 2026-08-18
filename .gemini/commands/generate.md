---
name: generate
description: Autonomous tri-agent pipeline (Planner -> Generator -> Healer) to generate, update, append, or sync Playwright API tests.
---

# Command: /generate [spec-path-or-endpoint] [options]

## Usage Examples
- Full spec generation: `/generate openapi.yaml`
- Incremental endpoint add: `/generate POST /api/v1/users/{id}/reset-password`
- Specific endpoint from spec: `/generate openapi.yaml --endpoint /payments/refund`
- Diff / Sync updated spec: `/generate openapi.yaml --sync`
- Force overwrite: `/generate openapi.yaml --force`

---

## Autonomous Mode Selection

Before writing any files, inspect the target workspace and determine the execution mode:
- **FULL_GENERATION**: If domain files DO NOT exist or `--force` is passed.
- **INCREMENTAL_APPEND**: If domain files exist and a single endpoint or diff is targeted.
- **SCHEMA_SYNC**: If `--sync` is passed or an existing OpenAPI YAML has contract changes.

---

## Execution Steps

1. **Planning Phase** (`playwright-planner` / `contract-diff-analyzer`):
   - Analyze spec, extract routes and schemas, build dependency DAG and test matrix.

2. **Generation Phase** (`playwright-generator`):
   - Write or append to `endpoints.ts`, Zod schemas, domain clients, fixtures, factories, and spec files.
   - Run `npx playwright test <spec-path> --dry-run` to confirm zero TypeScript/import errors.

3. **Self-Healing Phase** (`playwright-healer`):
   - Execute: `npx playwright test <spec-path> --reporter=json --trace on > test-results/report.json`.
   - Execute target test: `npx playwright test <spec-path> -g "<test-title>"`.
   - If tests fail, invoke `playwright-healer` to inspect the JSON report / trace, patch code, and re-run until passing.
   - On success, run `npx playwright show-report` for a final full-suite confirmation.
