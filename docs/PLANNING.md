# Product & Project Planning

> **Project:** NetLab — Platform Pembelajaran Jaringan
> **Document ID:** DOC-PLANNING-001
> **Version:** 0.1.0
> **Status:** Draft
> **Owner:** Product Owner / Software Architect
> **Last Updated:** 2026-09-13
> **Depends On:** `PROJECT_MANIFEST.md`
> **Supersedes:** None

## 1. Executive Summary

NetLab adalah website open-source untuk membantu siswa SMA mempelajari jaringan komputer dan internet melalui materi, simulator topologi, animasi aliran paket, dan mode soal berbasis kelas online. Siswa masuk tanpa akun menggunakan kode kelas dan nama panggilan. Guru menjadi host aktif dan dapat membagikan soal, memantau progres, serta meninjau hasil.

## 2. Problem and Opportunity

Materi jaringan sering memisahkan teori dari praktik atau membutuhkan software desktop yang lebih kompleks daripada kebutuhan latihan dasar. NetLab menawarkan pengalaman browser-first dengan akses rendah-friksi, visualisasi konsep, dan latihan terstruktur.

## 3. Objectives

- Menyediakan simulator jaringan dasar yang dapat digunakan dari browser.
- Membuat konsep konektivitas dan perjalanan paket terlihat melalui animasi.
- Memungkinkan guru menjalankan sesi kelas tanpa akun siswa.
- Memungkinkan evaluasi soal berbasis keadaan topologi dan hasil konektivitas.
- Menjaga project tetap dapat dipelajari, dijalankan, dan dikontribusikan sebagai open-source.

## 4. Users and Stakeholders

| Actor | Goal |
|---|---|
| Guru/host | Membuat kelas, membagikan soal, memantau, dan menilai sesi. |
| Siswa | Bergabung tanpa login, membangun konfigurasi, memahami animasi, dan mengirim hasil. |
| Maintainer | Mengelola source code, soal bawaan, dokumentasi, dan release. |
| Kontributor | Memperbaiki simulator, UI, konten, test, atau dokumentasi. |
| Sekolah | Menggunakan platform sebagai media pembelajaran. |

## 5. Design Direction

**Gaya Visual:** Neo-Editorial Swiss Minimalist berbasis modular bento grid dengan hairline border 1px (`#e2e8f0`).
- **Palet Warna:** Putih murni (`#ffffff`), Deep Jet Black (`#0a0a0a`), dan aksen Scarlet Crimson (`#e01a1a`) untuk memandu fokus siswa pada alur paket dan node aktif.
- **Tipografi:** Display Condensed (`Bebas Neue`/`Anton`) untuk judul/kode kelas, Body Sans-serif (`Inter`) untuk instruksi, dan Monospace (`JetBrains Mono` tabular-nums) untuk IPv4, subnet mask, port, dan log transmisi.
- **Radius & Elevasi:** 0px sharp containers untuk area bento/kanvas, pil bulat (`9999px`) untuk tombol aksi & indikator paket. Flat UI murni (zero blur drop-shadows).
- **Preset shadcn/ui:** `npx shadcn@latest apply --preset bLZU0FmLb` sebagai fondasi komponen UI, diselaraskan dengan token kanonikal di `DESIGN.md` dan aturan UX di `DSD.md`.
- **Aksesibilitas:** Seluruh rasio kontras teks dan komponen memenuhi WCAG 2.2 AA (minimum 4.6:1 hingga 19.8:1 AAA).

## 6. Scope

### P0 — MVP-blocking

- Desktop-first responsive web UI; tablet/mobile compatible dengan batasan authoring yang terdokumentasi.
- Workspace simulator dengan perangkat PC, switch, router, server, dan access point.
- Topologi, port, koneksi, konfigurasi IPv4 dasar, subnet mask, dan gateway.
- Logical connectivity dan ping.
- Animasi paket dengan arah, rute perangkat, status berhasil/gagal, dan event log.
- Kontrol play/pause dan speed 0.5x/1x/2x.
- Mode latihan bebas.
- Mode kelas real-time dengan satu host guru.
- Siswa masuk menggunakan class code dan nama panggilan tanpa login.
- Workspace pribadi untuk setiap siswa.
- Guru dapat membagikan soal, melihat peserta, status, hasil validasi, dan preview workspace.
- Reconnect siswa setelah koneksi terputus.
- Host disconnect grace period dengan nilai final TBD.
- Soal dengan initial state, target state, connectivity target, scoring checklist, dan failure behavior.
- Export/import workspace dan soal dengan schema versioning.
- Export hasil sesi oleh guru.
- Validasi input, rate limiting dasar, dan temporary-session expiry.

### P1 — Fast-follow

- Bank soal dan editor soal lengkap.
- Step-by-step packet animation.
- Pause/reset individual.
- PWA/offline mode.
- Riwayat latihan lokal.
- Export screenshot/PDF.
- Perangkat/protokol tambahan.
- Dashboard hasil setelah sesi berakhir.
- Penyimpanan kelas lebih lama.
- Akun guru opsional.

### P2 — Planned backlog

- Akun siswa/guru dan kelas persisten.
- Shared collaborative topology.
- Routing protocol kompleks dan packet-level simulation.
- AI tutor/generator soal.
- Integrasi LMS.
- Gamifikasi dan leaderboard.

### Out of Scope

Full Cisco IOS emulation, mandatory login, pembayaran, AI pada MVP, real-time shared editing, dan klaim alignment kurikulum/regulasi yang belum diverifikasi.

## 7. Product Flows

1. Guru membuka aplikasi, membuat kelas, dan menerima class code serta host code.
2. Siswa membuka aplikasi, memasukkan class code dan nama panggilan.
3. Server memvalidasi sesi aktif dan mengirim classroom snapshot.
4. Guru memilih atau membuat soal P0, lalu memulai soal.
5. Setiap siswa menerima salinan workspace pribadi.
6. Siswa mengubah topologi/konfigurasi dan menjalankan animasi paket.
7. Siswa mengirim hasil; evaluator mengembalikan status dan feedback.
8. Guru memantau ringkasan dan membuka preview hasil.
9. Guru mengekspor hasil atau menutup sesi.

## 8. North Star Metric — Proposed

`Successful Practice Completion Rate = sesi latihan P0 dengan status passed / sesi latihan P0 yang dimulai`.

Instrumentasi minimal: `exercise_started`, `topology_changed`, `packet_run`, `workspace_exported`, `workspace_imported`, `exercise_submitted`, `exercise_completed`. Analytics eksternal tidak boleh aktif tanpa keputusan privacy dan consent yang terpisah.

## 9. Definition of MVP Success

MVP dianggap berhasil bila:

- siswa dapat bergabung tanpa akun menggunakan class code;
- guru dapat menjalankan satu kelas dengan beberapa peserta uji;
- siswa dapat menyelesaikan minimal satu soal end-to-end;
- evaluator membedakan konfigurasi benar, sebagian benar, dan gagal;
- animasi menunjukkan aliran paket sesuai aturan skenario P0;
- reconnect mempertahankan workspace siswa sesuai batas kehilangan state yang disepakati;
- export/import fixture tetap kompatibel pada schema yang didukung;
- critical P0 journeys lulus test dan accessibility baseline.

## 10. Architecture Summary

`PROPOSED`: modular monolith dengan web client, HTTP API, WebSocket realtime gateway, temporary session store, dan simulator core pure TypeScript. Server menjadi authoritative untuk classroom/session state. Setiap siswa memiliki workspace pribadi. Static-only architecture tidak lagi mencukupi karena classroom presence, host control, realtime distribution, dan monitoring adalah kebutuhan P0.

### Type-1 decisions

- Modular monolith vs distributed services: pilih modular monolith untuk P0.
- Server-authoritative realtime session vs peer-to-peer: pilih server-authoritative.
- Workspace persistence: temporary server session + local recovery.
- Resume/export format: versioned JSON sebagai canonical artifact; `CS-...` sebagai session/resume identifier, bukan password.

Keputusan final dan revisit trigger akan dicatat di `ADR/` pada Batch 3.

## 11. Constraints

- Tanpa login wajib.
- Desktop prioritas; mobile compatibility tetap dipertimbangkan.
- Open-source.
- Guru harus online dan menjadi host aktif.
- Data session bersifat sementara secara default.
- Tidak ada credential asli di source atau dokumen.
- Visual token belum final sampai visual audit berhasil.

## 12. Assumption Register

| ID | Assumption | Rationale | Impact if Wrong | Confidence | Owner |
|---|---|---|---|---|---|
| ASM-001 | P0 tanpa akun siswa/guru | User memilih akses tanpa login | High | High | Product Owner |
| ASM-002 | Workspace siswa terpisah | Mengurangi conflict resolution | High | High | Product Owner |
| ASM-003 | Server authoritative untuk session | Diperlukan untuk host/presence | High | Medium | Tech Lead |
| ASM-004 | Host grace period 5–15 menit | Default discovery | Medium | Medium | Product Owner |
| ASM-005 | Retention default 24 jam atau close session | Data minimization | High | Medium | Security Owner |
| ASM-006 | Ping/logical flow cukup untuk P0 | Membatasi simulator | High | High | Curriculum Owner |
| ASM-007 | Screenshot menjadi visual reference | Dinyatakan user | Medium | High | Design Owner |
| ASM-008 | Preset shadcn diterapkan setelah scaffold | Menghindari overwrite tanpa diff | Medium | High | Frontend Owner |
| ASM-009 | Nama panggilan adalah identitas minimum siswa | Tanpa akun | Medium | High | Product Owner |
| ASM-010 | MIT sebagai default license code | Belum diputuskan final | Medium | Medium | Maintainer |

## 13. Top Risks

- `RSK-001`: simulator scope melebar; mitigasi: domain P0 eksplisit.
- `RSK-002`: class/host code disalahpahami sebagai security credential permanen; mitigasi: TTL, entropy, rate limit, dan dokumentasi semantik.
- `RSK-003`: realtime state tidak konsisten; mitigasi: authoritative server, event ordering, snapshot, reconnect test.
- `RSK-004`: animasi tidak sesuai logical network rules; mitigasi: domain engine terpisah dan golden scenario tests.
- `RSK-005`: export schema rusak antarversi; mitigasi: schema version dan migration fixtures.
- `RSK-006`: session data menjadi PII tanpa governance; mitigasi: minimization, retention, deletion, dan tidak ada analytics default.
- `RSK-007`: visual reference diterapkan tanpa bukti token; mitigasi: blok `DESIGN.md` sampai audit visual tersedia.

## 14. Milestones

Milestone berupa urutan kerja, bukan komitmen kalender:

1. Blueprint contracts and decisions.
2. Simulator domain spike and packet animation proof.
3. Classroom session and realtime protocol.
4. P0 UI and exercise flow.
5. Test, accessibility, security, and export compatibility.
6. Deployment smoke test and controlled pilot.

## 15. Current Gate

`CANDIDATE_GATE_B` — Blueprint Batch 1 in progress. Gate C belum dapat diajukan sebelum P0 PRD, ERD/API, security baseline, design decision, testing, tasks, dan traceability selesai.
