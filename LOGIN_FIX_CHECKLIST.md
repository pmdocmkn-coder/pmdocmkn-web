# Checklist Login v0.dev → API Backend

## Status Saat Ini
- Backend: https://api.mknops.web.id (Deployed) ✅
- Frontend: v0.dev (Running) ✅
- API URL di .env.development: https://api.mknops.web.id ✅

---

## Checklist untuk Troubleshooting

### Backend Side (API)
- [ ] CORS sudah di-configure di appsettings.json dengan `*.vusercontent.net`
- [ ] Backend sudah di-restart/re-deployed setelah CORS update
- [ ] Swagger API berjalan di https://api.mknops.web.id/swagger/index.html

### Frontend Side (v0.dev)
- [ ] Clear browser cache (Ctrl+Shift+Delete)
- [ ] Refresh halaman v0.dev
- [ ] Dev server running (check logs)

---

## Testing Login

1. **Open DevTools (F12)**
2. **Go to Network tab**
3. **Clear network log**
4. **Input username dan password:**
   - Username: `pm`
   - Password: (sesuai password Anda)
5. **Click Sign In**
6. **Check Network tab:**
   - Cari request ke `/api/auth/login`
   - Status harus 200 OK (bukan CORS error)
   - Response harus berisi token/user data

---

## Jika Masih Error CORS

Kemungkinan backend belum di-restart dengan CORS config yang benar. 

**Solusi:**
1. Check appsettings.Development.json atau appsettings.Production.json
2. Pastikan memiliki: `"AllowedOrigins": "...,https://*.vusercontent.net,..."`
3. Compile: `dotnet build`
4. Restart: `dotnet run`

---

## Jika Masih Login Error

Kemungkinan:
1. Username/password salah - cek di backend user table
2. API endpoint `/api/auth/login` tidak exist
3. Request format tidak sesuai dengan backend expectation

**Debug:**
- Buka Swagger: https://api.mknops.web.id/swagger/index.html
- Test `/api/auth/login` endpoint langsung di Swagger
- Cek response dan error message
