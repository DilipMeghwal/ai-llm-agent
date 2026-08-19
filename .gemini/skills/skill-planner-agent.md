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
   - **Integration** (`@integration`): Multi-step flows that chain dependent endpoints together (the DAG from step 1), verifying data flows correctly across calls. **Requirement**: Must explicitly define numbered test steps (e.g., Step 1: Create entity → Step 2: Retrieve & verify entity → Step 3: Update entity → Step 4: Delete & confirm 404), specifying passed state (IDs/tokens) and per-step assertion checkpoints.
   - **Regression** (`@regression`): The full per-endpoint matrix — happy path, negative/validation (400/422), not-found/conflict (404/409).
   - **Security** (`@security`): Auth boundaries (401/403), JWT tampering (expired/malformed/wrong-signature tokens), IDOR checks (user A attempting to access user B's resource by ID), basic injection payloads in string fields, CORS/security-header checks. Keep separate from `@regression` so it can be scheduled/reviewed independently.
   - **E2E** (`@e2e`): A realistic end-to-end user journey spanning multiple domains, only where the spec supports a coherent journey (e.g. signup → login → create resource → use it → clean up). **Requirement**: Must outline explicit multi-domain step breakdown with actions, prerequisites, state transitions, and per-step acceptance criteria.

## Assertion Scope (per test case — not status/schema alone)

Status code + `Schema.parse()` only proves the response has the right shape, not that it's *correct*. For every test case in the plan, specify which of these assertion categories apply — most tests need more than one:

1. **Status code** — the HTTP status itself.
2. **Schema/contract validation** — `Schema.parse(responseJson)`, shape only.
3. **Field-value assertions** — response fields match what was actually sent or computed (e.g. a created user's `email` echoes the request; a computed field like `total` equals `price * quantity`; a `createdAt` is a recent timestamp, not just "a string"). This is the most commonly skipped category — call it out explicitly per test case.
4. **Header assertions** — where meaningful: `Content-Type`, `Location` on a 201, pagination headers (`X-Total-Count`, `Link`), rate-limit headers if the spec defines them.
5. **Error-body assertions** — for 4xx/5xx cases, assert the actual error code/message content matches what's expected, not just the status number (e.g. a 422 for a missing `email` should specifically mention `email`, not just be "any 422").
6. **Business-rule assertions** — constraints described in the spec beyond basic types (uniqueness, non-negative balances, state-transition rules, ordering guarantees).
7. **Boundary/edge-case assertions** — min/max length, numeric limits, empty arrays/strings, where the spec defines them.
8. **Idempotency** (where applicable) — repeating a `PUT`/`DELETE` produces the same end state without erroring differently the second time.
9. **Pagination/sorting/filtering correctness** — for list endpoints, that returned items actually match the requested page/sort/filter, not just that a list was returned.
10. **Performance threshold** (optional, lightweight only) — e.g. response under a defined ms threshold; only include if the user asks for this, since it adds flakiness risk to CI.

List the applicable categories per test case in the plan (see Output Format below) so gaps are visible before code is generated, not after.

## Output Format (Text Plan for Review)

Before any code is written, output the plan as a plain-text/markdown table — do NOT generate files yet. Example:

```
## Proposed Test Plan — [domain] (mode: FULL_SUITE)

| # | Type | Endpoint(s) | Description | Assertions | Expected Result |
|---|------|-------------|--------------|------------|------------------|
| 1 | smoke | POST /auth/login | Valid credentials login | status, schema, field-value (token is non-empty JWT) | 200 + valid token |
| 2 | regression | POST /users | Missing required "email" field | status, error-body (message mentions "email") | 422 + specific validation error |
| 3 | regression | POST /users | Valid payload creates user | status, schema, field-value (response echoes submitted name/email), header (Location points to new resource) | 201 + full echoed user object |
| 4 | integration | POST /users → GET /users/:id → DELETE /users/:id | Full lifecycle with shared user ID | status+schema each step, field-value (GET returns same data POST created), status 404 confirms delete took effect | Each step 2xx, final GET returns 404 |
| 5 | e2e | POST /auth/login → POST /orders → GET /orders/:id → POST /orders/:id/pay | New user places and pays for an order | status+schema each step, business-rule (order total = sum of line items), field-value (final status field = "paid") | Final status = "paid" |

Total: X smoke, Y sanity, Z integration, W regression, U security, V e2e (N test cases)

Reply "approved" to generate this, or tell me what to change.
```

Once approved, each plan row becomes one Jira-style entry in the companion `docs/test-cases/[domain].test-cases.md` doc the Generator produces (see `skill-generator-agent.md` — Human-Readable Test Case Doc) — the plan's # column becomes that doc's Test Case ID, so the two stay traceable to each other.

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
- **Shallow assertions**: test only checks status code and/or schema shape with no field-value, error-body-content, or business-rule assertions — flag as a coverage gap (see plan format below), since strengthening assertions changes test intent and requires "Manual review needed", not auto-apply.
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
