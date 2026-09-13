# PROJECT_MANIFEST_TEMPLATE.md

> **Version:** 1.0.0  
> **Status:** Template  
> **Authority:** Project registry and batch status

## Metadata
- Project: [name]
- Version: [SemVer]
- Status: Draft | Review | Approved
- Current Gate: CANDIDATE_GATE_A | CANDIDATE_GATE_B | CANDIDATE_GATE_C | CANDIDATE_GATE_D
- Approval State: Awaiting User Approval | Approved | Blocked
- Approval Owner: [role]
- Readiness Score: [0-100 or TBD]

## Document Registry

| Path | Document ID | Version | Status | Owner | Authority | Depends On | State |
|---|---|---:|---|---|---|---|---|
| [path] | [DOC-ID] | [x.y.z] | Draft | [role] | [domain] | [IDs] | ✅ complete / ⏳ pending / ❌ blocked |

## Batch Plan

| Batch | Documents | Status | Blocking Items |
|---|---|---|---|
| 1 | [3-5 documents] | ⏳ pending | [items] |

## Blocking Questions

| ID | Question | Impact | Owner | Status |
|---|---|---|---|---|
| Q-001 | [question] | BLOCKER/HIGH-IMPACT | [role] | Open/Resolved |

## Conflicts

| ID | Documents | Severity | Authoritative Source | Decision Owner | Status |
|---|---|---|---|---|---|
| CONFLICT-001 | [paths] | critical/high/medium/low | [path] | [role] | open/resolved/accepted-risk |

## Skipped Documents

| Document | Reason | Revisit Trigger |
|---|---|---|
| [document] | Not applicable | [trigger] |

## Readiness Evidence
- P0 traceability: [covered/total]
- Security baseline: [Pass/Needs Review]
- Design token references: [Pass/Needs Review/Not Applicable]
- Operational evidence: [links or TBD]
