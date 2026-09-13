# Software Requirements Specification

> **Project:** NetLab — Platform Pembelajaran Jaringan
> **Document ID:** DOC-SRS-001
> **Version:** 0.1.0
> **Status:** Draft
> **Owner:** Software Architect
> **Last Updated:** 2026-09-13
> **Depends On:** `PLANNING.md`
> **Supersedes:** None

## 1. System Boundary

NetLab mencakup web client simulator, classroom session, exercise evaluator, realtime session protocol, temporary workspace persistence, local recovery, export/import, dan UI untuk guru/siswa.

Di luar boundary P0: identity account service, LMS, payment, AI service, full network OS emulation, dan shared collaborative editing.

## 2. Actors

- `TeacherHost`: membuat dan mengendalikan satu classroom session.
- `StudentParticipant`: bergabung menggunakan class code dan nickname.
- `Maintainer`: mengelola soal bawaan, konfigurasi, dan release; bukan actor runtime default.
- `RealtimeGateway`: external/internal system component untuk koneksi realtime.
- `SessionStore`: temporary persistence untuk classroom state.

## 3. Functional Requirements

### Classroom

- `FR-001` [P0] TeacherHost dapat membuat classroom session tanpa akun.
  - Source: user decision/default.
  - Verification: integration test create session.
- `FR-002` [P0] Sistem menghasilkan class code unik dan host code terpisah.
  - Verification: schema/entropy/rate-limit test.
- `FR-003` [P0] StudentParticipant dapat bergabung dengan class code dan nickname.
  - Verification: E2E join flow.
- `FR-004` [P0] Sistem menolak class code tidak valid, expired, atau closed dengan canonical error.
  - Verification: integration test failure paths.
- `FR-005` [P0] TeacherHost dapat melihat daftar participant dan presence state.
  - Verification: realtime integration test.
- `FR-006` [P0] TeacherHost dapat mengirim instruksi kelas dan memulai/mengunci/mengakhiri exercise.
  - Verification: authorization and state-transition test.
- `FR-007` [P0] Sesi siswa memiliki workspace pribadi dan tidak dapat mengubah workspace siswa lain.
  - Verification: authorization test.
- `FR-008` [P0] Participant dapat reconnect dan melanjutkan workspace lokal yang belum tersinkron.
  - Verification: disconnect/reconnect test.
- `FR-009` [P0] Sistem menerapkan host disconnect grace period; nilai durasi final TBD.
  - Verification: state lifecycle test.

### Simulator

- `FR-010` [P0] User dapat menambah, memilih, memindahkan, menghubungkan, dan menghapus device.
  - Verification: component and E2E tests.
- `FR-011` [P0] Simulator mendukung device class PC, switch, router, server, dan access point.
  - Verification: domain fixture test.
- `FR-012` [P0] User dapat mengatur nama device, port, IPv4, subnet mask, gateway, dan link.
  - Verification: domain validation test.
- `FR-013` [P0] Simulator dapat mengevaluasi logical connectivity dan ping.
  - Verification: golden network scenario test.
- `FR-014` [P0] Simulator menampilkan animasi paket dengan arah, hop, status, source, dan destination.
  - Verification: animation state test and manual visual QA.
- `FR-015` [P0] User dapat play, pause, dan mengubah kecepatan animasi 0.5x/1x/2x.
  - Verification: UI interaction test.
- `FR-016` [P0] Simulator menampilkan event log untuk packet flow, ARP/routing explanation, dan error.
  - Verification: event projection test.

### Exercise

- `FR-017` [P0] TeacherHost dapat memilih atau membuat exercise dengan initial state dan target state.
  - Verification: exercise schema test.
- `FR-018` [P0] Exercise memiliki scoring checklist dan failure behavior.
  - Verification: evaluator fixture test.
- `FR-019` [P0] StudentParticipant dapat submit workspace untuk divalidasi.
  - Verification: E2E submission test.
- `FR-020` [P0] Evaluator menghasilkan status `not_started`, `in_progress`, `partially_correct`, `passed`, `failed`, atau `submitted`.
  - Verification: exhaustive evaluator test.
- `FR-021` [P0] TeacherHost dapat melihat status, hasil, dan preview workspace participant.
  - Verification: permission and E2E test.

### Export and persistence

- `FR-022` [P0] User dapat export workspace sebagai versioned JSON.
  - Verification: serializer fixture test.
- `FR-023` [P0] User dapat import JSON yang valid.
  - Verification: round-trip test.
- `FR-024` [P0] Sistem menolak file/schema invalid tanpa menjalankan payload sebagai code.
  - Verification: negative parser/security test.
- `FR-025` [P0] Guru dapat export ringkasan hasil sesi.
  - Verification: export integration test.
- `FR-026` [P0] Kode `CS-...` dapat dikaitkan dengan session/workspace sesuai lifecycle dan TTL.
  - Verification: lifecycle test.

## 4. Non-Functional Requirements

Target berikut berstatus `PROPOSED` sampai diuji pada spike dan deployment target disetujui.

- `NFR-001` [P0] Critical classroom actions memiliki p95 response acknowledgement < 500 ms pada environment target dan load profile yang ditetapkan.
- `NFR-002` [P0] Packet animation tetap usable pada desktop browser target dengan minimal 30 visual frames/second untuk skenario P0 yang disepakati.
- `NFR-003` [P0] Reconnect tidak menghapus local workspace yang telah tersimpan; kehilangan data dibatasi pada event terakhir yang belum tersimpan.
- `NFR-004` [P0] Class/session state menggunakan authorization boundary antara host dan participant.
- `NFR-005` [P0] Class code, host code, dan session token memiliki TTL serta rate limiting; angka final ditentukan di `SECURITY.md`.
- `NFR-006` [P0] Tidak ada nickname atau workspace mentah yang dikirim ke analytics eksternal tanpa keputusan privacy terpisah.
- `NFR-007` [P0] UI keyboard focus terlihat dan semantic controls digunakan pada critical flows.
- `NFR-008` [P0] Body text memenuhi contrast target WCAG 2.2 AA setelah `DESIGN.md` tersedia atau token manual disetujui.
- `NFR-009` [P0] Export schema memiliki explicit version dan migration policy.
- `NFR-010` [P0] Deployment menyediakan health check, structured error logging, dan graceful session failure behavior.
- `NFR-011` [P0] UI mendukung desktop sebagai primary surface serta layout fallback untuk tablet/mobile.
- `NFR-012` [P0] Semua data timestamp disimpan UTC dan dikonversi saat ditampilkan.

## 5. User Journeys

### J1 — Guru membuat kelas

- Happy: host membuka app → create class → menerima class/host code → masuk classroom.
- Alternate: host merefresh → host token memulihkan session selama TTL.
- Failure: session store gagal → UI menampilkan error retry; tidak menampilkan class seolah berhasil dibuat.

### J2 — Siswa bergabung

- Happy: masukkan class code + nickname → validasi → masuk waiting room.
- Alternate: reconnect dengan local workspace → server mengirim snapshot terbaru → client melakukan reconciliation.
- Failure: code invalid/expired/closed → user mendapat pesan korektif tanpa membocorkan session detail.

### J3 — Siswa mengerjakan soal

- Happy: host memulai exercise → siswa menerima initial state → mengubah konfigurasi → menjalankan packet animation → submit → mendapat result.
- Alternate: partial correct → feedback menunjukkan kategori yang belum terpenuhi.
- Failure: koneksi putus → local autosave → reconnect; bila host menutup sesi, submit ditolak dan export lokal tetap tersedia.

### J4 — Guru memantau

- Happy: teacher melihat presence/status → membuka preview → export hasil.
- Failure: participant snapshot stale → UI memberi indikator stale dan meminta refresh, bukan menampilkan data sebagai real-time.

## 6. Data Requirements

Entity awal yang akan diformalisasi di `ERD.md`:

- `class_session`
- `host_credential`
- `participant_session`
- `exercise`
- `workspace`
- `workspace_submission`
- `realtime_event`

Nickname diperlakukan sebagai session-level personal data. Secret/token tidak boleh masuk ke export workspace atau log biasa.

## 7. Security and Privacy Baseline

- No mandatory account.
- Separate host authority from participant join access.
- Validate and constrain all imported JSON.
- Rate-limit join and host-control attempts.
- Expire temporary sessions.
- Minimize participant data.
- Do not treat class code as a password.
- Do not claim legal compliance before professional review; security mapping akan ditulis di `SECURITY.md`.

## 8. Out of Scope

Account lifecycle, persistent class roster, shared topology editing, AI, payment, LMS integration, full IOS emulation, and comprehensive mobile authoring.

## 9. Glossary

- `class code`: kode untuk masuk ke satu classroom session.
- `host code`: credential sementara untuk kontrol TeacherHost.
- `workspace`: topologi dan konfigurasi milik satu participant/session.
- `exercise`: definisi soal, initial state, target, evaluator, dan scoring.
- `packet animation`: visualisasi perjalanan paket berdasarkan event domain simulator.
- `resume code`: kode `CS-...` yang mengacu pada session/workspace sesuai lifecycle; bukan password permanen.

## 10. Open Questions / TBD

- runtime/framework dan hosting final;
- realtime implementation detail;
- host grace period final;
- retention final;
- final license;
- visual token values and contrast report;
- exact P0 network scenarios and curriculum ownership.
