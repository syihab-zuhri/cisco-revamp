# Environment & Configuration

> Project: NetLab | Document ID: DOC-ENV-001 | Version: 0.1.0 | Status: Draft
> Depends On: `ARCHITECTURE.md`, `SECURITY.md`, `RUNBOOK.md`

## Proposed Runtime

- Web client and server: TypeScript-based framework, exact framework TBD.
- Session store: relational or key-value implementation TBD after spike.
- WebSocket gateway: same deployable as API for P0.
- Local development: Node.js/npm toolchain; exact versions must be pinned in repository.

## Variables

| Variable | Required | Scope | Description |
|---|---|---|---|
| `APP_ENV` | Yes | all | `development`, `test`, `production` |
| `APP_BASE_URL` | Yes | all | public origin |
| `SESSION_STORE_URL` | Yes | server | temporary session store |
| `SESSION_TTL_SECONDS` | Yes | server | session expiry |
| `HOST_GRACE_SECONDS` | Yes | server | host disconnect grace |
| `MAX_WORKSPACE_BYTES` | Yes | server/client | import/save limit |
| `LOG_LEVEL` | No | server | structured log level |
| `CORS_ORIGINS` | Yes | server | allowed origins |

Never commit real values. Provide `.env.example` with placeholders only. Config validation must fail fast for missing required variables.

## Local Setup Checklist

1. Install pinned runtime and package manager.
2. Copy `.env.example` to local environment.
3. Start session store dependency.
4. Run schema/migration command when implemented.
5. Run unit/integration tests.
6. Start web/server and verify health endpoint.

## Third Parties

No third-party external runtime integration is approved in P0. Any managed realtime, telemetry, or auth provider requires ADR and privacy review.
