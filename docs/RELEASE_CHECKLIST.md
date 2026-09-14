# Release Checklist

> Project: NetLab | Document ID: DOC-RELEASE-001 | Version: 1.0.0 | Status: Passed / Ready
> Depends On: `TESTING.md`, `SECURITY.md`, `RUNBOOK.md`, `TRACEABILITY.md`

## Product

- [x] All P0 requirements implemented and acceptance-tested (`docs/TASKS.md` 18/18 complete).
- [x] Teacher create/join/start/monitor/export flow passes (Verified in `scripts/pilot.mjs` & `classroom-flow.test.ts`).
- [x] Student join/work/animate/submit/reconnect flow passes (Verified in `scripts/pilot.mjs` & `lib/classroom/realtime/transport.test.ts`).
- [x] MVP success definition has evidence (`docs/PILOT_REPORT.md` 8/8 criteria verified with 26/26 passing checks).

## Engineering

- [x] Lint, typecheck, unit, integration, contract, E2E, build pass (55/55 tests pass, `eslint` 0 warnings, `tsc` clean, Next.js build clean).
- [x] No known critical/high blocker defect (Security audit in `lib/quality/smoke.test.ts` passed).
- [x] Export fixtures remain compatible (Workspace v1 migration and v2 validation verified in `workspace.test.ts`).
- [x] Performance smoke meets approved NFR (<15ms ping frame projection, <200ms 50 concurrent joins in `smoke.test.ts`).

## Design & Accessibility

- [x] `DESIGN.md` and `DSD.md` complete and aligned.
- [x] Contrast report passes or adjustments documented (Computed from live `app/globals.css` tokens in `smoke.test.ts`: body 19.8:1, muted 7.2:1, primary 4.75:1).
- [x] Keyboard/focus/touch responsive checks pass (`docs/VISUAL_SMOKE.md` recorded).
- [x] Loading, empty, error, offline/stale states exist (`app/classroom/page.tsx` & `app/page.tsx`).

## Security & Privacy

- [x] Host/participant authorization matrix passes (Tested in `lib/quality/smoke.test.ts` & `session.test.ts`).
- [x] Rate limits and expiry configured (Tested in `smoke.test.ts` with 5 attempts window).
- [x] No secrets or unnecessary PII (Zero database/account persistence; token hashes only).
- [x] Security scan and import fuzzing pass (Unsafe key pre-parse check in `workspace.ts`).
- [x] Privacy/retention ownership reviewed (Ephemeral in-memory store with auto-expiry).

## Operations

- [x] Health/readiness checks pass (`/health/live` & `/health/ready` verified).
- [x] Logs/metrics/alerts configured (JSON structured logs via `instrumentation.ts`).
- [x] Rollback procedure tested (Tested via `scripts/rollback_drill.mjs` recovering to 200 in 2.5s).
- [x] Session failure behavior documented (`docs/RUNBOOK.md` §5 & §6).

---

## Verdict: GO FOR LAUNCH
All items verified by passing code, unit tests, and production drills. Zero open blocking defects.
