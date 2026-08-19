---
name: playwright-generator
description: Generates or appends strongly-typed, tagged Playwright code, AJV/JSON Schema contracts, fixtures, and Faker factories strictly from the approved Planner test-case plan.
---

# Agent Skill: Generator

## Objectives

Consume the **approved** plan from `playwright-planner` (never generate from an unapproved draft) and generate/modify the following layers:

### 1. Route Registry (`src/config/endpoints.ts`)

- Append/register immutable endpoint keys and parameterized route functions.

### 2. Contract & Types (`src/models/`) — AJV / JSON Schema Convention

- `schemas/[domain].schema.ts`: JSON Schema definitions (`as const`) for request payloads and response contracts, compiled with AJV, wrapped in a `parseX()` helper that throws on validation failure — this mirrors the ergonomics of `Schema.parse()` at every call site.
- `types/[domain].types.ts`: TypeScript interfaces inferred from the JSON Schema via `FromSchema<typeof schema>` (`json-schema-to-ts`) — no hand-duplicated types.
- **Prefer lifting schemas directly from the OpenAPI spec's `components.schemas`** when generating from `openapi.yaml` — OpenAPI schemas are JSON Schema already, so this avoids re-authoring contracts by hand. Caveat: OpenAPI 3.0 uses `nullable: true` instead of standard JSON Schema `type: [X, "null"]` — convert this during extraction so AJV validates it correctly.

Standard pattern for every domain schema file:

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

`additionalProperties: false` is the default posture (matches Zod's default strictness) — only relax it when the spec explicitly allows extension fields.

### 3. Clients & Fixtures (`src/clients/` & `src/fixtures/`)

- `clients/[domain].client.ts`: Expose strongly typed methods wrapping `APIRequestContext`.
- `fixtures/api.fixture.ts`: Register domain clients into Playwright's `test.extend` fixture registry.
- **Rate-limit/backoff handling**: `src/clients/base.client.ts` must treat HTTP 429 (and 502/503) as retryable, not as a hard failure or an acceptable outcome to assert on. Implement exponential backoff with a capped retry count:
  ```ts
  async function requestWithBackoff(fn: () => Promise<APIResponse>, maxRetries = 3): Promise<APIResponse> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const response = await fn();
      if (response.status() !== 429 && response.status() !== 503) return response;
      if (attempt === maxRetries) return response; // let the test see the final failure
      await new Promise((r) => setTimeout(r, 2 ** attempt * 250));
    }
    throw new Error('unreachable');
  }
  ```
  Never write a test that treats 429 as an accepted outcome (`expect([200, 429]).toContain(...)`) — that's the multi-status forbidden pattern. Retry transparently in the client; the test only sees the real final result.

### 4. Dynamic Factories (`src/factories/[domain].factory.ts`)

- Build `@faker-js/faker` test data builders for valid and mutated negative test payloads.
- **Test data collision safety**: for any field that must be unique (email, username, etc.), suffix generated values with a run-scoped or worker-scoped identifier so parallel/sharded test runs never collide:
  ```ts
  import { faker } from '@faker-js/faker';
  import { test } from '@playwright/test';

  export function buildUser() {
    const workerId = test.info().workerIndex;
    const uniqueSuffix = `${workerId}-${Date.now()}`;
    return {
      email: `test.${uniqueSuffix}@example.com`,
      username: `user_${uniqueSuffix}`,
      // non-unique fields stay purely random via faker as usual
      firstName: faker.person.firstName(),
    };
  }
  ```
  Never generate a factory with a hardcoded/static unique field — that's a guaranteed collision under parallel execution or repeated runs against a persistent environment.

### 5. Security Test Generation (for `@security` plan rows)

- **Auth boundary**: call the endpoint with no token, an expired token, and a malformed/tampered token — assert 401 in each case with the specific error body, not just "some 4xx."
- **IDOR**: create a resource as User A, attempt to read/update/delete it as User B — assert 403/404 (per the spec's actual documented behavior; don't assume which one without checking).
- **Injection probes**: for string input fields, include a factory variant with common injection payloads (e.g. `' OR '1'='1`, `<script>alert(1)</script>`) and assert the API either rejects it (400/422) or safely stores/escapes it — never assert success without checking the field wasn't executed/reflected unsafely.
- **CORS/headers**: where the spec defines them, assert expected security headers are present on responses (e.g. no `Access-Control-Allow-Origin: *` on an authenticated endpoint, if that's the documented policy).

### 6. Test Specs (`src/tests/[domain].spec.ts`)

- Write tests using custom fixtures with strict runtime validation via the domain's `parseX()` helper (e.g. `parseUser(responseJson)`), never inline `ajv.compile()` calls inside a test.
- **Implement every assertion category listed for that test case in the approved plan** — status/schema alone is the floor, not the ceiling. Concretely, for a given test case:
  - Assert the status code.
  - Call `parseX(responseJson)` for shape validation (throws with `ajv.errorsText()` detail on mismatch).
  - Assert actual field values where the plan calls for it — e.g. `expect(response.email).toBe(payload.email)`, computed fields checked against their formula, timestamps checked as recent/valid rather than merely present.
  - Assert relevant headers (`Content-Type`, `Location` on creates, pagination headers on list endpoints) when the plan calls for it.
  - For error cases, assert the error body content (code/message), not just the status number — e.g. `expect(response.body.errors).toContainEqual(expect.objectContaining({ field: 'email' }))`, not just `expect(status).toBe(422)`.
  - For business-rule cases, assert the rule directly (e.g. uniqueness by attempting a duplicate and expecting a conflict; a computed total by checking the arithmetic).
- **Thread shared state & step structure for integration/e2e flows**: Structure multi-step integration and E2E flows using single clean test case titles (e.g. `test('User reset password and authentication flow', { tag: '@integration' }, async (...) => { ... })`). Inside the test body, encapsulate each step using Playwright's native `await test.step('1. <step description>', async () => { ... })` syntax. Do not prefix top-level test titles with 'Step 1:', 'Step 2:'. Always register resource cleanup in a `finally` block or `afterAll` hook to prevent orphaned data.

### 7. Human-Readable Test Case Doc (`docs/test-cases/[domain].test-cases.md`)

For every `tests/[domain].spec.ts` generated or appended, produce/update a companion Jira-style test case document at `docs/test-cases/[domain].test-cases.md`. This document must be **framework-agnostic, generic, and readable by everyone** (QA leads, product managers, business analysts, auditors).

**Hard Rules for Test Case Documentation**:

- **No Code Implementation Coupling**: Do NOT include code variable names, class names, client fixture names (`userClient`, `adminUserClient`), code helper/factory names (`buildUser()`), or test runner constructs (`describe.serial()`, `test.step()`).
- **Generic Preconditions & Test Data**: State preconditions and test data in plain business/API terms (e.g. "Authenticated user with admin authorization", "Valid User Registration Payload").
- **Clean Business Actions**: Step actions and expected results must describe business-level API calls without code snippets.

One entry per approved plan row, in this format:

```markdown
## TC-003: Full user lifecycle via API

**Jira Story:** PROJ-1234
**Epic:** User Management
**Type:** 🔗 Integration | **Priority:** P1

**As a** backend service consumer
**I want** to create, retrieve, and delete a user through the API
**So that** the full resource lifecycle behaves consistently and leaves no orphaned data

**Preconditions:**

- Authenticated user with administrative privileges

**Test Steps:**

| Step | Action                                                          | Expected Result                                           |
| ---- | --------------------------------------------------------------- | --------------------------------------------------------- |
| 1    | Send a `POST` request to `/users` with a valid, unique payload  | HTTP `201 Created` status returned with created User ID   |
| 2    | Send a `GET` request to `/users/{id}` using the created User ID | HTTP `200 OK` status returned with matching user details  |
| 3    | Send a `DELETE` request to `/users/{id}`                        | HTTP `204 No Content` status returned                     |
| 4    | Send a `GET` request to `/users/{id}` again                     | HTTP `404 Not Found` status returned, confirming deletion |

**Test Data:** Valid User Details (Unique Username/Email)

**Acceptance Criteria:**

- [ ] Each step returns the exact designated HTTP status code
- [ ] Retrospective GET response fields match submitted creation fields
- [ ] Resource is deleted upon completion to prevent orphaned test data

**Automation Reference:** `tests/user.spec.ts` (`@integration`)
**Status:** ✅ Automated
```

Keep this doc in sync: when `playwright-healer` marks a test unresolved, or `contract-diff-analyzer` flags a breaking change affecting a test, reflect that in the relevant entry's **Status** field (e.g. `⚠️ Unresolved`, `🔴 Needs update — contract changed`) rather than leaving it stale.

### 8. Contract Reference Doc (`docs/contracts.md`)

Whenever a JSON Schema in `src/models/schemas/` is created or changed, update the corresponding section of `docs/contracts.md` — a human-readable listing of every domain's fields, types, required/optional status, and format constraints, generated from the schema (not hand-maintained separately):

```markdown
## User

| Field     | Type   | Required | Format    | Notes |
| --------- | ------ | -------- | --------- | ----- |
| id        | string | ✅       | uuid      |       |
| email     | string | ✅       | email     |       |
| createdAt | string | ✅       | date-time |       |
```

### 9. Global Setup (when the plan requires shared suite-wide state)

If the Planner's plan notes that multiple domains depend on the same seeded reference data (not per-test resources — see cleanup rules below), add/extend `src/global-setup.ts` and register it in `playwright.config.ts`'s `globalSetup` option, rather than duplicating the same setup call across multiple spec files.

## Refactor Guardrails (when handling an approved Refactor Plan)

Refactor edits are structural only — apply exactly the changes listed in the approved refactor plan, in the existing files, and nothing else:

- **Never change**: assertion values, expected status codes, request payload values used by an existing test, or test titles/descriptions in a way that changes their meaning.
- **Only touch**: tags, `afterEach`/`afterAll` cleanup blocks, imports, route/factory/schema references (replacing hardcoded values with the centralized equivalent — same literal value, different source), and file/describe-block structure (e.g. wrapping already-related tests in `test.describe.serial()`).
- **Skip anything flagged "Manual review needed"** in the plan — do not auto-resolve it, even if a fix seems obvious.
- **One file at a time, verify, then continue**: after refactoring a file, run `npx playwright test <file>` to confirm identical pass/fail behavior to before the refactor (a previously-passing test must still pass; a previously-failing test refactor is out of scope — that's a Healer job, not a refactor job). If behavior changes, revert that file's edit and flag it back to the user instead of proceeding to the next file.

## Forbidden Patterns (Hard Rule — self-check before finishing)

These patterns make a test unable to fail, which defeats the entire purpose of the suite. Never generate them, under any circumstances, even to "make a flaky test pass" or "handle uncertainty about the response":

- **Multi-status-code OR matching**: `expect([200, 400, 500]).toContain(response.status())` or similar. A test asserts the ONE status code specified in the approved plan's "Expected Result" — never a list of acceptable outcomes. If the real API can legitimately return different statuses depending on state, that's two different test cases in the plan (e.g. "deposit with sufficient funds → 200" and "deposit with invalid account → 404"), not one test with a status list.
- **Swallowing errors with a tautological assertion**: `try { ... } catch { expect(true).toBe(true) }` or any `catch` block that doesn't re-throw or assert something specific about the caught error. If a request can throw, let it throw and fail the test — that's a real signal, not something to hide.
- **Any assertion that cannot fail**: `expect(true).toBe(true)`, `expect(response).toBeDefined()` as the only check, `expect(response.status()).toBeGreaterThanOrEqual(200)` as a stand-in for a specific expected code, or any matcher wide enough to pass regardless of the actual response.
- **Empty or comment-only test bodies**: a test that only logs/comments what it "would" check instead of asserting it.

**Before marking any test file complete, scan your own output for these patterns.** If you find one, it means you weren't able to determine the correct single expected outcome — stop and ask the user to clarify the expected behavior rather than generating a hedge. A failing-but-honest test is always better than a passing-but-meaningless one.

## Scope Discipline

Generate **exactly** the test cases listed in the approved plan — no more, no fewer. Do not add extra negative cases, extra fields, or "while I'm at it" coverage beyond what was reviewed. If you notice a gap while generating, note it back to the user for the next planning round rather than silently expanding scope.

## Cleanup & Test Isolation

Every test (or `describe.serial` block) that creates a resource must clean it up:

- Prefer an `afterEach`/`afterAll` hook that deletes/reverts anything created during the test, using the same client the test used.
- For integration/e2e chains, the final step of the chain should itself be (or be followed by) a cleanup call — don't leave orphaned records in the target environment.
- If the API has no delete/revert endpoint for a resource, note this explicitly as a comment in the generated spec so a human knows manual cleanup may be needed.

## Secrets Handling

Never hardcode credentials, tokens, or API keys into generated code — always source them via `src/fixtures/api.fixture.ts` reading from `process.env`. Never log or comment out actual token/credential values in generated files.

## Validation Before Handoff

After writing files, run `npx playwright test <spec-path> --dry-run` to confirm zero TypeScript/import errors before handing off to `playwright-healer` for the real execution pass. Skip execution (dry-run only) if the resolved environment is not local/QA — see `system.md` Environment Safety rule.
