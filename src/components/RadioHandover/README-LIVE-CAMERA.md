# Fitur Live Camera untuk Foto Radio

## Overview

Fitur **Live Camera Capture** memungkinkan pengguna mengambil foto radio langsung dari kamera perangkat (HP/laptop) saat melakukan proses serah terima, tanpa harus mengambil foto dulu lalu upload dari galeri. Ini menghemat memori HP karena foto langsung dikompresi sebelum disimpan (max 1280×960, quality 0.82, sekitar 100–250 KB per foto).

---

## Komponen Baru

### `LiveCameraCapture.tsx`

Modal fullscreen kamera live dengan fitur:

- **Auto-pilih kamera belakang** di HP (`facingMode: "environment"`)
- **Flip camera** (front/back) jika perangkat punya >1 kamera
- **Zoom** slider (jika browser mendukung zoom constraint — biasanya Chrome Android)
- **Flash animasi** putih saat capture
- **Preview** sebelum konfirmasi → bisa ulangi atau gunakan
- **Auto-close** jika slot foto sudah penuh (`remaining === 1`)

#### Props:
```tsx
type Props = {
  open: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string) => void; // base64 JPEG terkompresi
  remaining?: number; // slot tersisa (opsional)
};
```

---

## Update Komponen `MultiPhotoUpload.tsx`

Ditambahkan:

1. **Tombol "Kamera"** di header (samping tombol "Tambah foto")
2. **Area kosong** (saat belum ada foto) → 2 box:
   - "Foto langsung" (kamera live) — primary CTA
   - "Pilih dari galeri" (file picker lama)
3. **Slot tambah foto kecil** di grid thumbnail (jika sudah ada foto tapi belum penuh)
4. State: `const [cameraOpen, setCameraOpen] = useState(false)`
5. Handler: `onCameraCapture` → push dataUrl ke array `photos`

Perubahan zero-breaking: ketiga form (`HelpdeskToTechnicianWizard`, `TechnicianToWarehouseForm`, `WarehouseToHelpdeskForm`, `EditHandoverDialog`) **tidak perlu diubah** karena `MultiPhotoUpload` adalah controlled component — state tetap dikelola di parent via `photos` array.

---

## Integrasi di Form

### 1. Serah Terima Helpdesk → Teknisi (Step ke-4: TTD & Simpan)

**File:** `HelpdeskToTechnicianWizard.tsx`

```tsx
<MultiPhotoUpload photos={photos} onChange={setPhotos} required />
```

- User bisa pilih "Kamera" atau "Tambah foto" (galeri)
- Mendukung mode multi-radio: shared photos atau per-SN

### 2. Serah Terima Teknisi → Warehouse (Form Edit)

**File:** `TechnicianToWarehouseForm.tsx` & `EditHandoverDialog.tsx`

```tsx
<MultiPhotoUpload photos={photos} onChange={setPhotos} required label="Foto Radio" />
```

- Saat edit: foto lama bisa ditambah/hapus, tombol kamera tetap muncul

### 3. Dashboard Perbaikan → Serah Terima Warehouse → Helpdesk

**File:** `WarehouseToHelpdeskForm.tsx`

```tsx
<MultiPhotoUpload photos={photos} onChange={setPhotos} required label="Foto Radio" />
```

- Sama seperti form lain — zero config change

---

## UX Flow

### Scenario A: Belum ada foto
1. User klik "Foto langsung" (atau tombol Kamera di header)
2. Browser minta izin akses kamera (hanya sekali)
3. Kamera terbuka fullscreen, auto-pilih kamera belakang
4. User tap tombol capture (lingkaran putih besar)
5. Flash animasi → preview muncul
6. User tap "Gunakan" (✓) atau "Ulangi" (✕)
7. Foto ditambahkan ke grid thumbnail
8. Kamera tetap terbuka (bisa foto lagi) → user tutup manual (✕ di header) atau auto-close jika slot penuh

### Scenario B: Sudah ada foto, ingin tambah lagi
1. User klik tombol kamera kecil di grid thumbnail (box "Foto lagi")
2. Kamera terbuka → flow sama seperti Scenario A

### Scenario C: Pilih dari galeri (flow lama tetap ada)
1. User klik "Tambah foto" atau box "Pilih dari galeri"
2. File picker native browser → pilih 1+ foto
3. Foto dikompresi → ditambahkan ke grid

---

## Technical Details

### Kompresi Foto
- Preset: `IMAGE_PRESETS.radioPhoto` (`maxWidth: 1280, maxHeight: 960, quality: 0.82`)
- Utility: `compressDataUrl()` di `src/utils/imageCompress.ts`
- Output: base64 JPEG, ukuran tipis ~100–250 KB (vs raw foto HP 2–5 MB)
- Proses sama untuk foto kamera maupun galeri → tidak ada bedanya di backend

### Browser Support
- **Desktop**: Chrome, Edge, Firefox (semua modern browser)
- **Mobile**: Safari iOS 11+, Chrome Android, Samsung Internet
- **Fallback**: Jika `getUserMedia` tidak tersedia (HTTP non-HTTPS, atau browser lama), muncul error message → user bisa pakai tombol "Tambah foto" (galeri) sebagai fallback

### Security & Privacy
- Kamera hanya aktif saat modal terbuka → `useEffect` cleanup stop semua tracks saat close
- Tidak ada streaming ke server — capture hanya lokal di browser
- Izin kamera: per-site, user bisa revoke di browser settings

### Performance
- Zoom: hanya aktif di browser yang support ImageCapture API constraint (Chrome Android)
- Canvas render: tidak membebani — hanya saat capture (bukan live preview)
- Memory: video stream di-release saat modal close → tidak leak

---

## Testing Checklist

- [ ] Buka form Serah Terima Helpdesk → Teknisi → step "TTD & Simpan"
- [ ] Klik tombol "Kamera" → izinkan akses kamera
- [ ] Pastikan kamera terbuka di fullscreen, auto-pilih kamera belakang (di HP)
- [ ] Flip camera (jika ada icon SwitchCamera) → ganti front/back
- [ ] Capture foto → preview muncul
- [ ] Tap "Ulangi" → kembali ke live view
- [ ] Capture lagi → tap "Gunakan" → foto masuk grid thumbnail
- [ ] Foto lagi (slot "Foto lagi") → ambil 2–3 foto lagi
- [ ] Pastikan foto terkompresi (cek base64 length atau Network tab jika ada upload)
- [ ] Tutup modal → pastikan stream kamera stop (lampu kamera mati di HP)
- [ ] Submit form → pastikan foto terkirim ke API (field `radioPhotos[]`)
- [ ] Ulangi test di form Teknisi → Warehouse dan Warehouse → Helpdesk

---

## Troubleshooting

**Q: Tombol kamera tidak muncul / error saat buka kamera**
A: Cek apakah app dibuka via HTTPS (bukan HTTP). Browser modern block `getUserMedia` di HTTP. Gunakan localhost atau domain HTTPS.

**Q: Kamera tidak auto-pilih belakang di HP**
A: Beberapa browser tidak support `facingMode: "environment"` constraint — ini adalah keterbatasan browser. User bisa flip manual via tombol SwitchCamera.

**Q: Zoom tidak berfungsi**
A: Zoom hanya support di Chrome Android (ImageCapture API). Browser lain tidak memiliki constraint zoom — UI slider akan muncul tapi tidak ada efek.

**Q: Foto jadi kualitas jelek**
A: Kompresi sengaja diset ke 0.82 quality (balance antara ukuran & kualitas). Jika ingin kualitas lebih tinggi, ubah `IMAGE_PRESETS.radioPhoto.quality` di `imageCompress.ts`.

**Q: Foto tidak masuk ke API (submit failed)**
A: Cek console log untuk error. Pastikan field `radioPhotos` di payload sesuai dengan ekspektasi backend (array of base64 string). Jika backend expect URL, perlu upload dulu via separate endpoint.

---

## Future Enhancements

- [ ] Grid overlay kustom (sesuai radio form — serial, type, dll.)
- [ ] Multi-capture burst mode (sekali tap → 3 foto cepat)
- [ ] OCR serial number di preview (auto-detect SN dari foto)
- [ ] Flash LED control (jika browser support Torch API — rare)
- [ ] Photo editor (crop, rotate, filter) sebelum konfirmasi

---

## Design Tokens Compliance

Komponen ini mengikuti **MKN Design System** (`DESIGN.md`):

- Primary action: `bg-[#D94F2B]` (MKN Orange) → tombol capture & "Gunakan"
- Secondary: `bg-white/10` → tombol close/flip (overlay gelap)
- Border radius: `rounded-[10px]` (standard card) & `rounded-full` (FAB/capture button)
- Text: white over black bg (high contrast)
- Transition: `transition-colors`, `transition-transform` → smooth interaction

**Tidak ada** warna `violet`, `indigo`, `purple` — semua sesuai brand colors ✅
