# PRD: Export and Import

> Feature ID: `FEAT-EXPORT_IMPORT` | Version: 0.1.0 | Status: Draft | Priority: P0 | Owner: Frontend/Domain

## Goals
User dapat menyimpan dan melanjutkan workspace tanpa akun; guru dapat mengekspor hasil sesi.

## Contract
Canonical format adalah JSON versioned dengan `schema`, `kind`, `created_at`, `workspace`, dan optional `exercise_ref`. `CS-...` adalah identifier/resume reference sesuai lifecycle, bukan secret. Host credential tidak boleh diekspor.

## Acceptance Criteria
- `AC-EXPORT-001`: export menghasilkan JSON yang valid dan tidak memuat host token.
- `AC-EXPORT-002`: valid export dapat diimport dan menghasilkan topology equivalent.
- `AC-EXPORT-003`: unsupported schema/version ditolak dengan migration message.
- `AC-EXPORT-004`: malicious/oversized/deeply nested payload ditolak sebelum domain mutation.
- `AC-EXPORT-005`: teacher result export hanya dapat dilakukan oleh host pada session terkait.

## Recovery
Local autosave disimpan di browser; user dapat mengunduh file kapan saja. Server session expiry tidak menghapus local file.

## Testing
Round-trip, migration fixtures, corrupted JSON, oversized payload, prototype pollution defenses, secret redaction, and result export authorization.
