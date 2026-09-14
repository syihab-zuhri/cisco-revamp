# Execution Tasks

> Project: NetLab | Document ID: DOC-TASKS-001 | Version: 0.2.0 | Status: In Progress
> Depends On: `SRS.md`, `PRD/`, `ARCHITECTURE.md`, `API.md`, `TESTING.md`

## Phase 0 — Decisions and Foundations

- [x] `TASK-P0-001` [M] Finalize runtime, database/session store, and hosting ADR. Owner: Tech Lead. Refs: ADR-001. Done: ADR-001 accepted for a Next.js 16 modular monolith with server-authoritative realtime, in-process P0 events, and in-memory temporary session store pending production persistence spike.
- [x] `TASK-P0-002` [S] Restore/read visual reference and define DESIGN tokens. Owner: Design. Refs: DESIGN.md. Done: visual audit, canonical tokens, and WCAG contrast report recorded in `docs/DESIGN.md`.
- [x] `TASK-P0-003` [M] Define P0 network scenario fixtures. Owner: Curriculum/Domain. Refs: FR-013..016. Done: deterministic connected-LAN, no-route, and cross-subnet-without-gateway fixtures exist in `lib/simulator/core.test.ts`; all pass.

## Phase 1 — Data, Auth, Security

- [x] `TASK-P0-004` [M] Implement session entities and expiry cleanup. Owner: Backend. Refs: ERD, FR-001..009. Done: `lib/classroom/session.ts` implements temporary class lifecycle, participant join, expiry cleanup, host disconnect grace period, and closed-session mutation rejection; 5 classroom tests pass.
- [x] `TASK-P0-005` [M] Implement host/participant token boundaries and rate limits. Owner: Security/Backend. Refs: SECURITY, NFR-004..006. Done: `lib/classroom/security.ts` hashes tokens, uses timing-safe authorization for host/participant boundaries, and enforces bounded rate limits; covered by classroom security tests.
- [x] `TASK-P0-006` [S] Implement schema validation for workspace/exercise imports. Owner: Backend. Refs: ERD, FR-022..024. Done: `lib/simulator/workspace.ts` validates schema/version, size/depth, unsafe keys, topology references, and legacy migration before domain mutation; 5 workspace tests pass.

## Phase 2 — Core Domain

- [x] `TASK-P0-007` [L] Implement pure topology/device/link model. Owner: Domain. Refs: FR-010..012. Done: `lib/simulator/core.ts` provides validated device/link mutations with monotonic topology versions; duplicate/self/missing-endpoint cases are rejected and tested.
- [x] `TASK-P0-008` [L] Implement deterministic connectivity, ping, and packet events. Owner: Domain. Refs: FR-013..016. Done: `ping()` produces ordered packet events and actionable success/failure reasons; deterministic golden tests pass.
- [x] `TASK-P0-009` [M] Implement exercise evaluator and scoring states. Owner: Domain. Refs: FR-017..020. Done: `lib/simulator/exercise.ts` evaluates device config, active links, reachability, and device counts with deterministic scores, statuses, version evidence, and actionable feedback; 4 golden tests pass.
- [x] `TASK-P0-010` [M] Implement versioned serializer/migration. Owner: Domain. Refs: FR-022..024. Done: `lib/simulator/workspace.ts` exports canonical schema v2 without host credentials, imports/migrates v1, validates topology references, and rejects malformed, oversized, deeply nested, unsafe, and unsupported-version payloads; 5 workspace tests pass.

## Phase 3 — Web and Realtime

- [x] `TASK-P0-011` [L] Implement desktop-first simulator workspace. Owner: Frontend. Refs: FR-010..016. Done: `lib/simulator/editor.ts` provides deterministic workspace state, add/select device, and IPv4 editing; `app/page.tsx` uses live editor state for device dock, canvas nodes, selection, and inspector; editor tests and full build pass.
- [x] `TASK-P0-012` [M] Implement packet animation projection and controls. Owner: Frontend. Refs: FR-014..015. Done: `lib/simulator/packet.ts` projects deterministic packet frames from `PingResult`; speed changes timing only, pause stops frame progression, and failed results preserve drop events; `app/page.tsx` wires PDU, pause/speed controls, active packet indicator, and event log; packet tests and full build pass.
- [x] `TASK-P0-013` [L] Implement teacher/student classroom flows. Owner: Frontend/Backend. Refs: FR-001..009, FR-021. Done: `lib/classroom/coursework.ts` implements exercise management, workspace submission, automatic evaluation, and results projection; API routes added for `/exercises`, `/exercises/[eid]/start`, `/exercises/active`, `/submit`, `/results`, `/results/preview`; `app/classroom/page.tsx` provides full teacher (create, monitor, review scores, close) and student (join, view active exercise, submit workspace, view grade) UI; E2E integration test `lib/classroom/classroom-flow.test.ts` passes 2/2; production build verified.
- [x] `TASK-P0-014` [L] Implement WebSocket sequence, heartbeat, snapshot, reconnect. Owner: Backend. Refs: FR-005..009. Done: `lib/classroom/realtime/hub.ts` (monotonic sequence, 64-event buffer, gap detection), `protocol.ts` (command dispatcher, snapshot/reconcile, heartbeat, lifecycle events), and `tickets.ts` (single-use opaque ticket gate); SSE route at `/api/v1/realtime` with ticket exchange at `/api/v1/realtime/tickets`; UI live stream integrated; unit + transport tests (15/15) pass; full 47/47 suite passes.
- [x] `TASK-P0-015` [M] Apply shadcn preset with diff review. Owner: Frontend. Refs: DESIGN/DSD. Done: preset `bLZU0FmLb` (base-sera, phosphor) active in `components.json`; primitives `button`, `badge`, `card`, `input`, `table` installed via `npx shadcn@latest add` with created-file output recorded; token diff vs DESIGN/DSD verified (primary `#e01a1a`, hairline borders, `rounded-none` containers, mono IPv4); visual smoke of `/` and `/classroom` documented in `docs/VISUAL_SMOKE.md`. `npx tsc --noEmit` and `npm run lint` clean.

## Phase 4 — Quality and Pilot

- [x] `TASK-P0-016` [M] Run security, accessibility, and performance smoke. Owner: QA/Security. Refs: TESTING, SECURITY. Done: `lib/quality/smoke.test.ts` (7 tests) — prototype-pollution keys (`__proto__`/`constructor`/`prototype`) rejected at import, >256KB payloads rejected, host token absent from create response and workspace export, cross-participant/host privilege escalation blocked (FORBIDDEN), rate limiter blocks 6th attempt, WCAG AA contrast computed from live `app/globals.css` tokens (body 19.83:1, muted 7.24:1, primary btn 4.75:1, dock 20.67:1, destructive 4.83:1), ping+frame projection under 15ms, 50 concurrent joins under 200ms with snapshot integrity. No blocking findings; full suite 55/55. Guard added: unsafe-key pre-parse check in `lib/simulator/workspace.ts`.
- [ ] `TASK-P0-017` [M] Configure deployment, health check, logs, and rollback. Owner: DevOps. Refs: RUNBOOK. Done when: smoke and rollback evidence exist.
- [ ] `TASK-P0-018` [M] Run controlled classroom pilot with synthetic data. Owner: Product/QA. Refs: RELEASE_CHECKLIST. Done when: MVP success criteria are evidenced.
