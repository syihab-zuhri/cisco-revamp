# PRD: Network Simulator

> Feature ID: `FEAT-NETWORK_SIMULATOR`  
> Version: 0.1.0 | Status: Draft | Priority: P0 | Owner: Frontend/Domain

## Goals
Menyediakan topologi jaringan dasar dan visual packet flow yang benar untuk skenario P0.

## Non-goals
Full IOS CLI, dynamic routing protocol lengkap, physical-layer fidelity, dan shared canvas editing.

## Domain
Device: `pc`, `switch`, `router`, `server`, `access_point`. Link menghubungkan port yang compatible. IPv4 configuration memiliki address, prefix/mask, gateway. Packet flow memiliki source, destination, hops, status, dan event log.

## User Stories
- `US-SIMULATOR-001`: sebagai siswa, saya menambah device dan menghubungkannya.
- `US-SIMULATOR-002`: sebagai siswa, saya mengatur IPv4 dan menjalankan ping.
- `US-SIMULATOR-003`: sebagai siswa, saya melihat paket bergerak dan alasan kegagalan.

## Rules
- Domain engine tidak bergantung pada React atau canvas.
- Semua mutation memakai command tervalidasi dan menghasilkan version increment.
- Packet animation adalah projection dari deterministic simulation event, bukan sumber kebenaran.
- Invalid topology menghasilkan error yang dapat dijelaskan, bukan silent correction.

## Acceptance Criteria
- `AC-SIMULATOR-001`: device dapat dibuat dengan id unik dan type valid.
- `AC-SIMULATOR-002`: link hanya dibuat bila port dan endpoint valid.
- `AC-SIMULATOR-003`: ping sukses bila route/logical connectivity dan addressing memenuhi scenario rule.
- `AC-SIMULATOR-004`: packet projection menampilkan source, destination, ordered hops, status, dan reason.
- `AC-SIMULATOR-005`: play/pause/speed tidak mengubah simulation result.
- `AC-SIMULATOR-006`: undo/redo mengembalikan topology version yang benar.

## UI/UX
Canvas desktop-first, device palette, inspector, toolbar, packet controls, event log, zoom/pan, keyboard delete, visible focus, loading/empty/error states.

## Testing
Pure domain unit tests, scenario/golden tests, serializer round-trip, animation reducer tests, keyboard/accessibility tests, and performance smoke.
