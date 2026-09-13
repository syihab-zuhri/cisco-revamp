# Deployment & Operations Runbook

> Project: NetLab | Document ID: DOC-RUNBOOK-001 | Version: 0.1.0 | Status: Draft
> Depends On: `ARCHITECTURE.md`, `SECURITY.md`, `TESTING.md`, `ENVIRONMENT.md`

## Release Pipeline

`lint -> typecheck -> unit -> integration -> contract -> security scan -> build -> smoke`.

## Health

- `/health/live`: process is alive.
- `/health/ready`: session store and required dependencies are reachable.
- Metrics: request latency/error, active sessions, active participants, WebSocket reconnects, event sequence gaps, evaluator errors, animation workload.

## Deploy

1. Verify CI gates.
2. Validate environment variables.
3. Apply schema changes before application requiring them.
4. Deploy one version.
5. Run health and classroom smoke: create -> join -> start -> submit -> close.
6. Monitor errors and reconnects.

## Rollback

Stop promotion, deploy previous known-good artifact, verify health, invalidate incompatible sessions only if required, and preserve incident evidence. Never delete session data as a rollback shortcut.

## SLO/SLI — Proposed

- `SLO-001`: critical command acknowledgement p95 under 500 ms under agreed load profile.
- `SLO-002`: health availability target TBD after hosting choice.
- `SLO-003`: reconnect success target TBD after protocol test.

Error budget policy: when budget is materially consumed, freeze non-reliability feature work and prioritize root cause.

## Backup/Restore

P0 temporary sessions may not require long-term backup, but deployment configuration and exercise catalog require versioned backup/export. Restore drill must be defined before persistent classes.

## Common Failures

- Join fails: inspect expiry, rate limit, and session store.
- Stale classroom: inspect WebSocket sequence gaps and snapshot reconciliation.
- Evaluation mismatch: reproduce with golden fixture and workspace schema version.
- Animation slow: cap event projection/detail; never change logical result.
