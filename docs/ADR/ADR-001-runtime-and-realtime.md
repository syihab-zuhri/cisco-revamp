# ADR-001: Modular Monolith with Server-Authoritative Realtime

- Status: Accepted
- Date: 2026-09-13
- Accepted On: 2026-09-13
- Acceptance Evidence: Next.js 16 modular monolith scaffold is live; P0 domain tests pass; server-authoritative session boundary is implemented in `lib/classroom/session.ts` and `lib/classroom/security.ts`.
- Owners: Product Owner, Tech Lead
- Decision Class: Type-1
- Related Requirements: FR-001..FR-009, FR-021, NFR-001..NFR-005

## Context

P0 needs an online teacher-hosted class, participant presence, exercise distribution, teacher monitoring, reconnect, and temporary workspace state. A static-only client cannot reliably enforce host authority or provide shared session projection.

## Decision Drivers

P0 fit, no-login access, open-source control, simple operations, deterministic simulator, and realistic future path to persistent classes.

## Considered Options

| Criterion | Weight | Modular monolith + WebSocket | Managed realtime backend | Microservices + broker |
|---|---:|---:|---:|---:|
| P0 fit | 30% | 5 | 5 | 3 |
| Control/open-source | 20% | 5 | 2 | 4 |
| Operational simplicity | 20% | 4 | 5 | 2 |
| Evolution path | 15% | 4 | 5 | 5 |
| Team complexity | 15% | 5 | 4 | 2 |
| Weighted score | 100% | **4.60** | **4.00** | **3.20** |

## Decision

Choose one modular monolith with HTTP and WebSocket interfaces. Server is authoritative for classroom lifecycle, participant permission, event sequence, and workspace version. Simulator core is a pure module. Use an in-process event mechanism for P0; add external broker only after scale trigger.

## Consequences

Positive: fewer deployables, clear authority, easy local development, open-source-friendly. Negative: one process is a failure/scaling boundary; realtime load and HTTP share resources; operational limits must be measured.

## Revisit Triggers

Sustained connections or event-loop latency breach NFR; independent team release needs; multi-region requirement; session store becomes a bottleneck; measured downtime requires separation.
