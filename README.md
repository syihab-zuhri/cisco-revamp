# cisco-revamp

> **NetLab** — Platform Media Pembelajaran Jaringan Komputer & Internet Berbasis Web untuk Siswa SMA (Alternatif Ringan Cisco Packet Tracer).

---

## 📌 Ringkasan Proyek

NetLab adalah website open-source yang dirancang untuk memudahkan siswa SMA mempelajari konsep dasar jaringan komputer dan internet tanpa perlu menginstal aplikasi desktop yang berat atau melakukan login akun (*zero-friction*).

### Fitur Utama:
1. **Simulator Jaringan Interaktif**: Kanvas topologi browser-first dengan perangkat PC, Switch, Router, Server, dan Access Point.
2. **Animasi Perjalanan Paket (ICMP/Ping)**: Visualisasi transmisi data hop-by-hop dengan indikator keberhasilan, rute aktif, log event, dan kontrol pemutaran (*pause/play*, *speed 0.5x, 1x, 2x*, dan *step-by-frame*).
3. **Mode Kelas Realtime (Guru & Siswa)**:
   - Guru membuat ruang kelas dan mendapatkan kode unik kelas (`CS-XXXXXX`).
   - Siswa bergabung hanya dengan memasukkan kode dan nama panggilan (tanpa login).
   - Guru bertindak sebagai host aktif yang wajib berada di dalam kelas; dilengkapi *grace period* 60 detik jika koneksi host terputus.
   - Guru dapat membagikan soal, memantau kemajuan siswa, dan melihat *live preview* kanvas siswa.
4. **Mode Latihan & Ekspor/Impor**:
   - Soal latihan terstruktur dengan kriteria penilaian otomatis.
   - Dukungan ekspor/impor pekerjaan belum selesai dalam format kode unik `CS-.....` atau JSON terversi.
5. **Desain UI Modern (Neo-Editorial Swiss Style)**:
   - Berbasis modular bento grid dengan kontras tinggi (`#ffffff`, `#0a0a0a`, aksen Scarlet Crimson `#e01a1a`).
   - Fondasi komponen menggunakan preset **shadcn/ui** `bLZU0FmLb`.
   - Standar aksesibilitas WCAG 2.2 AA.

---

## 📂 Dokumentasi & Blueprint Proyek (`docs/`)

Seluruh dokumen perencanaan arsitektur, spesifikasi, dan desain sistem tersimpan rapi di dalam folder [`docs/`](./docs/):

| Kategori | Dokumen Utama |
|---|---|
| **Status & Panduan** | [`PROJECT_MANIFEST.md`](./docs/PROJECT_MANIFEST.md) · [`PLANNING.md`](./docs/PLANNING.md) · [`CHANGELOG.md`](./docs/CHANGELOG.md) |
| **Kebutuhan & Spesifikasi** | [`SRS.md`](./docs/SRS.md) · [`PRD/`](./docs/PRD/) (`CLASSROOM_SESSION.md`, `NETWORK_SIMULATOR.md`, `EXERCISE_MODE.md`, `EXPORT_IMPORT.md`) |
| **Arsitektur & API** | [`ARCHITECTURE.md`](./docs/ARCHITECTURE.md) · [`API.md`](./docs/API.md) · [`openapi.yaml`](./docs/openapi.yaml) · [`ERD.md`](./docs/ERD.md) · [`ADR/`](./docs/ADR/) |
| **Desain & UX** | [`DESIGN.md`](./docs/DESIGN.md) (Token Registry & WCAG Report) · [`DSD.md`](./docs/DSD.md) (UX Rules) |
| **Eksekusi & Mutu** | [`TASKS.md`](./docs/TASKS.md) (18 Task P0) · [`TESTING.md`](./docs/TESTING.md) · [`TRACEABILITY.md`](./docs/TRACEABILITY.md) |
| **Operasional & Handoff** | [`ENVIRONMENT.md`](./docs/ENVIRONMENT.md) · [`RUNBOOK.md`](./docs/RUNBOOK.md) · [`AGENTS.md`](./docs/AGENTS.md) · [`RELEASE_CHECKLIST.md`](./docs/RELEASE_CHECKLIST.md) |

---

## 🚦 Status Kesiapan (Readiness Gate)

- **Current Gate:** `GATE_C` (Implementation Ready)
- **Readiness Score:** **95.75 / 100** (Ambang minimum Gate C: ≥ 75, Traceability ≥ 8/10)
- **P0 Traceability:** 100% Covered
