# PRD: Classroom Session

> Feature ID: `FEAT-CLASSROOM_SESSION`  
> Version: 0.1.0 | Status: Draft | Priority: P0 | Owner: Product/Backend
> Dependencies: `FEAT-EXERCISE_MODE`, `FEAT-NETWORK_SIMULATOR`

## Goals
Guru membuat sesi online tanpa akun; siswa bergabung dengan class code; guru mengendalikan sesi dan memantau participant.

## Non-goals
Persistent roster, account system, shared editing, dan cross-class history.

## Actors & Permissions
`TeacherHost` membuat/mengubah/menutup sesi dan membaca semua participant snapshot. `StudentParticipant` join, membaca exercise aktif, mengubah workspace milik sendiri, dan submit.

## Flow
Happy: host create -> class/host code -> participant join -> host starts exercise -> students work -> submit -> host reviews -> export/close.
Failure: invalid code, expired session, unauthorized host action, stale connection, store failure. Semua failure memakai canonical error envelope.

## Business Rules
- `class_code` bukan password dan tidak memberi host privilege.
- `host_code` hanya dikirim ke creator dan tidak masuk workspace export.
- Satu participant memiliki satu workspace aktif per exercise.
- Host disconnect memindahkan sesi ke `host_disconnected`; grace duration TBD.
- Close session menolak mutasi baru dan memulai retention timer.

## Acceptance Criteria
- `AC-CLASSROOM-001`: Given valid create request, when host creates a class, then server returns session id, class code, host credential, and expiry.
- `AC-CLASSROOM-002`: Given active class code, when student submits nickname, then participant receives own workspace and classroom snapshot.
- `AC-CLASSROOM-003`: Given student credential, when it calls host operation, then server returns `FORBIDDEN` and makes no state change.
- `AC-CLASSROOM-004`: Given disconnected participant, when reconnect token is valid, then unsynced local state can be reconciled.
- `AC-CLASSROOM-005`: Given closed/expired class, when any participant mutates state, then operation is rejected.

## UI/UX
Waiting room, host control bar, participant status list, exercise status, connection indicator, stale-data indicator, and explicit close confirmation. References `DESIGN.md`/`DSD.md` when available.

## Analytics/Audit
`class_created`, `participant_joined`, `exercise_started`, `participant_reconnected`, `session_closed`; no raw nickname in external analytics.

## Testing
Join/leave, authorization, lifecycle transitions, reconnect, host disconnect, expiry, concurrent join, and export.
