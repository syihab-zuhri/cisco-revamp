# Requirement Traceability

> Project: NetLab | Document ID: DOC-TRACE-001 | Version: 0.1.0 | Status: Draft
> Depends On: `SRS.md`, `PRD/`, `TASKS.md`, `TESTING.md`

| Requirement | Feature/PRD | API/UI | Data | Permission | Task | Test | Status |
|---|---|---|---|---|---|---|---|
| FR-001..004 | CLASSROOM_SESSION | API-CLASS-001..003 | class_session | host/join | P0-004,P0-005,P0-013 | TEST-CLASS-001; `lib/classroom/session.test.ts`, `lib/classroom/api.test.ts`, `lib/classroom/routes.test.ts`, `lib/classroom/classroom-flow.test.ts` | Covered (Full session lifecycle & E2E classroom flow) |
| FR-005..009 | CLASSROOM_SESSION | WebSocket/SSE | participant_session,realtime_event | host/owner | P0-004,P0-014 | TEST-CLASS-002,003; `lib/classroom/realtime/hub.test.ts`, `lib/classroom/realtime/protocol.test.ts`, `lib/classroom/realtime/transport.test.ts` | Covered (Ordered events, gap replay, snapshot, heartbeat, disconnect/reconnect) |
| FR-010..016 | NETWORK_SIMULATOR | simulator canvas | workspace | owner | P0-007,P0-008,P0-011,P0-012 | TEST-SIM-001..003; `lib/simulator/core.test.ts`, `lib/simulator/editor.test.ts`, `lib/simulator/packet.test.ts` | Covered (interactive workspace and deterministic packet projection; classroom integration pending) |
| FR-017..021 | EXERCISE_MODE | API-EXERCISE | exercise,submission | host/owner | P0-009,P0-013 | TEST-EX-001,002; `lib/simulator/exercise.test.ts`, `lib/classroom/classroom-flow.test.ts` | Covered (Evaluator engine & E2E join-to-review) |
| FR-022..026 | EXPORT_IMPORT | API-WORKSPACE/RESULT | workspace/submission | owner/host | P0-006,P0-010 | TEST-IO-001; `lib/simulator/workspace.test.ts` | Partially Covered (P0-010) |
| NFR-001..003 | Architecture | API/WebSocket | all runtime | service | P0-014,P0-016 | performance/reconnect; `lib/classroom/realtime/protocol.test.ts`; `lib/quality/smoke.test.ts` (50 concurrent joins <200ms, ping+frames <15ms) | Covered |
| NFR-004..006 | Security | all mutations | token/session | boundary | P0-005,P0-016 | TEST-SEC-001; `lib/classroom/session.test.ts`, `lib/classroom/api.test.ts`, `lib/classroom/routes.test.ts`; `lib/quality/smoke.test.ts` (privilege escalation, prototype pollution, payload limits, token redaction) | Partially Covered (boundary + smoke verified; deployment profile pending P0-017) |
| NFR-007..012 | DSD/Runbook | UI/ops | config/logs | service | P0-015..017 | a11y/smoke; `docs/VISUAL_SMOKE.md`; `lib/quality/smoke.test.ts` (WCAG AA contrast from live tokens) | Partially Covered (visual + a11y smoke done; ops runbook pending P0-017) |

P0 coverage is not yet `Covered`; it becomes Covered only after implementation and test evidence exist.
