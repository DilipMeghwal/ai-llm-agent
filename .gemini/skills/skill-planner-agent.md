---
name: playwright-planner
description: Analyzes API specs, maps dependencies, and drafts a test-case PLAN organized by test type (smoke/sanity/integration/regression/e2e) for user review before any code is generated.
---

# Agent Skill: Planner

## Objectives

1. **Dependency Analysis & DAG Construction**:
   - Map endpoint execution order (e.g., `POST /auth/login` → `POST /users` → `GET /users/:id` → `DELETE /users/:id`).
   - Identify shared state (e.g., entity IDs required across multiple endpoint calls). Flag these explicitly in the plan — the Generator will need to thread this state through `test.describe.serial()` blocks or fixture-scoped variables rather than independent tests.

2. **Scope Determination**:
   - Classify mode: `FULL_SUITE` (new project/domain), `INCREMENTAL_DIFF` (single route append), or `SCHEMA_SYNC` (modified spec).

3. **Test-Case Plan by Type** (this is the primary deliverable):
   Organize every proposed test case under one of the five types below. Not every endpoint needs every type — use judgment based on the endpoint's role:

   - **Smoke** (`@smoke`): One happy-path call for each core/critical endpoint only. Keep this list short by design.
   - **Sanity** (`@sanity`): Narrow checks for the specific endpoint(s) actually in scope for this run (relevant for `INCREMENTAL_DIFF` / `SCHEMA_SYNC` modes especially).
   - **Integration** (`@integration`): Multi-step flows that chain dependent endpoints together (the DAG from step 1), verifying data flows correctly across calls.
   - **Regression** (`@regression`): The full per-endpoint matrix — happy path, negative/validation (400/422), security (401/403), not-found/conflict (404/409).
   - **E2E** (`@e2e`): A realistic end-to-end user journey spanning multiple domains, only where the spec supports a coherent journey (e.g. signup → login → create resource → use it → clean up).

## Output Format (Text Plan for Review)

Before any code is written, output the plan as a plain-text/markdown table — do NOT generate files yet. Example:

```
## Proposed Test Plan — [domain] (mode: FULL_SUITE)

| # | Type | Endpoint(s) | Description | Expected Result |
|---|------|-------------|--------------|------------------|
| 1 | smoke | POST /auth/login | Valid credentials login | 200 + valid token |
| 2 | regression | POST /users | Missing required "email" field | 422 + validation error |
| 3 | integration | POST /users → GET /users/:id → DELETE /users/:id | Full lifecycle with shared user ID | Each step 2xx, final GET returns 404 |
| 4 | e2e | POST /auth/login → POST /orders → GET /orders/:id → POST /orders/:id/pay | New user places and pays for an order | Final status = "paid" |

Total: X smoke, Y sanity, Z integration, W regression, V e2e (N test cases)

Reply "approved" to generate this, or tell me what to change.
```

**STOP HERE.** Do not proceed to `playwright-generator` until the user explicitly approves the plan (e.g. "approved", "looks good", "generate it", "proceed"). If the user requests edits, revise the plan and re-present it — never assume silence or an unrelated reply means approval.

## Refactor Mode (`REFACTOR_EXISTING`)

Triggered by `/generate --refactor [path]` (path optional — defaults to scanning all of `src/tests/`). Use this when tests already exist and need to be brought up to current convention, not generated fresh.

### Audit Checklist

For each existing test file, check for and list gaps against:
- **Missing tags**: tests without `{ tag: '@...' }` — infer the likely type (smoke/sanity/integration/regression/e2e) from what the test does, but flag inferred tags as "suggested" since you're guessing intent from code, not from an approved plan.
- **Missing cleanup**: a test creates a resource (`POST`/`PUT` with an ID returned) but no `afterEach`/`afterAll` deletes it.
- **No shared-state threading**: multiple tests manually re-fetch or hardcode an ID that a prior test already created — candidate for `test.describe.serial()` consolidation.
- **Hardcoded routes**: literal URL strings instead of `src/config/endpoints.ts` references.
- **Hardcoded payloads**: static request bodies instead of `@faker-js/faker` factories.
- **No runtime validation**: response handling without `Schema.parse(responseJson)`.
- **Hardcoded credentials**: any literal token/password instead of sourcing from `src/fixtures/api.fixture.ts` / `process.env`.

### Refactor Plan Output

Present findings as a text table, same review-gate pattern as generation — do NOT edit any files yet:

```
## Proposed Refactor Plan — src/tests/user.spec.ts

| # | File | Issue | Proposed Change | Risk |
|---|------|-------|------------------|------|
| 1 | user.spec.ts:12 | No tag | Add { tag: '@regression' } (inferred from negative-case assertions) | Low — structural only |
| 2 | user.spec.ts:8-40 | No cleanup | Add afterEach to DELETE the user created at line 15 | Low — additive |
| 3 | user.spec.ts:45,52 | Hardcoded route "/api/v1/users" | Replace with ENDPOINTS.users.create | Low — structural only |
| 4 | user.spec.ts:60 | Hardcoded password "Test123!" | Move to factory or flag as intentional fixed test account | Manual review needed |

Total: 3 auto-applicable, 1 needs your input.
Reply "approved" to apply the auto-applicable changes, or tell me how to handle the flagged item(s).
```

**STOP HERE**, same as the generation plan — wait for explicit approval before `playwright-generator` touches any file. Items marked "Manual review needed" are never auto-applied even after approval of the rest; call them out separately.

## Optional Tooling

If the spec is fronted by a real UI (e.g., a login page in front of the API), use `npx playwright codegen <url>` to record the real login/auth flow and confirm actual request/response payloads before drafting the plan. Optional — never block planning on it.

## Output

Once approved, hand off the structured blueprint (dependency DAG + approved test-case list + scope mode) to `playwright-generator`, unchanged from what was approved.
