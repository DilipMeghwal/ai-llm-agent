---
name: playwright-generator
description: Generates or appends strongly-typed Playwright code, Zod schemas, fixtures, and Faker factories based on the Planner blueprint.
---

# Agent Skill: Generator

## Objectives
Consume the blueprint from `playwright-planner` and generate/modify the following layers:

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

## Validation Before Handoff

After writing files, run `npx playwright test <spec-path> --dry-run` to confirm zero TypeScript/import errors before handing off to `playwright-healer` for the real execution pass.
