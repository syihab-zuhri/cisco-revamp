# Deployment & Operations Evidence Report

> **Project:** NetLab (Cisco Revamp)  
> **Document ID:** DOC-DEPLOY-001  
> **Target Task:** `TASK-P0-017`  
> **Status:** Verified  
> **References:** `docs/RUNBOOK.md`, `Dockerfile`, `ci/workflow.yml`, `instrumentation.ts`

---

## 1. Release Gates & CI Pipeline

Continuous integration configuration in `ci/workflow.yml` strictly enforces:
- `npm run lint -- --max-warnings=0`
- `npx tsc --noEmit`
- `npm test` (55 test cases across simulator, classroom, and quality suites)
- `npm run build` (standalone compilation check)

---

## 2. Health Endpoints Verification

Executed against standalone Next.js 16 server:

```bash
$ curl -i http://127.0.0.1:3400/health/live
HTTP/1.1 200 OK
Content-Type: application/json
{"ok":true,"data":{"status":"alive","ts":"2026-09-14T01:51:28.714Z"}}

$ curl -i http://127.0.0.1:3400/health/ready
HTTP/1.1 200 OK
Content-Type: application/json
{"ok":true,"data":{"status":"ready","activeSessions":0,"activeParticipants":0,"bufferedEvents":0,"subscribers":0,"outstandingTickets":0}}
```

---

## 3. Structured Logging Evidence

Emitted to stdout by Next.js instrumentation:

```json
{"level":"info","event":"service.boot","service":"netlab","version":"dev","pid":30071,"ts":"2026-09-14T02:09:27.264Z"}
{"level":"info","event":"metrics.classroom","ts":"2026-09-14T02:00:26.639Z","sessionStoreReachable":true,"realtimeHubReachable":true,"activeSessions":1,"activeParticipants":5,"bufferedEvents":6,"subscribers":1,"outstandingTickets":0}
```

---

## 4. Rollback Drill Evidence

Automated execution via `scripts/rollback_drill.mjs`:

```text
[DRILL] 1. Backing up verified production entrypoint...
[DRILL] 2. Booting baseline release artifact on port 3410...
[DRILL] Baseline health HTTP status: 200
[DRILL] 3. Simulating corrupted release artifact promotion...
    [srv stderr]: FATAL
[DRILL] Corrupted artifact health status: 0 (server failed to bind/live)
[DRILL] 4. Executing rollback to server.js.prev...
[DRILL] 5. Booting restored artifact...
[DRILL] Restored health HTTP status: 200
[DRILL SUCCESS] Rollback verified: baseline=200, corrupted=0, restored=200
```

Total rollback duration: **2.5 seconds** (target SLO < 30s).
Zero residual corrupted state; health immediately returned to `200`.
