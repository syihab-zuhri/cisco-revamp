# Security, Privacy & Threat Model

> **Project:** NetLab | **Document ID:** DOC-SECURITY-001 | **Version:** 0.1.0 | **Status:** Draft
> **Depends On:** `SRS.md`, `ERD.md`, `API.md`

## Classification

- Public: application code, public exercise content.
- Internal: session metadata, topology results.
- Restricted: host credential hashes, participant join tokens, operational logs with identifiers.
- PII-minimized: nickname is session-level personal data; no account identity in P0.

## Threats and Controls

| Threat | Control |
|---|---|
| Class code guessing | high-entropy code, expiry, join rate limit, generic errors |
| Host takeover | separate host credential, hash at rest, rotation/revocation, host-only authorization |
| Workspace injection | strict schema validation, size/depth limits, no dynamic evaluation |
| Cross-participant access | server-side ownership checks and projection filtering |
| Realtime replay/order abuse | short-lived tokens, sequence checks, idempotency keys |
| DoS via animation/payload | bounded graph size, packet event cap, payload limit, rate limit |
| Secret leakage | redaction, no host token in export/log/analytics |
| XSS via nickname/instructions | output encoding, safe rendering, CSP baseline |
| Dependency compromise | lockfile, review, automated vulnerability scanning |

## Privacy Controls

- Collect only nickname and session/workspace data needed for classroom operation.
- Do not require email, phone, student ID, or date of birth in P0.
- Default retention: session close/expiry plus TBD short retention; document exact value before production.
- Provide teacher export before deletion.
- Local exports remain user-controlled and are not automatically uploaded.
- External analytics off by default until consent/ownership/retention are decided.
- Legal/privacy text requires review by an appropriate professional before public operation; this document is an engineering baseline, not a legal compliance claim.

## Baseline Limits — Proposed

- nickname 1–40 characters;
- graph and packet event limits set in config;
- JSON payload maximum set per deployment profile;
- join and host-command rate limits configured separately;
- all tokens opaque, short-lived, and revocable.

## Security Testing

Schema fuzzing, authorization matrix, expired token, replay, duplicate mutation, oversized/deep JSON, XSS payload, rate-limit, dependency scan, CSP, and secret scanning.

## Incident Triggers

Escalate when host credential exposure, cross-participant data exposure, persistent unauthorized access, or destructive data corruption is suspected. Preserve minimal logs, revoke affected sessions/tokens, isolate release, and follow the project’s incident process.

## Residual Risks

No-login participation weakens durable identity and attribution. Class code sharing is possible. Temporary retention and nickname data still require operational ownership. These are accepted product trade-offs only for P0 and must be revisited before persistent classes/accounts.
