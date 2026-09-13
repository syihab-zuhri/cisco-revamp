# Agent Handoff Instructions

> Project: NetLab | Document ID: DOC-AGENTS-001 | Version: 0.1.0 | Status: Draft
> Depends On: all blueprint documents

## Reading Order

All agents read `PROJECT_MANIFEST.md`, `PLANNING.md`, `SRS.md`, then their domain docs. Frontend reads `DESIGN.md`/`DSD.md` once available. Backend reads `ERD.md`/`API.md`/`SECURITY.md`. QA reads `TESTING.md`/`TRACEABILITY.md`. DevOps reads `ARCHITECTURE.md`/`ENVIRONMENT.md`/`RUNBOOK.md`.

## Global Invariants

- `INV-001` API contract first.
- `INV-002` schema change updates ERD and migration plan.
- `INV-003` no secrets in code/docs/logs/tests.
- `INV-004` server validates authorization, schema, size, and version.
- `INV-005` simulator deterministic for same input/version.
- `INV-006` UTC storage.
- `INV-007` external calls have timeout/retry/metric.
- `INV-008` UI uses canonical design tokens; no invented token during implementation.

## Agent Scope

- Product: scope, content, acceptance; may not silently alter P0.
- Frontend: web UI, canvas, animation projection; may not alter domain rules or API without contract update.
- Backend: session, API, realtime, storage; may not expose other participant workspace.
- Domain/Data: simulator/evaluator/schema; owns deterministic rules and fixtures.
- QA: tests and evidence; may block release on failed P0 gate.
- Security: threat model, abuse tests, secret/privacy review.
- DevOps: environment, deployment, health, rollback; no production destructive action without approval.

## Escalation

On conflict, stop, cite document/ID, report observed difference, and request an ADR or change request. Do not improvise around an API, ERD, permission, or design-token conflict.

## Definition of Done

Code compiles, relevant tests pass, contract/docs updated, security/privacy impact reviewed, telemetry/logging added where relevant, and traceability links are updated.
