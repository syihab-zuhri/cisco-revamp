# Release Checklist

> Project: NetLab | Document ID: DOC-RELEASE-001 | Version: 0.1.0 | Status: Draft
> Depends On: `TESTING.md`, `SECURITY.md`, `RUNBOOK.md`, `TRACEABILITY.md`

## Product

- [ ] All P0 requirements implemented and acceptance-tested.
- [ ] Teacher create/join/start/monitor/export flow passes.
- [ ] Student join/work/animate/submit/reconnect flow passes.
- [ ] MVP success definition has evidence.

## Engineering

- [ ] Lint, typecheck, unit, integration, contract, E2E, build pass.
- [ ] No known critical/high blocker defect.
- [ ] Export fixtures remain compatible.
- [ ] Performance smoke meets approved NFR.

## Design & Accessibility

- [ ] `DESIGN.md` and `DSD.md` complete.
- [ ] Contrast report passes or adjustments documented.
- [ ] Keyboard/focus/touch responsive checks pass.
- [ ] Loading, empty, error, offline/stale states exist.

## Security & Privacy

- [ ] Host/participant authorization matrix passes.
- [ ] Rate limits and expiry configured.
- [ ] No secrets or unnecessary PII.
- [ ] Security scan and import fuzzing pass.
- [ ] Privacy/retention ownership reviewed.

## Operations

- [ ] Health/readiness checks pass.
- [ ] Logs/metrics/alerts configured.
- [ ] Rollback procedure tested.
- [ ] Session failure behavior documented.

NO-GO if any P0, critical security, data isolation, or rollback item fails.
