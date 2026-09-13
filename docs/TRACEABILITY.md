# Requirement Traceability

> Project: NetLab | Document ID: DOC-TRACE-001 | Version: 0.1.0 | Status: Draft
> Depends On: `SRS.md`, `PRD/`, `TASKS.md`, `TESTING.md`

| Requirement | Feature/PRD | API/UI | Data | Permission | Task | Test | Status |
|---|---|---|---|---|---|---|---|
| FR-001..004 | CLASSROOM_SESSION | API-CLASS-001..003 | class_session | host/join | P0-004,P0-005 | TEST-CLASS-001 | Planned |
| FR-005..009 | CLASSROOM_SESSION | WebSocket | participant_session,realtime_event | host/owner | P0-004,P0-014 | TEST-CLASS-002,003 | Planned |
| FR-010..016 | NETWORK_SIMULATOR | simulator canvas | workspace | owner | P0-007,P0-008,P0-011,P0-012 | TEST-SIM-001..003 | Planned |
| FR-017..021 | EXERCISE_MODE | API-EXERCISE | exercise,submission | host/owner | P0-009,P0-013 | TEST-EX-001,002; `lib/simulator/exercise.test.ts` | Partially Covered (P0-009) |
| FR-022..026 | EXPORT_IMPORT | API-WORKSPACE/RESULT | workspace/submission | owner/host | P0-006,P0-010 | TEST-IO-001; `lib/simulator/workspace.test.ts` | Partially Covered (P0-010) |
| NFR-001..003 | Architecture | API/WebSocket | all runtime | service | P0-014,P0-016 | performance/reconnect | Planned |
| NFR-004..006 | Security | all mutations | token/session | boundary | P0-005 | TEST-SEC-001 | Planned |
| NFR-007..012 | DSD/Runbook | UI/ops | config/logs | service | P0-015..017 | a11y/smoke | Blocked by DESIGN |

P0 coverage is not yet `Covered`; it becomes Covered only after implementation and test evidence exist.
