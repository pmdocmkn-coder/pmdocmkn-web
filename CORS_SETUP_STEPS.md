# CORS Setup untuk v0.dev - Step by Step

## MASALAH
Frontend di v0.dev tidak bisa login ke backend karena CORS error:
```
Access to XMLHttpRequest at 'https://api.mknops.web.id/api/auth/profile' 
from origin 'https://vm-*.vusercontent.net' 
has been blocked by CORS policy
```

## PENYEBAB
Backend belum di-whitelist untuk domain v0.dev preview (`*.vusercontent.net`)

---

## SOLUSI: Update Backend CORS

### Step 1: Update appsettings.Development.json

**Ganti:**
```json
"AllowedOrigins": "https://pmfrontend.vercel.app, https://pmdocmkn-web.vercel.app, https://pm.mknops.web.id/"
```

**Dengan:**
```json
"AllowedOrigins": "http://localhost:3000,http://localhost:5173,https://pm.mknops.web.id,https://pmfrontend.vercel.app,https://pmdocmkn-web.vercel.app,https://*.vercel.app,https://v0.dev,https://*.vusercontent.net"
```

### Step 2: Update appsettings.Production.json

**Ganti yang lama dengan:**
```json
"AllowedOrigins": "https://pm.mknops.web.id,https://pmfrontend.vercel.app,https://pmdocmkn-web.vercel.app,https://*.vercel.app,https://v0.dev,https://*.vusercontent.net"
```

### Step 3: Verify Program.cs CORS Configuration

Pastikan `Program.cs` sudah ada code seperti ini:

```csharp
var allowedOrigins = configuration.GetValue<string>("AllowedOrigins")?.Split(',') ?? Array.Empty<string>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSpecificOrigins", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

app.UseCors("AllowSpecificOrigins");
```

### Step 4: Compile & Restart Backend

```bash
cd backend-folder
dotnet build
dotnet run
```

Pastikan konsol menunjukkan aplikasi berjalan tanpa error.

### Step 5: Test di v0.dev

1. Refresh halaman v0.dev preview
2. Clear browser cache (Ctrl+Shift+Delete)
3. Coba login lagi

**Expected Result:** Login berhasil, tidak ada CORS error!

---

## Debugging Checklist

Jika masih error, check:

- [ ] AllowedOrigins di appsettings sudah include `https://*.vusercontent.net`?
- [ ] Backend sudah di-restart (bukan cuma rebuild)?
- [ ] Program.cs menggunakan `AllowCredentials()` jika perlu cookie/auth?
- [ ] Network tab di DevTools - lihat response header `Access-Control-Allow-Origin`?

---

## File yang Sudah Dibuat

- `appsettings.Development.json.FIXED` - Copy-paste ke backend
- `appsettings.Production.json.FIXED` - Copy-paste ke backend

Gunakan file ini sebagai template yang benar!
