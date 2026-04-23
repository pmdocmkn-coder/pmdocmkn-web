# 🆘 Troubleshooting Guide

## Network Error: Tidak dapat terhubung ke server

### 📋 Kemungkinan Penyebab & Solusi

#### 1. **CORS Error (Most Common)** ⚠️

**Tanda-tanda:**
- Console menunjukkan "CORS error"
- Error: "Access to XMLHttpRequest has been blocked by CORS policy"

**Solusi:**
→ Lihat file `CORS_FIX_GUIDE.md` untuk detail lengkap

---

#### 2. **Backend Server Tidak Berjalan**

**Cek:**
```bash
# Pastikan backend sedang berjalan
curl -I https://api.mknops.web.id/api/auth/profile
# Seharusnya return 401/200 (bukan 404/503)
```

**Fix:**
- Start backend server
- Pastikan port 5116 (atau port backend Anda) sudah listening

---

#### 3. **API URL Salah**

**Cek file environment:**
```bash
# File: .env.development
VITE_API_URL=https://api.mknops.web.id  # ✅ Correct

# File: .env.production
VITE_API_URL=https://api.mknops.web.id  # ✅ Correct
```

**Fix jika salah:**
```bash
# Edit .env.development & .env.production
VITE_API_URL=https://api.mknops.web.id
```

---

#### 4. **Firewall / Proxy Memblokir**

**Gejala:**
- Koneksi timeout
- Error "Network request failed"

**Cek:**
```bash
# Test connection
curl -v https://api.mknops.web.id
# Jika timeout/refused, ada firewall issue
```

**Fix:**
- Minta IT untuk allow connection ke `api.mknops.web.id:443`
- Coba dari network berbeda (mobile hotspot)

---

## Cara Debug di Browser

### **1. Buka Developer Tools**
```
Chrome: F12 atau Ctrl+Shift+I
Firefox: F12 atau Ctrl+Shift+I
Safari: Cmd+Option+I
```

### **2. Cek Console Tab**
- Cari logs dengan `[v0]` prefix
- Lihat error message lengkapnya

### **3. Cek Network Tab**
- Klik login button
- Lihat request ke `/api/auth/login`
- Cek status: 
  - **200** = OK
  - **401/403** = Authentication issue
  - **500** = Server error
  - **CORS error** = CORS config issue

### **4. Copy Error Message**
- Console menampilkan error detail
- Share dengan backend developer

---

## API Connection Test

### Automatic Test (di Login Page)
- App otomatis test connection saat login
- Jika server tidak accessible, error message akan jelas

### Manual Test dengan Curl

```bash
# Test connection
curl -I https://api.mknops.web.id/api/auth/profile

# Test login endpoint (dengan credentials)
curl -X POST https://api.mknops.web.id/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: https://v0.dev" \
  -d '{"username":"pm","password":"password"}'

# Test dengan credentials dari DBEaver
curl -X POST https://api.mknops.web.id/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"your_username","password":"your_password"}'
```

---

## Common Error Messages & Fixes

### ❌ "Connection refused"
- Backend tidak berjalan
- **Fix:** Start backend server

### ❌ "ERR_NETWORK"
- Network issue atau CORS
- **Fix:** Cek CORS di backend, verify backend running

### ❌ "401 Unauthorized"
- Username/password salah
- **Fix:** Verify credentials benar

### ❌ "403 Forbidden"
- User tidak punya permission
- **Fix:** Check role/permission di database

### ❌ "CORS policy"
- Backend tidak allow v0.dev
- **Fix:** Update CORS config (lihat CORS_FIX_GUIDE.md)

### ❌ "timeout"
- Server response terlalu lama
- **Fix:** Optimize backend, increase timeout

---

## Environment Configuration

### Development (Local Testing)
```bash
# .env.development
VITE_API_URL=http://localhost:5116
# atau jika testing dengan server external:
VITE_API_URL=https://api.mknops.web.id
```

### Production (v0.dev)
```bash
# .env.production
VITE_API_URL=https://api.mknops.web.id
```

---

## Testing Checklist

- [ ] Backend server running
- [ ] API URL benar di .env files
- [ ] CORS enabled di backend
- [ ] Browser console clear dari errors
- [ ] Network tab menunjukkan request ke API
- [ ] Credentials valid (username/password)
- [ ] Internet connection stabil

---

## Jika Masih Error

1. **Collect Information:**
   - Screenshot dari browser console
   - Network tab request/response
   - Error message lengkap

2. **Check Configuration:**
   - Backend CORS settings
   - API URL di .env files
   - Firewall rules

3. **Share dengan Developer:**
   - Error message
   - API URL
   - Browser info (Chrome, Firefox, etc.)

---

## Useful Links

- **Backend CORS Guide:** See `CORS_FIX_GUIDE.md`
- **API Documentation:** https://api.mknops.web.id/swagger/index.html
- **Frontend Repo:** pmdocmkn-coder/pmdocmkn-web

---

Good luck! 🚀
