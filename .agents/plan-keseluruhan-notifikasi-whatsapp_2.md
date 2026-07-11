# Plan keseluruhan (revisi): halaman monitoring masa berlaku dokumen + notifikasi WhatsApp

**Project:** PM Dashboard MKN
**Modul:** Monitoring Masa Berlaku Dokumen (Expiry Monitoring)
**Stack:** React 18 + Vite + TS + TailwindCSS + shadcn/ui (frontend) · .NET 8 ASP.NET Core (backend) · MySQL
**Perubahan dari plan sebelumnya:** notifikasi via **WhatsApp (Fonnte/Wablas)** menggantikan email, karena setup lebih cepat dan tidak tergantung konfigurasi M365 admin.

---

## 1. Tujuan modul

Satu halaman untuk memantau seluruh dokumen operasional (ijin, sertifikasi, polis asuransi, kontrak, dll) beserta masa berlakunya, dengan:
- Status otomatis (aman / segera berakhir / expired)
- Link akses file dokumen (OneDrive/SharePoint, bukan upload ke server)
- Notifikasi **WhatsApp otomatis** ke PIC saat dokumen mendekati expired

---

## 2. Scope keseluruhan

| Fase | Output |
|---|---|
| Fase 1 | Database & API dasar (CRUD dokumen) |
| Fase 2 | Halaman frontend: tabel, filter, search, metric card |
| Fase 3 | Form tambah/edit dokumen + field link OneDrive + no. WA PIC |
| Fase 4 | Notifikasi WhatsApp otomatis (cron harian via Fonnte/Wablas) |
| Fase 5 | Nice-to-have: import Excel, riwayat perpanjangan, export laporan |

---

## 3. FASE 1 — Database & backend dasar (2–3 hari)

### Skema tabel `Documents`
| Kolom | Tipe | Keterangan |
|---|---|---|
| Id | int PK | |
| NamaDokumen | varchar | |
| Tipe | varchar | Ijin frekuensi / Sertifikasi unit / Polis asuransi / Kontrak service |
| NoReferensi | varchar, nullable | REF/CERT/POL/KONT number |
| TanggalBerlaku | date | |
| TanggalBerakhir | date | dipakai untuk hitung status & notifikasi |
| PIC | varchar, nullable | nama penanggung jawab |
| PICPhone | varchar, nullable | format `6281234567890`, dipakai untuk WA |
| FileLink | varchar, nullable | link OneDrive/SharePoint |
| FollowUpStatus | varchar, default `Pending` | `Pending` \| `SedangDiproses` \| `Selesai` — dipakai untuk stop notifikasi kalau PIC sudah aware |
| CreatedAt / UpdatedAt | datetime | |

### Tugas
- [ ] Migration tabel `Documents`
- [ ] Endpoint `GET /documents` (list + filter + search + pagination)
- [ ] Endpoint `GET /documents/summary` (total, akan berakhir <30 hari, expired)
- [ ] Endpoint `POST /documents`, `PUT /documents/{id}`, `DELETE /documents/{id}`
- [ ] Endpoint `PATCH /documents/{id}/follow-up-status` — khusus update status tindak lanjut tanpa perlu buka form edit penuh
- [ ] Logic status on-the-fly: `>30 hari` Aman · `0–30 hari` Segera berakhir · `<0 hari` Expired
- [ ] Reset otomatis: kalau `TanggalBerakhir` di-update (dokumen diperpanjang) → `FollowUpStatus` balik ke `Pending`

---

## 4. FASE 2 — Halaman frontend (2–3 hari)

- [ ] Breadcrumb + header + tombol "Tambah Dokumen"
- [ ] 3 metric card: Total Dokumen, Akan Berakhir (<30 hari), Sudah Expired
- [ ] Search bar + filter Tipe & Status + Reset Filter
- [ ] Tabel: No, Nama Dokumen, Tipe, Tanggal Berakhir, Sisa Hari, Status (badge), Status Tindak Lanjut, Aksi
- [ ] Pagination
- [ ] Komponen: `DocumentsPage.tsx`, `DocumentSummaryCards.tsx`, `DocumentTable.tsx`, `DocumentFilters.tsx`
- [ ] React Query untuk fetch + cache
- [ ] Kolom Aksi: "Lihat file", Edit, Hapus, **dropdown/tombol "Tandai Sedang Diproses"** (badge kecil: Pending abu-abu / Sedang Diproses biru / Selesai hijau)

---

## 5. FASE 3 — Form tambah/edit dokumen (1 hari)

### Field form
Nama dokumen, Tipe, No. Referensi, Tanggal Berlaku, Tanggal Berakhir, Penanggung Jawab (nama), **No. WhatsApp PIC**, Link Dokumen (OneDrive/SharePoint)

*(`FollowUpStatus` tidak masuk form tambah/edit — diubah lewat aksi cepat di tabel, bukan lewat form penuh)*

### Tugas
- [ ] Modal/dialog form (shadcn/ui `Dialog`)
- [ ] Validasi: tanggal berakhir > tanggal berlaku, format no. WA (awali `62`, angka saja), link URL valid
- [ ] Submit → `POST`/`PUT` ke API, refresh tabel
- [ ] Komponen aksi cepat di tabel: dropdown ubah `FollowUpStatus` (`Pending` → `SedangDiproses` → `Selesai`), panggil `PATCH /documents/{id}/follow-up-status`, tidak perlu buka modal edit penuh

---

## 6. FASE 4 — Notifikasi WhatsApp otomatis (2–3 hari, lebih cepat dari versi email)

### 6.1 Setup provider (0.5 hari)
- [ ] Daftar akun **Fonnte** atau **Wablas**
- [ ] Siapkan 1 nomor WA khusus sistem (bukan nomor pribadi — supaya sesi tidak putus kalau ganti device)
- [ ] Scan QR untuk connect nomor ke device provider
- [ ] Dapatkan API key/token

### 6.2 Database (0.5 hari)
- [ ] Tabel `NotificationHistory` (`DocumentId`, `NotifiedAt`, `DaysRemaining`) — anti-duplikat kirim
- [ ] Pastikan `PICPhone` terisi untuk dokumen yang mau dinotif

### 6.3 Backend: WhatsAppService (0.5–1 hari)
- [ ] Interface `IWhatsAppService` dengan method `SendDocumentExpiryMessageAsync(string phone, DocumentExpiryItem item)`
- [ ] Implementasi pakai `HttpClient` POST ke endpoint provider (Fonnte: `https://api.fonnte.com/send`)
- [ ] Format pesan teks (bukan HTML kayak email) — contoh:
  ```
  [PM Dashboard MKN]
  Dokumen: Sertifikasi Alat Uji Radio HT-102
  Status: akan berakhir 7 hari lagi (25 Jul 2026)
  Link: https://mkngroup-my.sharepoint.com/...
  Cek detail: https://dashboard.mknops.web.id/documents/45
  ```
- [ ] Handle response error dari provider (nomor tidak valid, kuota habis, dll) — log, jangan sampai crash job

### 6.4 Background job / cron (0.5 hari)
- [ ] `DocumentExpiryNotificationService : BackgroundService` (struktur sama seperti versi email, cuma ganti pemanggilan ke `IWhatsAppService`)
- [ ] Threshold notifikasi: H-30, H-14, H-7, H-3, H-1, H-0
- [ ] Cek `NotificationHistory` sebelum kirim, supaya tidak dobel di hari sama
- [ ] **Filter tambahan: skip dokumen dengan `FollowUpStatus == "SedangDiproses"` atau `"Selesai"`** — PIC yang sudah aware tidak akan dikirimi ulang, walau masuk threshold H-14/H-7/dst
- [ ] Kirim **per-PIC individual** (bukan 1 digest kayak email) — karena tujuannya WA personal ke PIC masing-masing dokumen
- [ ] Kalau ada dokumen tanpa `PICPhone` terisi, skip + log warning (jangan bikin job gagal)
- [ ] `FollowUpStatus` otomatis reset ke `Pending` kalau `TanggalBerakhir` diperbarui (dokumen sudah diperpanjang) — supaya siklus notifikasi jalan lagi untuk masa berlaku yang baru

### 6.5 Konfigurasi
- [ ] `appsettings.json`:
```json
"WhatsAppSettings": {
  "Provider": "fonnte",
  "ApiKey": "isi-token-dari-fonnte",
  "BaseUrl": "https://api.fonnte.com/send"
}
```
- [ ] API key disimpan di environment variable/secrets, bukan di file yang ikut commit

### 6.6 Testing (0.5 hari)
- [ ] Kirim test manual ke no. WA sendiri dulu
- [ ] Test kondisi: dokumen tanpa `PICPhone` (harus di-skip, bukan error)
- [ ] Test anti-duplikat: jalankan job 2x di hari sama
- [ ] Cek format pesan tampil rapi di WA (line break, emoji kalau dipakai)

---

## 7. Jadwal notifikasi & mekanisme "sudah aware" (acknowledge)

### Kapan PIC dapat notifikasi
Cron jalan tiap hari jam 07:00 WIB, tapi PIC hanya dapat WA di titik-titik tertentu, bukan tiap hari:

| Sisa hari | Terkirim |
|---|---|
| H-30 | ✅ |
| H-14 | ✅ |
| H-7 | ✅ |
| H-3 | ✅ |
| H-1 | ✅ |
| H-0 (hari expired) | ✅ |

Total maksimal **6 kali** notifikasi per dokumen dari awal terdeteksi sampai hari expired — bukan spam harian.

### Cara berhenti kirim kalau PIC sudah aware
- Di tabel dashboard, PIC/admin klik **"Tandai Sedang Diproses"** pada dokumen yang sudah mulai ditangani
- Begitu status berubah jadi `SedangDiproses` atau `Selesai`, background job otomatis **skip** dokumen itu di threshold berikutnya (H-14, H-7, dst) — tidak perlu hapus riwayat notifikasi atau logic manual lain
- Kalau dokumen sudah diperpanjang (`TanggalBerakhir` diupdate ke tanggal baru), status otomatis balik ke `Pending` — siklus notifikasi untuk masa berlaku baru mulai dari awal lagi

### Kenapa bukan "PIC balas WA untuk konfirmasi"
Opsi itu (balas chat → otomatis update status) lebih nyaman buat PIC tapi butuh integrasi webhook 2 arah dari provider (Fonnte/Wablas) dan parsing pesan masuk — lebih kompleks dan rawan salah tangkap balasan. Didorong ke **Fase 5** kalau nanti dirasa perlu; untuk versi awal cukup 1 klik di dashboard.

---

## 8. FASE 5 — Nice to have (opsional, belakangan)

- [ ] Import Excel massal untuk migrasi 1.248 dokumen existing (termasuk kolom no. WA PIC)
- [ ] Riwayat perpanjangan per dokumen
- [ ] Export laporan ke Excel/PDF
- [ ] Tambahan: 1 digest mingguan ke admin/PM (rekap semua dokumen mendekati expired), terpisah dari notifikasi per-PIC harian
- [ ] Role-based access untuk tambah/edit/hapus dokumen
- [ ] Konfirmasi via balas chat WA (webhook 2 arah) sebagai alternatif tombol manual di dashboard

---

## 9. Timeline ringkas

| Fase | Estimasi | Prasyarat |
|---|---|---|
| Fase 1 — Database & API | 2–3 hari | — |
| Fase 2 — Halaman frontend | 2–3 hari | Fase 1 selesai |
| Fase 3 — Form dokumen | 1 hari | Fase 2 selesai |
| Fase 4 — Notifikasi WhatsApp | 2–3 hari | Fase 1 selesai, bisa paralel dengan Fase 2/3 |
| Fase 5 — Nice to have | fleksibel | Fase 1–4 stabil |

**Total inti (Fase 1–4): ± 7–10 hari kerja** — lebih cepat ±2 hari dibanding versi email karena tidak perlu menunggu koordinasi setup M365 admin (SMTP AUTH, App Password, dll).

---

## 10. Perbandingan singkat vs versi email

| Aspek | Email (M365) | WhatsApp (Fonnte/Wablas) |
|---|---|---|
| Setup awal | Perlu koordinasi admin M365 (SMTP AUTH, MFA/App Password) | Daftar akun + scan QR, mandiri tanpa admin lain |
| Biaya | Gratis (pakai mailbox existing) | Berlangganan provider (~Rp 50-100rb/bulan) |
| Kecepatan dibaca PIC | Tergantung kebiasaan cek email | WA biasanya lebih cepat direspon |
| Reliabilitas jangka panjang | Stabil, resmi | Tergantung kebijakan provider & WhatsApp (rawan perubahan API/kena limit) |
| Cocok untuk | Digest/rekap ke admin | Notifikasi personal cepat ke PIC lapangan |

Kalau resource memungkinkan, opsi terbaik jangka panjang sebenarnya **pakai keduanya**: WhatsApp untuk notifikasi cepat ke PIC, email untuk 1 laporan rekap mingguan ke admin/PM — tapi itu bisa menyusul di Fase 5, tidak perlu dikerjakan bersamaan di awal.

---

## 11. Urutan pengerjaan yang disarankan

1. Fase 1 dulu (fondasi data & API)
2. Fase 2 + Fase 4 jalan bersamaan (tidak saling bergantung setelah Fase 1 selesai)
3. Fase 3 menyusul setelah Fase 2
4. Fase 5 kapan saja setelah sistem inti stabil
