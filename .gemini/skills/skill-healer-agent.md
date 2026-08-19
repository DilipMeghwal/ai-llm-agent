---
name: playwright-healer
description: Executes generated tests, diagnoses failures via the Playwright CLI (JSON report + trace), and autonomously patches schemas, factories, or client code within a bounded retry budget.
---

# Agent Skill: Healer

## Objectives

Autonomously drive a failing test suite to green without human intervention, using the Playwright CLI as the source of truth — never guess at a fix without evidence from a run. Stop and report if a fix can't be found within the retry budget rather than looping indefinitely.

## Pre-Flight: Environment Check

Before executing anything, resolve the active `ENV`/`BASE_URL`. If it is not clearly `.env.local` or `.env.qa` (see `system.md` Environment Safety rule), stop and ask the user for explicit confirmation before running any test against it. Never execute mid-heal-loop against an unconfirmed environment.

## Pre-Flight: Suite-Level Circuit Breaker

Before entering the per-test patch loop, check the overall failure rate from the first full run. **If more than 30% of tests failed**, do not start patching them individually — that's very likely one shared root cause (environment down, expired shared test credentials, a genuine widespread contract break), not 15 unrelated bugs. Instead:
1. Inspect 2-3 of the failures for a common pattern (same error type/status/timeout).
2. Report the likely shared cause to the user and stop, rather than burning the per-test retry budget on symptoms.
3. Only proceed to the normal per-test loop below once the failure rate drops under this threshold, or the user confirms the failures are genuinely unrelated.

## Diagnosis Workflow

1. **Run with structured output**:
   ```bash
   npx playwright test <spec-path> --reporter=json --trace on > test-results/report.json
   ```
   Parse `report.json` for: failing test title, expected vs. actual matcher values, HTTP status code, and error stack. Redact any `Authorization`, `Bearer`, cookie, or password-like value before quoting report content back to the user.

2. **If the JSON report doesn't explain the failure** (e.g., an AJV validation error with no obvious mismatched field, or a flaky timing issue), pull the trace:
   ```bash
   npx playwright show-trace test-results/<test-name>/trace.zip
   ```
   Inspect the actual request payload sent, response body received, response headers, and timing waterfall — again, redact credential-like values before summarizing.

3. **If still unclear**, step through interactively:
   ```bash
   npx playwright test <spec-path> -g "<test-title>" --debug
   ```

## Classify the Root Cause (Diagnostic Taxonomy Matrix)

Classify the failure into one of the following explicit categories before attempting any patch:

1. **`CATEGORY_INFRASTRUCTURE_DOWN`** (HTTP 5xx, 404 HTML, gateway timeout, socket hangup):
   - Server or network environment is unavailable. **Action**: Do NOT patch test code; report environment downtime to the user immediately.
2. **`CATEGORY_CONTRACT_DRIFT`** (AJV schema validation failed — domain `parseX()` threw):
   - Response payload shape differs from `src/models/schemas/[domain].schema.ts`. Read `ajv.errorsText()` output for the exact mismatch. **Action**: If confirmed backend spec change, patch schema or flag contract drift.
3. **`CATEGORY_DATA_COLLISION`** (409 Conflict, duplicate key failure):
   - Factory produced duplicate unique field values. **Action**: Patch `src/factories/[domain].factory.ts` worker-scoped uniqueness suffix.
4. **`CATEGORY_AUTH_EXPIRED`** (401 Unauthorized / 403 Forbidden on valid authenticated call):
   - Auth token is missing, expired, or rejected. **Action**: Patch `src/fixtures/api.fixture.ts` token retrieval/caching logic.
5. **`CATEGORY_CLIENT_ROUTE_BUG`** (Wrong HTTP method, path parameter string interpolation issue):
   - Client wrapper or endpoint constant contains syntax or path error. **Action**: Patch `src/clients/[domain].client.ts` or `src/config/endpoints.ts`.
6. **`CATEGORY_STATE_THREADING_BREAK`** (Integration/E2E step failed due to unpassed state):
   - Shared variable was not passed from preceding step. **Action**: Patch `test.describe.serial()` state scoping.

## Patch & Re-verify Loop (Bounded)

After each patch:
```bash
npx playwright test <spec-path> -g "<test-title>"
```
- **Retry budget: 3 patch attempts per failing test.** Track attempt count per test.
- If a test still fails after 3 attempts, **stop patching that test**, mark it clearly as "unresolved after 3 attempts" in the final summary along with the last diagnosis, and move on — do not keep retrying indefinitely or escalate to broader refactors.
- **Write unresolved tests to `test-results/unresolved.md`** (create if absent, append if present) with: test name, file path, attempt count, last diagnosis, and the trace file path if one was captured. This keeps unresolved failures trackable across sessions instead of only living in chat scrollback. Also update the test's entry in `docs/test-cases/[domain].test-cases.md` (Status → `⚠️ Unresolved`) if that doc exists.
- Once all resolvable tests pass, run the full domain spec to confirm no regression:
  ```bash
  npx playwright test <spec-path>
  npx playwright show-report
  ```

## Guardrails

- Never delete or skip a failing test to make the suite pass — fix the underlying code, or flag it as unresolved/a genuine contract break.
- Never weaken a JSON Schema (e.g., removing a field from `required`, widening a `type` to accept anything, or setting `additionalProperties: true`) unless the trace evidence confirms the live API contract actually changed.
- **Never "fix" a failing test by widening its assertion** — turning a specific expected status into a multi-status `toContain([...])` list, wrapping the call in a `try/catch` that swallows the error, or replacing a real assertion with a tautology (`expect(true).toBe(true)`). These make the test unable to fail again, which is worse than leaving it failing and reported as unresolved. See `skill-generator-agent.md` Forbidden Patterns — the same list applies here.
- If you encounter an existing test that already contains one of these forbidden patterns (rather than one you'd be tempted to write), do not "heal" it by leaving the hedge in place — flag it in the summary as needing a real fix, the same as an unresolved failure.
- Limit each heal cycle to the smallest patch that resolves the diagnosed root cause — do not refactor unrelated code.
- Never print raw secrets/tokens from the report, trace, or environment while diagnosing or summarizing — see `system.md` Secrets Handling rule.
- Never run `git commit` or `git push` automatically after healing — keep all patched test code in the local working directory and only perform version control commands when explicitly requested by the user.
