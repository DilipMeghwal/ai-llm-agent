---
name: generate
description: Autonomous pipeline (Planner -> Review Gate -> Generator -> Healer) to generate, update, append, or sync tagged smoke/sanity/integration/regression/e2e Playwright API tests.
---

# Command: /generate [spec-path-or-endpoint] [options]

## Usage Examples

- Full spec generation: `/generate openapi.yaml`
- Incremental endpoint add: `/generate POST /api/v1/users/{id}/reset-password`
- Specific endpoint from spec: `/generate openapi.yaml --endpoint /payments/refund`
- Diff / Sync updated spec: `/generate openapi.yaml --sync`
- Apply breaking sync changes: `/generate openapi.yaml --sync --force`
- Force overwrite (full regeneration): `/generate openapi.yaml --force`
- Refactor existing tests to current conventions: `/generate --refactor` (all of `src/tests/`) or `/generate --refactor src/tests/user.spec.ts` (one file)

---

## Autonomous Mode Selection

Before drafting a plan, inspect the target workspace and determine the execution mode:

- **FULL_GENERATION**: If domain files DO NOT exist or `--force` is passed (without `--sync`).
- **INCREMENTAL_APPEND**: If domain files exist and a single endpoint or diff is targeted.
- **SCHEMA_SYNC**: If `--sync` is passed. Breaking changes apply only with `--sync --force` (see `skill-contract-diff.md`).
- **REFACTOR_EXISTING**: If `--refactor` is passed. No spec is required — the Planner audits existing test files against current conventions instead of generating new test cases. See `skill-planner-agent.md` (Refactor Mode) and `skill-generator-agent.md` (Refactor Guardrails).

---

## Execution Steps

1. **Planning Phase** (`playwright-planner` / `contract-diff-analyzer`):
   - Analyze spec, extract routes and schemas, build dependency DAG.
   - Draft the test-case plan organized by type: smoke, sanity, integration, regression, e2e.
   - Present the plan as a plain-text table.

2. **Review Gate (mandatory, blocking)**:
   - **STOP.** Do not write any files yet.
   - Wait for the user to explicitly approve ("approved" / "proceed" / "generate it") or request changes.
   - If changes are requested, revise the plan and return to step 1 output. Repeat until approved.

3. **Generation Phase** (`playwright-generator`) — only after approval:
   - Write or append to `endpoints.ts`, JSON Schemas (AJV), domain clients, fixtures, factories, and spec files — exactly matching the approved plan, tagged by type (`@smoke`, `@sanity`, `@integration`, `@regression`, `@security`, `@e2e`).
   - Thread shared state for integration/e2e chains via `test.describe.serial()`.
   - Add cleanup/teardown for any created resources; use `src/global-setup.ts` for suite-wide shared state instead of per-file duplication.
   - Apply rate-limit/backoff handling in the client layer and collision-safe unique fields in factories.
   - Generate/update the companion `docs/test-cases/[domain].test-cases.md` (Jira-style) and `docs/contracts.md`.
   - On `FULL_GENERATION` for a brand-new project, scaffold `.github/workflows/playwright-tests.yml` if it doesn't already exist (see the template in the repo root).
   - Check Environment Safety (`system.md`) before executing anything against a live server.
   - Run `npx playwright test <spec-path> --dry-run` to confirm zero TypeScript/import errors.

4. **Self-Healing Phase** (`playwright-healer`):
   - Execute: `npx playwright test <spec-path> --reporter=json --trace on > test-results/report.json`.
   - Check the suite-level circuit breaker (>30% failure rate → report a likely shared root cause instead of patching individually).
   - Execute target test: `npx playwright test <spec-path> -g "<test-title>"`.
   - If tests fail, invoke `playwright-healer` to inspect the JSON report / trace, patch code, and re-run — up to 3 attempts per test. Unresolved tests after 3 attempts are written to `test-results/unresolved.md` and reported, not force-passed.
5. **No Auto-Push / Manual Version Control**:
   - Never run `git commit` or `git push` automatically. Keep all generated, refactored, and healed test code in the local working directory.
   - Stage, commit, or push changes only when the user explicitly requests it in chat.
