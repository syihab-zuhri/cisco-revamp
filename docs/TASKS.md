# Execution Tasks

> Project: NetLab | Document ID: DOC-TASKS-001 | Version: 0.2.0 | Status: In Progress
> Depends On: `SRS.md`, `PRD/`, `ARCHITECTURE.md`, `API.md`, `TESTING.md`

## Phase 0 — Decisions and Foundations

- [ ] `TASK-P0-001` [M] Finalize runtime, database/session store, and hosting ADR. Owner: Tech Lead. Refs: ADR-001. Done when: options verified and ADR accepted.
- [x] `TASK-P0-002` [S] Restore/read visual reference and define DESIGN tokens. Owner: Design. Refs: DESIGN.md. Done: visual audit, canonical tokens, and WCAG contrast report recorded in `docs/DESIGN.md`.
- [x] `TASK-P0-003` [M] Define P0 network scenario fixtures. Owner: Curriculum/Domain. Refs: FR-013..016. Done: deterministic connected-LAN, no-route, and cross-subnet-without-gateway fixtures exist in `lib/simulator/core.test.ts`; all pass.

## Phase 1 — Data, Auth, Security

- [ ] `TASK-P0-004` [M] Implement session entities and expiry cleanup. Owner: Backend. Refs: ERD, FR-001..009. Done when: lifecycle tests pass.
- [ ] `TASK-P0-005` [M] Implement host/participant token boundaries and rate limits. Owner: Security/Backend. Refs: SECURITY, NFR-004..006. Done when: auth matrix and abuse tests pass.
- [ ] `TASK-P0-006` [S] Implement schema validation for workspace/exercise imports. Owner: Backend. Refs: FR-022..024. Done when: fuzz/negative fixtures pass.

## Phase 2 — Core Domain

- [x] `TASK-P0-007` [L] Implement pure topology/device/link model. Owner: Domain. Refs: FR-010..012. Done: `lib/simulator/core.ts` provides validated device/link mutations with monotonic topology versions; duplicate/self/missing-endpoint cases are rejected and tested.
- [x] `TASK-P0-008` [L] Implement deterministic connectivity, ping, and packet events. Owner: Domain. Refs: FR-013..016. Done: `ping()` produces ordered packet events and actionable success/failure reasons; deterministic golden tests pass.
- [x] `TASK-P0-009` [M] Implement exercise evaluator and scoring states. Owner: Domain. Refs: FR-017..020. Done: `lib/simulator/exercise.ts` evaluates device config, active links, reachability, and device counts with deterministic scores, statuses, version evidence, and actionable feedback; 4 golden tests pass.
- [ ] `TASK-P0-010` [M] Implement versioned serializer/migration. Owner: Domain. Refs: FR-022..024. Done when: round-trip and migration tests pass.

## Phase 3 — Web and Realtime

- [ ] `TASK-P0-011` [L] Implement desktop-first simulator workspace. Owner: Frontend. Refs: FR-010..016. Done when: critical UI journey works.
- [ ] `TASK-P0-012` [M] Implement packet animation projection and controls. Owner: Frontend. Refs: FR-014..015. Done when: pause/speed/result invariance tests pass.
- [ ] `TASK-P0-013` [L] Implement teacher/student classroom flows. Owner: Frontend/Backend. Refs: FR-001..009, FR-021. Done when: E2E join-to-review passes.
- [ ] `TASK-P0-014` [L] Implement WebSocket sequence, heartbeat, snapshot, reconnect. Owner: Backend. Refs: FR-005..009. Done when: disconnect/reconnect tests pass.
- [ ] `TASK-P0-015` [M] Apply shadcn preset with diff review. Owner: Frontend. Refs: DESIGN/DSD. Done when: command output and visual smoke are recorded.

## Phase 4 — Quality and Pilot

- [ ] `TASK-P0-016` [M] Run security, accessibility, and performance smoke. Owner: QA/Security. Refs: TESTING, SECURITY. Done when: no blocking findings.
- [ ] `TASK-P0-017` [M] Configure deployment, health check, logs, and rollback. Owner: DevOps. Refs: RUNBOOK. Done when: smoke and rollback evidence exist.
- [ ] `TASK-P0-018` [M] Run controlled classroom pilot with synthetic data. Owner: Product/QA. Refs: RELEASE_CHECKLIST. Done when: MVP success criteria are evidenced.
