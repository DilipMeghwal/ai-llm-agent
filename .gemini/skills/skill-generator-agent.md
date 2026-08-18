---
name: playwright-generator
description: Generates or appends strongly-typed, tagged Playwright code, Zod schemas, fixtures, and Faker factories strictly from the approved Planner test-case plan.
---

# Agent Skill: Generator

## Objectives
Consume the **approved** plan from `playwright-planner` (never generate from an unapproved draft) and generate/modify the following layers:

### 1. Route Registry (`src/config/endpoints.ts`)
- Append/register immutable endpoint keys and parameterized route functions.

### 2. Contract & Types (`src/models/`)
- `schemas/[domain].schema.ts`: Zod schemas for request payloads and response contracts.
- `types/[domain].types.ts`: Export inferred TypeScript types (`z.infer<typeof ...>`).

### 3. Clients & Fixtures (`src/clients/` & `src/fixtures/`)
- `clients/[domain].client.ts`: Expose strongly typed methods wrapping `APIRequestContext`.
- `fixtures/api.fixture.ts`: Register domain clients into Playwright's `test.extend` fixture registry.

### 4. Dynamic Factories (`src/factories/[domain].factory.ts`)
- Build `@faker-js/faker` test data builders for valid and mutated negative test payloads.

### 5. Test Specs (`src/tests/[domain].spec.ts`)
- Write tests using custom fixtures with strict runtime validation (`Schema.parse(responseJson)`).
- **Tag every test** with its approved type: `test('description', { tag: '@smoke' }, async ({ userClient }) => { ... })`.
- **Thread shared state for integration/e2e flows**: use `test.describe.serial('...', () => { ... })` with a module-scoped variable (e.g. `let createdUserId: string`) so dependent steps (create → read → update → delete) run in order and share IDs. Never write independent/parallel tests for steps the Planner flagged as dependent.

## Refactor Guardrails (when handling an approved Refactor Plan)

Refactor edits are structural only — apply exactly the changes listed in the approved refactor plan, in the existing files, and nothing else:

- **Never change**: assertion values, expected status codes, request payload values used by an existing test, or test titles/descriptions in a way that changes their meaning.
- **Only touch**: tags, `afterEach`/`afterAll` cleanup blocks, imports, route/factory/schema references (replacing hardcoded values with the centralized equivalent — same literal value, different source), and file/describe-block structure (e.g. wrapping already-related tests in `test.describe.serial()`).
- **Skip anything flagged "Manual review needed"** in the plan — do not auto-resolve it, even if a fix seems obvious.
- **One file at a time, verify, then continue**: after refactoring a file, run `npx playwright test <file>` to confirm identical pass/fail behavior to before the refactor (a previously-passing test must still pass; a previously-failing test refactor is out of scope — that's a Healer job, not a refactor job). If behavior changes, revert that file's edit and flag it back to the user instead of proceeding to the next file.

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
