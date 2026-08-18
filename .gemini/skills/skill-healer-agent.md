---
name: playwright-healer
description: Executes generated tests, diagnoses failures via the Playwright CLI (JSON report + trace), and autonomously patches schemas, factories, or client code until tests pass.
---

# Agent Skill: Healer

## Objectives

Autonomously drive a failing test suite to green without human intervention, using the Playwright CLI as the source of truth — never guess at a fix without evidence from a run.

## Diagnosis Workflow

1. **Run with structured output**:
   ```bash
   npx playwright test <spec-path> --reporter=json --trace on > test-results/report.json
   ```
   Parse `report.json` for: failing test title, expected vs. actual matcher values, HTTP status code, and error stack.

2. **If the JSON report doesn't explain the failure** (e.g., a Zod parse error with no obvious mismatched field, or a flaky timing issue), pull the trace:
   ```bash
   npx playwright show-trace test-results/<test-name>/trace.zip
   ```
   Inspect the actual request payload sent, response body received, response headers, and timing waterfall.

3. **If still unclear**, step through interactively:
   ```bash
   npx playwright test <spec-path> -g "<test-title>" --debug
   ```

## Classify the Root Cause

- **Schema mismatch** (Zod `parse()` threw) → the live response no longer matches `src/models/schemas/[domain].schema.ts`. Patch the schema to reflect reality, regenerate the inferred type.
- **Factory produced invalid data** (400/422 on what should be a happy path) → patch `src/factories/[domain].factory.ts` (e.g., a Faker generator producing an out-of-range or wrong-type value).
- **Client/route bug** (wrong method, wrong path param interpolation, wrong header) → patch `src/clients/[domain].client.ts` or `src/config/endpoints.ts`.
- **Fixture/auth issue** (401 on a request that should be authenticated) → patch `src/fixtures/api.fixture.ts` token retrieval/caching logic.
- **Genuine backend contract break** (not something the test can be fixed around) → do NOT silently loosen assertions. Flag it explicitly in the final report as a contract break requiring `contract-diff-analyzer` / backend team attention.

## Patch & Re-verify Loop

After each patch:
```bash
npx playwright test <spec-path> -g "<test-title>"
```
Repeat diagnosis → patch → re-verify until the targeted test(s) pass. Then run the full domain spec to confirm no regression:
```bash
npx playwright test <spec-path>
npx playwright show-report
```

## Guardrails

- Never delete or skip a failing test to make the suite pass — fix the underlying code or flag it as a genuine contract break.
- Never weaken a Zod schema (e.g., making a required field optional, widening a type to `any`) unless the trace evidence confirms the live API contract actually changed.
- Limit each heal cycle to the smallest patch that resolves the diagnosed root cause — do not refactor unrelated code.
