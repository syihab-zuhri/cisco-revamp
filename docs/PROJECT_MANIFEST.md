# Project Manifest

> **Project:** NetLab (Cisco Revamp) — Platform Pembelajaran Jaringan  
> **Document ID:** DOC-MANIFEST-001  
> **Version:** 1.0.0  
> **Status:** Completed / Implementation Ready  
> **Owner:** Software Architect & Project Planning Lead  
> **Last Updated:** 2026-09-13  
> **Depends On:** Gate B Proposal Approval & Visual Audit  
> **Supersedes:** 0.1.0  

## Status

Current Gate: `GATE_C` (Implementation Ready)  
Approval State: `Approved for Implementation Hand-off`  
Approval Owner: Product Owner / Technical Lead  

## Document Registry

| Path | Document ID | Status | Authority | Depends On | Batch |
|---|---|---|---|---|---:|
| `PROJECT_MANIFEST.md` | `DOC-MANIFEST-001` | Ready | Document registry & gate status | — | 1 |
| `PLANNING.md` | `DOC-PLANNING-001` | Ready | Vision, scope, metrics, design direction | Manifest | 1 |
| `SRS.md` | `DOC-SRS-001` | Ready | Functional & Non-Functional Requirements | Planning | 1 |
| `PRD/CLASSROOM_SESSION.md` | `DOC-PRD-CLASSROOM-001` | Ready | Realtime classroom & host presence | SRS | 2 |
| `PRD/NETWORK_SIMULATOR.md` | `DOC-PRD-SIMULATOR-001` | Ready | Simulator canvas & topology rules | SRS | 2 |
| `PRD/EXERCISE_MODE.md` | `DOC-PRD-EXERCISE-001` | Ready | Exercise grading & checklist evaluation | SRS | 2 |
| `PRD/EXPORT_IMPORT.md` | `DOC-PRD-EXPORT-001` | Ready | CS-XXXXXX format & JSON interchange | SRS | 2 |
| `ERD.md` | `DOC-ERD-001` | Ready | Data entities & relations | SRS | 3 |
| `API.md` | `DOC-API-001` | Ready | REST & WebSocket API contract | SRS, ERD | 3 |
| `openapi.yaml` | `DOC-OPENAPI-001` | Ready | OpenAPI 3.1 contract specification | API | 3 |
| `ARCHITECTURE.md` | `DOC-ARCH-001` | Ready | System topology & component layers | Planning, SRS | 3 |
| `SECURITY.md` | `DOC-SECURITY-001` | Ready | Threat model & ephemeral security | SRS, ERD | 3 |
| `ADR/ADR-001-runtime-and-realtime.md` | `ADR-001` | Ready | Type-1 runtime/realtime decision | Planning, SRS | 3 |
| `DESIGN.md` | `DOC-DESIGN-001` | Ready | Canonical design tokens & WCAG report | Visual Audit | 4 |
| `DSD.md` | `DOC-DSD-001` | Ready | Design system rules & interaction UX | DESIGN | 4 |
| `TESTING.md` | `DOC-TESTING-001` | Ready | Verification strategy & quality gates | SRS, PRDs | 5 |
| `TASKS.md` | `DOC-TASKS-001` | Ready | 18 Atomic execution tasks | Core blueprint | 5 |
| `TRACEABILITY.md` | `DOC-TRACE-001` | Ready | Requirement traceability matrix (100% P0) | SRS, PRDs, Tasks | 5 |
| `ENVIRONMENT.md` | `DOC-ENV-001` | Ready | Configuration & environment matrix | Architecture | 6 |
| `RUNBOOK.md` | `DOC-RUNBOOK-001` | Ready | Deployment, monitoring & operations | Architecture, Sec | 6 |
| `AGENTS.md` | `DOC-AGENTS-001` | Ready | Agent context packs & handoff rules | All blueprint docs| 6 |
| `RELEASE_CHECKLIST.md` | `DOC-RELEASE-001` | Ready | Launch go/no-go verification items | Testing, Security | 6 |
| `CHANGELOG.md` | `DOC-CHANGELOG-001` | Ready | Documentation & version history | Manifest | 6 |

## Skipped or Blocked Artifacts

| Artifact | Status | Reason |
|---|---|---|
| `AI_FEATURES.md` | Skipped | AI tidak termasuk dalam cakupan P0/P1 MVP. |
| `MIGRATION.md` | Skipped | Sistem baru tanpa data warisan (*greenfield*). |

## Batch Plan Summary

1. Batch 1 — `PROJECT_MANIFEST.md`, `PLANNING.md`, `SRS.md`: `Completed ✅`
2. Batch 2 — P0 PRDs: `Completed ✅`
3. Batch 3 — ERD, API, OpenAPI, Architecture, Security, ADR: `Completed ✅`
4. Batch 4 — `DESIGN.md`, `DSD.md`: `Completed ✅` (Hasil Visual Audit & Preset shadcn bLZU0FmLb)
5. Batch 5 — `TESTING.md`, `TASKS.md`, `TRACEABILITY.md`: `Completed ✅`
6. Batch 6 — `ENVIRONMENT.md`, `RUNBOOK.md`, `AGENTS.md`, `RELEASE_CHECKLIST.md`, `CHANGELOG.md`: `Completed ✅`

## Readiness Score (Gate C Evaluation per PLANNING_v5.1.md §18)

| # | Dimensi Evaluasi | Bobot | Skor (0–10) | Poin Terbobot | Catatan Evaluasi |
|---|---|---|---|---|---|
| 1 | Requirements quality & coverage | 15 | 10 | 15.0 | Seluruh FR P0 terdefinisi secara atomik, dapat diuji (*testable*), memiliki acceptance criteria. |
| 2 | P0 traceability (FR→PRD→API/UI→Data→Task→Test) | 15 | 10 | 15.0 | 100% FR P0 terpetakan lengkap di TRACEABILITY.md tanpa rantai putus. |
| 3 | Architecture coherence & simplicity | 10 | 9.5 | 9.5 | Next.js 15, WS ephemeral, WebRTC state transport terdokumentasi di ARCHITECTURE & ADR-001. |
| 4 | Data model integrity | 10 | 9.5 | 9.5 | ERD mencakup seluruh entitas kelas ephemeral, workspace, dan exercise dengan validasi constraint. |
| 5 | Security & privacy baseline | 10 | 9.5 | 9.5 | Zero-login threat model, token host ephemeral, rate limiting, PII avoidance diatur di SECURITY.md. |
| 6 | Test strategy & quality gates | 10 | 9.0 | 9.0 | Strategi unit, E2E, dan packet simulation deterministic fixtures diatur di TESTING.md. |
| 7 | Execution plan quality | 10 | 9.5 | 9.5 | 18 task atomik dengan dependency dan Definition of Done di TASKS.md. |
| 8 | Operations & reliability readiness | 10 | 9.0 | 9.0 | Runbook, deployment, health check, logging, dan rollback tercantum di RUNBOOK.md. |
| 9 | Decision & assumption discipline | 5 | 9.5 | 4.75 | ADR-001 lengkap, audit visual selesai dengan bukti dan confidence tinggi di DESIGN.md. |
| 10 | Cross-document consistency | 5 | 10 | 5.0 | Konsistensi penamaan, format kode CS-XXXXXX, dan token DESIGN ↔ DSD 100% sinkron. |
| **TOTAL** | **Skor Kesiapan Akhir** | **100** | — | **95.75 / 100** | **Lolos Ambang Gate C (Ambang: ≥ 75, Traceability ≥ 8/10)** |

## Readiness Sign-off

- Discovery complete: ✅
- Scope P0/P1/P2 explicit: ✅
- Architecture direction confirmed: ✅
- Design tokens & visual audit: ✅
- Blueprint complete & consistent: ✅
- Readiness score: **95.75 / 100 (Gate C — Implementation Ready)** ✅
