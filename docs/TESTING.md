# Testing Strategy

> Project: NetLab | Document ID: DOC-TESTING-001 | Version: 0.1.0 | Status: Draft
> Depends On: `SRS.md`, `PRD/`, `API.md`, `SECURITY.md`

## Pyramid

- Unit: simulator domain, evaluator, schema, reducers, code generation.
- Integration: repositories, session lifecycle, WebSocket sequence/reconnect, API authorization.
- Contract: OpenAPI and WebSocket envelopes.
- E2E: teacher creates class -> student joins -> exercise -> animation -> submit -> teacher review/export.
- Accessibility: keyboard, focus, semantic roles, contrast after DESIGN token resolution.
- Security: fuzz import, auth matrix, rate limit, XSS, secret scan, dependency scan.
- Performance: packet animation frame budget, join/command acknowledgement, concurrent session smoke.

## Required Test Scenarios

| ID | Scenario | Refs |
|---|---|---|
| `TEST-CLASS-001` | create/join/invalid/expired class | FR-001..004 |
| `TEST-CLASS-002` | host-only lifecycle and projection filtering | FR-005..007 |
| `TEST-CLASS-003` | disconnect/reconnect and sequence gap | FR-008..009, NFR-003 |
| `TEST-SIM-001` | device/link/address mutation validation | FR-010..012 |
| `TEST-SIM-002` | deterministic ping success/failure | FR-013, FR-016 |
| `TEST-SIM-003` | animation controls preserve result | FR-014..015 |
| `TEST-EX-001` | passed/partial/failed evaluator fixtures | FR-017..020 |
| `TEST-EX-002` | duplicate, stale, closed submission | FR-019..021 |
| `TEST-IO-001` | JSON round-trip/migration/rejection | FR-022..024 |
| `TEST-SEC-001` | no cross-participant access and secret redaction | NFR-004..006 |

## Quality Gates

Merge is blocked by typecheck/lint failure, failed P0 unit/integration/contract tests, critical security finding, invalid OpenAPI, or broken export compatibility fixture. E2E and performance smoke are required before pilot. Visual regression and WCAG contrast require `DESIGN.md`/`DSD.md` completion.

## Test Data

Synthetic nicknames and topology fixtures only. Never use real student data. Golden network scenarios are versioned and reviewable.
