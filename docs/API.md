# API Contract

> **Project:** NetLab | **Document ID:** DOC-API-001 | **Version:** 0.1.0 | **Status:** Draft
> **Depends On:** `SRS.md`, `ERD.md`

## Principles

- REST/JSON for commands and snapshots; WebSocket for realtime events.
- API prefix `/api/v1`.
- Canonical error envelope for every failure.
- All mutation requests validate session authority, schema, size, and version.
- Request IDs and correlation IDs are logged without secrets.

## Error Envelope

```json
{"error":{"code":"INVALID_INPUT","message":"Request is invalid","details":[],"request_id":"req_..."}}
```

## HTTP Operations

| Operation ID | Method/Path | Actor | Purpose |
|---|---|---|---|
| `API-CLASS-001` | POST `/api/v1/class-sessions` | TeacherHost | Create class |
| `API-CLASS-002` | GET `/api/v1/class-sessions/{id}` | Host/Participant | Read authorized snapshot |
| `API-CLASS-003` | POST `/api/v1/class-sessions/{id}/join` | Public participant | Join by class code |
| `API-CLASS-004` | POST `/api/v1/class-sessions/{id}/lifecycle` | Host | Start/lock/close |
| `API-EXERCISE-001` | POST `/api/v1/class-sessions/{id}/exercises` | Host | Create exercise |
| `API-EXERCISE-002` | POST `/api/v1/class-sessions/{id}/exercises/{eid}/start` | Host | Start exercise |
| `API-WORKSPACE-001` | PUT `/api/v1/workspaces/{id}` | Owner | Save versioned workspace |
| `API-WORKSPACE-002` | POST `/api/v1/workspaces/{id}/submit` | Owner | Submit for evaluation |
| `API-RESULT-001` | GET `/api/v1/class-sessions/{id}/results` | Host | Read result projection |
| `API-RESULT-002` | GET `/api/v1/class-sessions/{id}/results/export` | Host | Export result file |

## WebSocket

Endpoint: `/api/v1/realtime`.

Message envelope: `{type, session_id, sequence, request_id, payload}`.

Server events: `session_snapshot`, `participant_joined`, `participant_presence_changed`, `exercise_started`, `exercise_locked`, `workspace_projection_updated`, `submission_evaluated`, `host_disconnected`, `session_closed`, `error`.

Client commands: `subscribe`, `heartbeat`, `host_instruction`, `lifecycle_change`, `workspace_changed`, `reconcile`, `unsubscribe`.

Ordering: server sequence is monotonic per session. Client detects gaps and requests snapshot/reconciliation. Reconnect uses short-lived participant token and optimistic workspace version.

## Retry and Idempotency

Create/join/lifecycle/submit mutations accept `Idempotency-Key`. Client retries only timeout/network failures, with exponential backoff and bounded attempts. No retry on authorization or validation errors.

## Rate Limits

`PROPOSED`: join and host-control endpoints have separate per-IP/session limits; final numbers belong in `SECURITY.md` after deployment profile is known.
