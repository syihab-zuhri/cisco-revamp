# Requirement Traceability

> Project: NetLab | Document ID: DOC-TRACE-001 | Version: 1.0.0 | Status: Verified / Complete
> Depends On: `SRS.md`, `PRD/`, `TASKS.md`, `TESTING.md`, `RUNBOOK.md`

| Requirement | Feature/PRD | API/UI | Data | Permission | Task | Test | Status |
|---|---|---|---|---|---|---|---|
| FR-001..004 | CLASSROOM_SESSION | API-CLASS-001..003 | class_session | host/join | P0-004,P0-005,P0-013 | TEST-CLASS-001; `lib/classroom/session.test.ts`, `lib/classroom/api.test.ts`, `lib/classroom/routes.test.ts`, `lib/classroom/classroom-flow.test.ts` | Covered (Full session lifecycle & E2E classroom flow) |
| FR-005..009 | CLASSROOM_SESSION | WebSocket/SSE | participant_session,realtime_event | host/owner | P0-004,P0-014 | TEST-CLASS-002,003; `lib/classroom/realtime/hub.test.ts`, `lib/classroom/realtime/protocol.test.ts`, `lib/classroom/realtime/transport.test.ts` | Covered (Ordered events, gap replay, snapshot, heartbeat, disconnect/reconnect) |
| FR-010..016 | NETWORK_SIMULATOR | simulator canvas | workspace | owner | P0-007,P0-008,P0-011,P0-012 | TEST-SIM-001..003; `lib/simulator/core.test.ts`, `lib/simulator/editor.test.ts`, `lib/simulator/packet.test.ts` | Covered (Interactive workspace, deterministic packet projection, and classroom coursework integration verified) |
| FR-017..021 | EXERCISE_MODE | API-EXERCISE | exercise,submission | host/owner | P0-009,P0-013 | TEST-EX-001,002; `lib/simulator/exercise.test.ts`, `lib/classroom/classroom-flow.test.ts` | Covered (Evaluator engine & E2E join-to-review) |
| FR-022..026 | EXPORT_IMPORT | API-WORKSPACE/RESULT | workspace/submission | owner/host | P0-006,P0-010 | TEST-IO-001; `lib/simulator/workspace.test.ts`, `lib/quality/smoke.test.ts`, `scripts/pilot.mjs` | Covered (Export/import serializer v2, v1 migration, preview API, and pilot fixture verification) |
| NFR-001..003 | Architecture | API/WebSocket | all runtime | service | P0-014,P0-016 | performance/reconnect; `lib/classroom/realtime/protocol.test.ts`; `lib/quality/smoke.test.ts` (50 concurrent joins <200ms, ping+frames <15ms) | Covered |
| NFR-004..006 | Security | all mutations | token/session | boundary | P0-005,P0-016,P0-017 | TEST-SEC-001; `lib/classroom/session.test.ts`, `lib/classroom/api.test.ts`, `lib/classroom/routes.test.ts`; `lib/quality/smoke.test.ts`, `Dockerfile` | Covered (Token boundary, rate limiting, prototype pollution defense, non-root Docker runner, zero persistent secret leakage) |
| NFR-007..012 | DSD/Runbook | UI/ops | config/logs | service | P0-015..017 | a11y/smoke; `docs/VISUAL_SMOKE.md`; `lib/quality/smoke.test.ts` (WCAG AA contrast); `docs/DEPLOYMENT_EVIDENCE.md` | Covered (Visual smoke in docs/VISUAL_SMOKE.md, WCAG AA contrast, health/live & ready endpoints, JSON structured telemetry, 2.5s rollback drill) |

All 18 P0 tasks and requirements are 100% Covered with empirical test evidence, live HTTP smoke, and synthetic pilot runs.
