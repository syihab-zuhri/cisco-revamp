# System Architecture

> **Project:** NetLab | **Document ID:** DOC-ARCH-001 | **Version:** 0.1.0 | **Status:** Draft
> **Depends On:** `PLANNING.md`, `SRS.md`, `ERD.md`, `API.md`

## Direction

Modular monolith: one deployable application containing HTTP API, realtime gateway, session service, simulator domain, evaluator, and temporary persistence. Avoid microservices until measurable triggers occur.

## Modules

- `web`: teacher/student routes, canvas UI, accessibility states.
- `classroom`: session lifecycle, host authority, participant presence.
- `simulator-core`: pure deterministic topology, addressing, connectivity, packet events.
- `exercise`: schema, target rules, evaluator, scoring.
- `workspace`: versioning, local/server persistence, import/export.
- `realtime`: authenticated channel, sequence, snapshots, reconnect.
- `storage`: repository interfaces and temporary data implementation.
- `observability`: structured logs, metrics, health checks.

## Trust Boundaries

1. Browser to HTTP/WebSocket: untrusted input; TLS, token validation, rate limits.
2. API to domain: schema and authorization boundary.
3. Domain to storage: validated objects only.
4. Teacher projection to participant projection: never leak host credential or other workspace raw state.

## Data Flow

```text
Teacher/Student Browser -> HTTP API -> Session Service -> Store
                         -> WebSocket Gateway <-> Realtime Event Bus (in-process P0)
Simulator Core -> Packet Events -> Animation Projection + Exercise Evaluator
```

## Consistency

Server owns class lifecycle and participant/session projection. Workspace uses optimistic version. WebSocket sequence is monotonic per session. Client detects gap and requests snapshot. Packet animation is local deterministic projection and does not mutate classroom state except explicit workspace commands.

## Failure Modes

- WebSocket loss: local autosave, reconnect, snapshot reconciliation.
- Host loss: `host_disconnected`, grace period, then session restricted/closed.
- Store outage: reject state-changing request, preserve local export, health alert.
- Invalid payload: canonical 4xx; no domain mutation.
- Animation overload: reduce visual detail/frame rate while keeping logical result.

## Scale Triggers

Stay modular monolith until any trigger is measured: sustained realtime connections exceed deployment capacity; event loop latency breaches NFR; storage volume/retention requires separate service; more than one team needs independent release ownership; multi-region is required. Numbers are deployment-specific and TBD.

## Global Invariants

- `INV-001`: API changes start in `API.md`/`openapi.yaml`.
- `INV-002`: schema changes update ERD and migration plan together.
- `INV-003`: no secret in code/docs/logs/tests.
- `INV-004`: server validates every authority and version.
- `INV-005`: simulator result is deterministic for same input/version.
- `INV-006`: timestamps UTC.
- `INV-007`: external calls have timeout/retry/metric.
- `INV-008`: UI uses design tokens only once `DESIGN.md` exists.

## Complexity Budget

Maximum one first-party deployable service for P0. No message broker, microservice, or managed identity provider without ADR and measurable driver.
