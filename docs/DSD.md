# Design System & UX Rules (DSD.md)

> **Project:** NetLab (Cisco Revamp)  
> **Document ID:** DOC-DSD-001  
> **Version:** 1.0.0  
> **Authority:** UI/UX Behavior, Component States, Interaction Rules  
> **Source of Truth for Values:** `DESIGN.md` (Nilai token tidak diduplikasi di sini)  
> **Preset Baseline:** shadcn/ui `bLZU0FmLb`  

---

## 1. Visual Principles & Identity

1. **Architectural Precision**: Antarmuka ditata menggunakan modular bento grid dengan garis sekat 1px tegas (`border`), mencerminkan presisi diagram teknis jaringan komputer.
2. **Intentional Contrast**: Latar kanvas putih bersih (`colors.background`) dipadukan dengan aksen merah Scarlet (`colors.primary`) khusus untuk memandu fokus siswa pada alur transmisi paket data.
3. **Zero-Friction Accessibility**: Masuk ke aplikasi dan kelas online tanpa login atau pembuatan akun. Antarmuka menyajikan informasi secara instan dengan form minimalis.
4. **Physicality & Motion Feedback**: Setiap aksi drag perangkat, penyambungan kabel, dan ping ICMP memberikan umpan balik visual animasi yang dapat dikontrol kecepatannya.

---

## 2. Token References

Semua nilai visual merujuk secara ketat ke `DESIGN.md`:
- Warna brand & aksen: `{colors.primary}`, `{colors.primary-hover}`, `{colors.primary-subtle}`.
- Warna permukaan & kanvas: `{colors.background}`, `{colors.surface}`, `{colors.surface-2}`.
- Teks: `{colors.text-primary}`, `{colors.text-secondary}`, `{colors.text-muted}`, `{colors.text-on-primary}`.
- Tipografi: `{typography.font-family-display}`, `{typography.font-family-body}`, `{typography.font-family-mono}`, `{typography.numeric}`.
- Garis & Radius: `{colors.border}`, `{colors.border-strong}`, `{radius.none}`, `{radius.full}`.
- Animasi & Waktu: `{motion.duration-base}`, `{motion.packet-travel-base}`.

---

## 3. Layout Grid & Workspace Structure

### 3.1 Desktop-First Workspace (Default ≥ 1024px)
```
+-------------------------------------------------------------------------+
| Top Bar (Logo, Nama Topologi/Kelas, Kode CS-XXXX, Status Host, Help)     |
+-------------------+---------------------------------+-------------------+
| Device Dock       | Simulator Canvas (Interactive)  | Inspector Panel   |
| (PC, Switch,      | - Pan & Zoom                    | - Konfigurasi IP  |
|  Router, Server,  | - Node Topologi & Kabel         | - Subnet Mask     |
|  Access Point)    | - Animasi Paket Realtime        | - Gateway / Port  |
+-------------------+---------------------------------+-------------------+
| Terminal / Packet Log & Speed Controls (0.5x, 1x, 2x, Play/Pause, Step)  |
+-------------------------------------------------------------------------+
```
- **Top Bar**: Tinggi `{layout.topbar-height}`, latar `{colors.surface}`, pembatas bawah `1px solid {colors.border}`.
- **Device Dock**: Sisi kiri `{layout.sidebar-collapsed-width}` atau `{layout.sidebar-width}`, menampung ikon perangkat jaringan yang dapat di-drag.
- **Canvas Area**: Fleksibel mengisi sisa ruang layar dengan grid titik halus (*dot grid background*) 20px.
- **Inspector Panel**: Panel kanan selebar `{layout.sidebar-width}` yang otomatis terbuka saat sebuah perangkat diklik.
- **Bottom Bar**: Log riwayat transmisi paket ICMP dengan tombol playback kontrol simulasi.

### 3.2 Tablet & Mobile Adaptations (< 1024px)
- Device dock berubah menjadi *horizontal scroll dock* di sisi bawah.
- Inspector panel bergeser menjadi *bottom sheet drawer* dengan ketinggian yang dapat disesuaikan (swipe-up).
- Canvas mendukung *pinch-to-zoom* dan *two-finger pan*.

---

## 4. Simulator Interaction & Canvas Rules

### 4.1 Menambahkan & Menghubungkan Perangkat
1. **Add Device**: Drag ikon dari dock ke canvas, atau klik ikon lalu klik posisi canvas target. Node langsung terpasang dengan label default (misal: `PC-0`, `Switch-1`).
2. **Link Creation**: 
   - Klik port anchor pada perangkat sumber, tarik garis koneksi ke perangkat tujuan.
   - Muncul popover cepat pemilihan port fisik (misal: `FastEthernet 0/1`).
   - Garis kabel menghubungkan kedua port dengan status link indicator warna hijau (`{colors.success}`).

### 4.2 Inspector & Konfigurasi Perangkat
- Klik node perangkat membuka panel inspector.
- Form konfigurasi mencakup:
  - Device Hostname.
  - Port status (Up/Down).
  - Alamat IPv4 (validasi format `x.x.x.x` dengan font mono `{typography.font-family-mono}`).
  - Subnet Mask (default autofill `/24` = `255.255.255.0`).
  - Default Gateway.
- Auto-save lokal seketika saat input selesai (event *onBlur* atau delay *debounce 300ms*).

---

## 5. Packet Travel & Animation UX

### 5.1 Mekanisme Aliran Paket
1. **Inisiasi Ping**: Pengguna memilih alat "Add PDU" / Ping, lalu mengeklik perangkat asal (`PC-A`) dan perangkat tujuan (`PC-B`).
2. **Visualisasi Transmisi**:
   - Paket data direpresentasikan sebagai kapsul bercahaya berukuran 12×12px berwarna `{colors.primary}`.
   - Partikel bergerak sepanjang segmen kabel hop-by-hop dari interface sumber ke switch/router perantara.
   - Di perangkat layer 2/3 (Switch/Router), terdapat jeda pemrosesan visual selama 150ms dengan efek *pulse*.
3. **Hasil Evaluasi**:
   - **Sukses**: Paket balasan (*ICMP Echo Reply*) kembali ke sumber. Muncul tanda centang hijau (`{colors.success}`) di atas node sumber dan pesan status *"Successful"* di log.
   - **Gagal (Drop/Timeout)**: Jika IP tidak satu subnet tanpa gateway, atau port down, paket berhenti dan memudar merah (`{colors.error}`) di hop yang mengalami kegagalan dengan alasan jelas (*"No route to host"*, *"Request timed out"*).

### 5.2 Kontrol Kecepatan & Playback
- **Tombol Play / Pause**: Menghentikan sementara pergerakan semua paket di kanvas tanpa menghilangkan state transmisi.
- **Speed Selector**: 
  - `0.5x`: Cocok untuk penjelasan detail guru di depan kelas.
  - `1.0x`: Kecepatan default simulasi normal.
  - `2.0x`: Simulasi cepat untuk verifikasi jaringan luas.
- **Step Forward Button**: Menjalankan pergerakan paket sejauh 1 hop untuk analisis frame per frame.

---

## 6. Classroom Session UX (Guru & Siswa)

### 6.1 Alur Guru (Host)
- **Create Room**: Guru menekan tombol "Buka Sesi Kelas" di beranda tanpa login. Sistem menghasilkan kode unik 6 karakter (misal `CS-789K`).
- **Host Presence Indicator**:
  - Selama tab guru terbuka, indikator menampilkan *"Status: Host Aktif"* hijau.
  - Guru dapat membagikan soal latihan dari library atau membuat soal langsung ke semua siswa di kelas dengan 1 tombol *"Bagikan Soal"*.
  - **Daftar Peserta Real-time**: Menampilkan daftar nama siswa, progres verifikasi soal (% selesai), dan tombol *Live Preview* untuk menginspeksi kanvas siswa tanpa mengganggu pekerjaan mereka.
- **Host Disconnect Grace Period**: Jika browser guru tertutup secara tidak sengaja, sistem memberikan waktu toleransi *60 detik* bagi guru untuk reconnect sebelum sesi kelas ditutup.

### 6.2 Alur Siswa (Student)
- **Join Room**: Siswa membuka website, memasukkan kode kelas `CS-XXXXXX` dan mengetik nama panggilan (tanpa password/login).
- **Independent Canvas**: Siswa langsung menerima instruksi dan topologi awal dari guru, lalu mengerjakannya di kanvas masing-masing.
- **Submit / Cek Jawaban**: Siswa dapat menguji konektivitas kapan saja dengan tombol *"Uji Jaringan"*.

---

## 7. Exercise Mode & Format Kode `CS-.....`

1. **Kode Unik Workspace/Soal (`CS-.....`)**:
   - Semua paket latihan memiliki kode unik alfanumerik (misal: `CS-ROUTING-01`, `CS-SUB-A9B3`).
   - Format ini digunakan untuk import/export topologi berstatus belum selesai sehingga siswa bisa melanjutkan tugas di rumah tanpa akun.
2. **Checklist Kriteria Keberhasilan**:
   - Panel soal menyajikan daftar tugas checklist interaktif:
     - [ ] Hubungkan PC-0 ke Switch-0
     - [ ] Konfigurasi IP PC-0: `192.168.1.10/24`
     - [ ] Berhasil Ping dari PC-0 ke Web Server `192.168.1.1`
   - Setiap item checklist otomatis tercentang hijau saat simulator mendeteksi kriteria terpenuhi.

---

## 8. Component States Inventory

Setiap komponen wajib mengimplementasikan seluruh state berikut:

| Komponen | Default State | Hover State | Active / Selected State | Disabled State | Error / Alert State |
|---|---|---|---|---|---|
| **Node Perangkat** | Outline tipis `{colors.border-strong}`, badge teks normal | Border `{colors.primary}`, pointer kursor | Border tebal `{colors.primary}`, background `{colors.primary-subtle}` | Opacity 40%, kursor not-allowed | Indikator merah link down |
| **Port Anchor** | Titik abu-abu netral | Membesar 1.5x warna `{colors.primary}` | Terhubung garis aktif | Hidden saat mode view-only | Merah saat kabel salah tipe |
| **Button Primary** | `{colors.primary}` padat, teks putih | `{colors.primary-hover}` | Active scale 0.98 | Opacity 40%, disabled | Red ring saat aksi diblokir |
| **Button Secondary** | `{colors.surface}`, border abu-abu | Background `{colors.surface-hover}` | Border hitam tebal | Opacity 40% | Border merah |
| **Form Input IP** | Border `{colors.border}`, font mono | Border `{colors.border-strong}` | Focus ring `{shadow.focus}` | Background abu-abu muda | Border `{colors.error}`, teks peringatan di bawah |
| **Room Code Box** | Kotak hitam secondary, teks putih | Ring merah halus | Efek tersalin *"Copied!"* | Read-only | Merah jika sesi kadaluarsa |

---

## 9. Accessibility & Inclusivity (WCAG 2.2 AA)

1. **Keyboard Navigation**:
   - `Tab` / `Shift+Tab`: Berpindah antarelemen kontrol dan perangkat pada kanvas.
   - `Arrow Keys`: Menggeser posisi perangkat yang sedang aktif di kanvas.
   - `Delete` / `Backspace`: Menghapus node atau kabel yang sedang terpilih.
   - `Spacebar`: Play / Pause animasi transmisi paket data.
   - `Escape`: Menutup modal inspector konfigurasi atau membatalkan penarikan kabel.
2. **Screen Reader Announcements (`aria-live`)**:
   - Saat ping berhasil: membacakan *"Ping ke 192.168.1.1 berhasil dalam 2 hop"*.
   - Saat paket gagal: membacakan *"Paket gagal mencapai tujuan: rute tidak ditemukan"*.
3. **Color-Blind Safe Visuals**:
   - Status koneksi tidak hanya mengandalkan warna hijau/merah, melainkan menyertakan ikon tanda centang (`✓`) atau silang (`✗`) dan teks status eksplisit (*UP*, *DOWN*, *ERR*).

---

## 10. Rules to Never Break & Always Follow

### Never Break
1. Dilarang meminta autentikasi kata sandi atau registrasi akun di alur pengguna mana pun.
2. Dilarang menyembunyikan status kegagalan pengiriman paket tanpa alasan error yang informatif.
3. Dilarang menghapus topologi pekerjaan siswa di kanvas saat koneksi internet terputus sesaat (wajib simpan di `localStorage`).

### Always Follow
1. Selalu sediakan tombol salin cepat (*click-to-copy*) untuk kode kelas dan kode `CS-.....`.
2. Selalu sediakan tombol reset kanvas dengan konfirmasi modal sebelum menghapus topologi.
3. Selalu tampilkan peringatan waktu toleransi (*grace period*) jika guru host offline.
