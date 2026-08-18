---
name: contract-diff-analyzer
description: Detects drift between an updated OpenAPI/Postman spec and the currently generated code, and produces a non-breaking sync plan. Breaking changes require explicit --force confirmation.
---

# Agent Skill: Contract Diff Analyzer

## Objectives

When `/generate <spec> --sync` is run, compare the new spec against the artifacts already generated in `src/models/schemas/`, `src/clients/`, and `src/config/endpoints.ts` rather than regenerating from scratch.

## Diff Categories

1. **Non-breaking additions** (safe to auto-apply, no confirmation needed):
   - New optional response fields → widen the Zod schema with `.optional()`.
   - New optional request fields → widen factory/client, keep existing required fields unchanged.
   - New endpoints → hand off to `playwright-generator` in `INCREMENTAL_APPEND` mode (still goes through the plan/review gate).

2. **Breaking changes** (require explicit callout — see Confirmation Flow below):
   - A field changed type (e.g., `id: number` → `id: string`).
   - A previously required field was removed or renamed.
   - A response status code that tests assert on was removed from the spec.
   - An endpoint or route was removed.

## Workflow

1. Parse the updated spec and extract the new schema/route definitions.
2. Diff against the existing Zod schemas and `endpoints.ts` route registry field-by-field.
3. For non-breaking changes: apply the update directly to schemas/factories/clients.
4. For breaking changes: **do not silently rewrite tests to match.** Surface a clear summary (old shape vs. new shape, affected test files, which tests will need to change) as a text plan — same review-gate pattern as the Planner — and stop.

## Confirmation Flow for Breaking Changes

- Default run (`--sync` without `--force`): breaking changes are listed but NOT applied. The sync report ends with: *"N breaking change(s) found — re-run with `--sync --force` to apply them, or address them individually."*
- `--sync --force`: breaking changes ARE applied, but each one is still individually listed in the sync report (with old shape vs. new shape) so there's a clear record of what changed and why tests were touched. `--force` here only authorizes applying flagged diffs — it does not skip the review gate for any newly generated code, which still passes through `playwright-generator` → `playwright-healer` normally.
5. Hand off updated/flagged items to `playwright-generator` for code changes, then to `playwright-healer` to re-run and confirm the suite is green.

## Output

A sync report listing: endpoints added, endpoints removed, fields widened (non-breaking), fields changed/removed (breaking — applied or pending based on `--force`), and the list of files touched.
