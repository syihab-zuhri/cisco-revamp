# PRD: Exercise Mode

> Feature ID: `FEAT-EXERCISE_MODE` | Version: 0.1.0 | Status: Draft | Priority: P0 | Owner: Product/Curriculum

## Goals
Guru mendistribusikan soal dengan initial state dan siswa memperoleh evaluasi yang deterministik.

## Exercise Schema
`id`, `version`, `title`, `instructions`, `initial_workspace`, `targets[]`, `scoring`, `time_limit?`, `created_by` (optional), `content_locale`. Target type P0: device config, link existence, reachability/ping, required device count.

## Evaluation
Evaluator menghasilkan `status`, `score`, `checks[]`, `feedback`, `evaluated_workspace_version`, dan `evaluated_at`. Partial feedback tidak membocorkan jawaban target bila mode soal mengaturnya.

## Acceptance Criteria
- `AC-EXERCISE-001`: exercise valid selalu dapat di-load dari initial state.
- `AC-EXERCISE-002`: evaluator memberi hasil identik untuk input dan version yang sama.
- `AC-EXERCISE-003`: setiap failed check memiliki reason yang actionable.
- `AC-EXERCISE-004`: submit ulang membuat submission baru atau idempotent result sesuai contract, tanpa duplikasi side effect.
- `AC-EXERCISE-005`: host dapat start/lock/close exercise sesuai session permission.

## Edge Cases
Empty target, invalid exercise schema, participant submits after close, duplicate submit, topology version conflict, and student disconnect.

## Testing
Golden fixtures untuk passed, partial, failed, malformed, duplicate, and stale version.
