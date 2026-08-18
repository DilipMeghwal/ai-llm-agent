---
name: playwright-planner
description: Analyzes API specs, maps CRUD lifecycles/dependencies, and drafts a structured execution blueprint and test matrix.
---

# Agent Skill: Planner

## Objectives

1. **Dependency Analysis & DAG Construction**:
   - Map endpoint execution order (e.g., `POST /auth/login` → `POST /users` → `GET /users/:id` → `DELETE /users/:id`).
   - Identify shared state (e.g., entity IDs required across multiple endpoint calls).

2. **Scope Determination**:
   - Classify mode: `FULL_SUITE` (new project/domain), `INCREMENTAL_DIFF` (single route append), or `SCHEMA_SYNC` (modified spec).

3. **Matrix Design**:
   - Generate test matrix specifying:
     - 2xx Happy Path + Zod runtime contract validation.
     - 400/422 Negative validation payloads (missing fields, bad types).
     - 401/403 Security access boundaries.
     - 404/409 Resource state checks.

## Optional Tooling

If the spec is fronted by a real UI (e.g., a login page in front of the API), use `npx playwright codegen <url>` to record the real login/auth flow and confirm actual request/response payloads before handing schemas to the Generator. This is optional and only applies when a live environment is available — never block planning on it.

## Output

Hand off a structured blueprint (dependency DAG + test matrix + scope mode) to `playwright-generator`.
