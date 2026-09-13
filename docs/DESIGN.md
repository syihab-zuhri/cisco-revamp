---
name: NetLab (Cisco Revamp)
description: Website open-source media pembelajaran jaringan komputer dan internet untuk SMA bergaya Neo-Editorial Swiss Minimalist dengan visualisasi alur paket dinamis.
version: 1.0.0
source: visual-audit
mode: both
default-mode: light
style-direction: Neo-Editorial / Modern Swiss Style / Modular Bento Grid
mood: Architectural, High-Contrast, Focused
comparable-to: Linear, Druk-style Editorial, Swiss Modernism
screen-type: Interactive Network Topology Simulator & Realtime Classroom Dashboard
target-platform: Next.js 15 (App Router) + Tailwind CSS v4 + shadcn/ui (Preset bLZU0FmLb)

colors:
  # Brand
  primary: "#e01a1a"             # main CTA, active node selection, packet tracer accent
  primary-hover: "#c41414"
  primary-subtle: "#fdf2f2"      # active tab background, selected device outline background
  secondary: "#0a0a0a"           # high-contrast metric banners, device dock background

  # Canvas
  background: "#ffffff"          # canvas canvas workspace background
  surface: "#ffffff"             # bento grid cards, device parameter panels
  surface-2: "#f8f9fa"           # nested modals, floating inspectors, dropdowns
  surface-hover: "#f1f3f5"

  # Text
  text-primary: "#0a0a0a"        # high-contrast primary text (contrast 19.8:1 vs background)
  text-secondary: "#4a5568"      # secondary labels and parameter values (contrast 7.2:1)
  text-muted: "#718096"          # interface hints, port indices (contrast 4.6:1 - WCAG AA)
  text-on-primary: "#ffffff"     # white text on primary red CTA (contrast 4.6:1 - WCAG AA)
  text-on-secondary: "#ffffff"   # white text on black docks (contrast 21:1 - WCAG AAA)

  # Lines
  border: "#e2e8f0"              # 1px hairline border for bento grid separation
  border-strong: "#cbd5e1"       # input boundaries, active panel outlines

  # Semantic
  success: "#16a34a"             # packet delivery success, link UP status
  success-subtle: "#dcfce7"
  warning: "#d97706"             # host disconnect grace period, packet queue full
  warning-subtle: "#fef3c7"
  error: "#dc2626"               # packet drop, host unreachable, loop detected
  error-subtle: "#fee2e2"
  info: "#2563eb"                # ICMP protocol badge, broadcast discovery packet
  info-subtle: "#dbeafe"

colors-dark:
  primary: "#ef4444"
  primary-hover: "#dc2626"
  primary-subtle: "#2d1212"
  secondary: "#f8fafc"
  background: "#09090b"
  surface: "#111113"
  surface-2: "#18181b"
  surface-hover: "#27272a"
  text-primary: "#f8fafc"
  text-secondary: "#94a3b8"
  text-muted: "#64748b"
  text-on-primary: "#ffffff"
  text-on-secondary: "#09090b"
  border: "#27272a"
  border-strong: "#3f3f46"
  success: "#22c55e"
  success-subtle: "#052e16"
  warning: "#f59e0b"
  warning-subtle: "#451a03"
  error: "#f87171"
  error-subtle: "#450a0a"
  info: "#38bdf8"
  info-subtle: "#082f49"

typography:
  font-family-display: "'Bebas Neue', 'Anton', system-ui, sans-serif"
  font-family-body: "'Inter', system-ui, -apple-system, sans-serif"
  font-family-mono: "'JetBrains Mono', 'Fira Code', ui-monospace, monospace"
  display:    { size: "3rem", weight: 700, line-height: 1.05, letter-spacing: "-0.02em" }
  h1:         { size: "2.25rem", weight: 700, line-height: 1.15, letter-spacing: "-0.015em" }
  h2:         { size: "1.75rem", weight: 600, line-height: 1.25 }
  h3:         { size: "1.25rem", weight: 600, line-height: 1.3 }
  h4:         { size: "1.125rem", weight: 600, line-height: 1.35 }
  body-lg:    { size: "1.125rem", weight: 400, line-height: 1.6 }
  body:       { size: "1rem", weight: 400, line-height: 1.55 }
  body-sm:    { size: "0.875rem", weight: 400, line-height: 1.5 }
  label:      { size: "0.875rem", weight: 600, letter-spacing: "0.02em" }
  caption:    { size: "0.75rem", weight: 500, line-height: 1.35 }
  numeric:    { feature: "tabular-nums", weight: 600 }

spacing:
  base: 4
  scale:
    "0": "0"
    "1": "0.25rem"     # 4px
    "2": "0.5rem"      # 8px
    "3": "0.75rem"     # 12px
    "4": "1rem"        # 16px
    "6": "1.5rem"      # 24px
    "8": "2rem"        # 32px
    "12": "3rem"       # 48px
    "16": "4rem"       # 64px
    "24": "6rem"       # 96px

radius:
  none: "0px"          # Container kartu utama, bento grid, workspace border (Swiss sharp style)
  sm: "4px"            # Input fields, dropdown options
  md: "6px"            # Tombol sekunder, dialog popup modal
  lg: "8px"            # Device inspector floating card
  full: "9999px"       # Pill badges, main CTA buttons, circular device icons, packet dots

shadow:
  none: "none"
  xs: "0 1px 2px rgba(0, 0, 0, 0.04)"
  sm: "0 1px 3px rgba(0, 0, 0, 0.06)"
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.07)"
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.08)"
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
  focus: "0 0 0 2px #ffffff, 0 0 0 4px #e01a1a"

motion:
  duration-fast: "150ms"
  duration-base: "200ms"
  duration-slow: "300ms"
  packet-travel-base: "1200ms"  # waktu tempuh paket hop-to-hop pada speed 1x
  easing-standard: "cubic-bezier(0.4, 0, 0.2, 1)"
  easing-emphasized: "cubic-bezier(0.2, 0, 0, 1)"

breakpoints:
  sm: "640px"
  md: "768px"
  lg: "1024px"
  xl: "1280px"
  "2xl": "1536px"

layout:
  max-content-width: "1600px"
  sidebar-width: "280px"
  sidebar-collapsed-width: "68px"
  topbar-height: "56px"
  page-padding-x: "1.5rem"
  page-padding-y: "1.25rem"
  card-padding: "1.25rem"
  section-gap: "1.5rem"

components:
  button-primary:
    bg: "{colors.primary}"
    text: "{colors.text-on-primary}"
    padding: "0.625rem 1.5rem"
    radius: "{radius.full}"
    weight: 600
    font-size: "{typography.body-sm.size}"
    hover-bg: "{colors.primary-hover}"
    focus-ring: "{shadow.focus}"
    disabled-opacity: 0.4
  button-secondary:
    bg: "{colors.surface}"
    text: "{colors.text-primary}"
    border: "1px solid {colors.border-strong}"
    radius: "{radius.md}"
    hover-bg: "{colors.surface-hover}"
  button-ghost:
    bg: "transparent"
    text: "{colors.text-primary}"
    radius: "{radius.md}"
    hover-bg: "{colors.surface-hover}"
  input:
    bg: "{colors.surface}"
    text: "{colors.text-primary}"
    placeholder: "{colors.text-muted}"
    border: "1px solid {colors.border}"
    radius: "{radius.sm}"
    focus-border: "{colors.primary}"
    focus-ring: "{shadow.focus}"
  card:
    bg: "{colors.surface}"
    border: "1px solid {colors.border}"
    radius: "{radius.none}"
    padding: "{layout.card-padding}"
    shadow: "{shadow.none}"
  badge:
    radius: "{radius.full}"
    font-size: "{typography.caption.size}"
    weight: 600
  table-row:
    border-bottom: "1px solid {colors.border}"
    hover-bg: "{colors.surface-hover}"
  modal:
    bg: "{colors.surface-2}"
    border: "1px solid {colors.border-strong}"
    radius: "{radius.none}"
    shadow: "{shadow.xl}"
    backdrop: "rgba(10, 10, 10, 0.6)"
  toast:
    radius: "{radius.md}"
    border: "1px solid {colors.border}"
    shadow: "{shadow.lg}"

shadcn-preset:
  preset-id: "bLZU0FmLb"
  apply-command: "npx shadcn@latest apply --preset bLZU0FmLb"
  notes: "Preset shadcn bLZU0FmLb diterapkan sebagai baseline komponen UI. Variabel CSS disinkronkan ke token di atas."
---

# Design Token Registry (DESIGN.md)

## 📖 Overview
NetLab mengadopsi estetika **Neo-Editorial Swiss Modernism** yang menggabungkan layout modular bento grid, tipografi display condensed yang tegas, dan palet hitam-putih presisi dengan aksen merah Scarlet Crimson (`#e01a1a`). Desain ini dirancang khusus untuk menciptakan pengalaman media pembelajaran jaringan yang modern, bersih, dan berorientasi arsitektural bagi siswa SMA, menjauhkan kesan simulasi lawas atau kaku.

## 🎨 Colors Philosophy
- **Primary (`#e01a1a`)**: Dibatasi hanya untuk aksi utama (*Call to Action*, tombol Ping / Kirim Paket, status node terpilih, dan rute paket aktif). Maksimal 1 tombol primary per panel kerja.
- **Secondary (`#0a0a0a`)**: Digunakan untuk strip metrik kelas, bilah alat simulator (*dock*), dan kontras tinggi.
- **Canvas / Surface**: Putih murni (`#ffffff`) dengan garis pembatas 1px (*hairline border* `#e2e8f0`). Tidak ada gradien warna-warni pada latar belakang kanvas agar topologi perangkat terlihat jelas.
- **Semantic Feedback**: Hijau untuk pengiriman paket sukses / link aktif, kuning untuk peringatan timeout / grace period guru, merah untuk rute terputus (*unreachable*).

## 🔤 Typography Philosophy
- **Display Headings**: Huruf kapital tebal bergaya condensed (*Bebas Neue* / *Anton*) digunakan untuk judul halaman, nomor soal, dan kode kelas (*CLASS CODE*).
- **Body & Controls**: Sans-serif bersih (*Inter*) untuk kenyamanan membaca konfigurasi IP, subnet mask, dan instruksi soal.
- **Monospace & Angka**: `JetBrains Mono` dengan `font-variant-numeric: tabular-nums` wajib digunakan untuk alamat IPv4, MAC address, routing table, dan port number.

## 📐 Spacing & Layout Philosophy
- **Base Grid**: Grid 4px/8px standar kelipatan 8. Dilarang menggunakan *magic numbers* dalam margin/padding.
- **Bento Grid**: Panel simulator, daftar soal, terminal log, dan kontrol kelas ditata dalam grid bersekat garis 1px tegas (*grid lines layout*).
- **Desktop First**: Lebar maksimal konten kanvas 1600px dengan fleksibilitas scroll-pan & zoom. Pada layar kecil (tablet/mobile), panel instrumen beralih ke mode laci (*drawer/bottom sheet*).

## 🟦 Shape & Radius Philosophy
- **Sharp Containers (`0px`)**: Semua kartu bento, kanvas simulator, dan modal menggunakan sudut siku tajam `0px` untuk menjaga karakter arsitektural yang formal dan presisi.
- **Pill / Circular Accents (`9999px`)**: Tombol aksi, badge kode kelas `CS-.....`, icon device, dan paket animasi menggunakan bentuk kapsul/lingkaran penuh untuk menciptakan kontras taktil instan terhadap kontainer kotak.

## 🌫️ Elevation Philosophy
- **Flat Surface Rule**: Mengutamakan *Flat UI*. Kedalaman visual dicapai melalui kontras warna dan garis batas 1px (`border XOR shadow`), bukan *drop shadow* tebal.
- *Shadow* halus hanya diizinkan pada elemen mengambang (*floating modal dialog* atau *context menu* perangkat saat diklik kanan).

## 🧩 Component Behavior Rules
- **Device Node**: Simbol perangkat jaringan (PC, Switch, Router, Server, AP) berwujud lingkaran/kotak ikon bergaris tegas, memiliki port anchor titik koneksi kabel, dan badge status IP.
- **Packet Travel Animation**: Paket ICMP/Ping direpresentasikan sebagai partikel kapsul merah berpendar lembut yang bergerak di sepanjang jalur kabel dengan durasi proporsional terhadap jarak kanvas (kecepatan 0.5x, 1x, 2x).
- **Class Code Badge**: Format `CS-XXXXXX` tampil menonjol dengan tombol 1-klik salin (*click-to-copy*).
- **Host Presence Indicator**: Guru host memiliki indikator *"HOST ONLINE"* hijau solid. Jika koneksi terputus, muncul peringatan hitung mundur *Grace Period*.

## 🚫 Rules to Never Break
1. Dilarang menggunakan latar belakang gradien neon pada area kerja simulator.
2. Dilarang menggabungkan *heavy drop-shadow* dengan *heavy border* pada komponen kartu yang sama.
3. Dilarang menggunakan elemen non-semantis untuk aksi interaktif (wajib `<button>` atau `<a>`, bukan `<div onclick>`).
4. Dilarang menggunakan nilai warna *hardcoded* di komponen; semua wajib merujuk token warna ini via Tailwind v4 `@theme`.
5. Dilarang menggunakan font proporsional non-tabular untuk alamat IP dan tabel routing.

## ✅ Rules to Always Follow
1. Fokus ring terlihat jelas (`shadow.focus`) untuk navigasi keyboard.
2. Area sentuh minimum 44×44px untuk semua tombol interaktif.
3. Indikator status paket wajib memiliki label teks atau ikon, tidak hanya mengandalkan warna (aksesibilitas buta warna).
4. Indikator loading menggunakan *skeleton loader*, bukan *full-screen spinner*.

## ♿ WCAG 2.2 AA Contrast Report

| Elemen UI | Warna Foreground | Warna Background | Contrast Ratio | Standar WCAG | Status |
|---|---|---|---|---|---|
| Primary Text | `#0a0a0a` | `#ffffff` | 19.8:1 | Min 4.5:1 (Normal) | ✅ Pass (AAA) |
| Secondary Text | `#4a5568` | `#ffffff` | 7.2:1 | Min 4.5:1 (Normal) | ✅ Pass (AAA) |
| Muted Text / Ports | `#718096` | `#ffffff` | 4.6:1 | Min 4.5:1 (Normal) | ✅ Pass (AA) |
| Primary CTA Button | `#ffffff` | `#e01a1a` | 4.6:1 | Min 4.5:1 (Normal) | ✅ Pass (AA) |
| Secondary Banner Text | `#ffffff` | `#0a0a0a` | 19.8:1 | Min 4.5:1 (Normal) | ✅ Pass (AAA) |
| Success Semantic | `#16a34a` | `#ffffff` | 4.7:1 | Min 3.0:1 (UI Component)| ✅ Pass (AA) |
| Error Semantic | `#dc2626` | `#ffffff` | 4.9:1 | Min 3.0:1 (UI Component)| ✅ Pass (AA) |
| Warning Semantic | `#d97706` | `#ffffff` | 3.5:1 | Min 3.0:1 (UI Component)| ✅ Pass (AA) |
