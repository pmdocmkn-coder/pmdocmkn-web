# Backend CORS Debug Guide

## Problem Identified
Backend is returning HTTP 204 but **NO CORS headers** in response:
- Missing: `Access-Control-Allow-Origin`
- Missing: `Access-Control-Allow-Methods`
- Missing: `Access-Control-Allow-Headers`

This means **CORS middleware is NOT working** on backend.

---

## Checklist untuk Backend Team

### 1. Verify CORS Middleware di Program.cs

**Di `Program.cs`, CORS harus di-register SEBELUM `app.UseRouting()`:**

```csharp
// 1. Add CORS service (HARUS ADA)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAllOrigins", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:3000",
                "http://localhost:5173",
                "https://pm.mknops.web.id",
                "https://pmfrontend.vercel.app",
                "https://pmdocmkn-web.vercel.app",
                "https://*.vercel.app",
                "https://v0.dev",
                "https://*.vusercontent.net"
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

// ... other services ...

var app = builder.Build();

// 2. Add CORS middleware SEBELUM routing (CRITICAL)
app.UseCors("AllowAllOrigins");  // ← HARUS DI SINI

// 3. Routing & others
app.UseRouting();
app.MapControllers();
app.Run();
```

**PENTING:** `app.UseCors()` HARUS jadi salah satu line pertama, sebelum `UseRouting()`.

### 2. Check appsettings Configuration

Jika menggunakan `appsettings.json` untuk CORS:

```json
{
  "Cors": {
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://localhost:5173",
      "https://pm.mknops.web.id",
      "https://pmfrontend.vercel.app",
      "https://pmdocmkn-web.vercel.app",
      "https://*.vercel.app",
      "https://v0.dev",
      "https://*.vusercontent.net"
    ]
  }
}
```

### 3. Test CORS Response

Setelah fix, test dengan:
```bash
curl -v -X OPTIONS https://api.mknops.web.id/api/auth/profile \
  -H "Origin: https://vm-test.vusercontent.net" \
  -H "Access-Control-Request-Method: GET"
```

**HARUS punya header:**
```
HTTP/2 204
Access-Control-Allow-Origin: https://vm-test.vusercontent.net
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: content-type, authorization
```

### 4. Rebuild & Redeploy

```bash
dotnet clean
dotnet build
# Deploy ke https://api.mknops.web.id
```

### 5. Restart Backend Service

Pastikan service fully restart dan loaded konfigurasi baru.

---

## Checklist Items

- [ ] CORS middleware di-register di `Program.cs`
- [ ] `app.UseCors()` dipanggil SEBELUM `UseRouting()`
- [ ] AllowedOrigins mencakup: `https://*.vusercontent.net`
- [ ] `.AllowAnyMethod()` dan `.AllowAnyHeader()` dikonfigurasi
- [ ] `.AllowCredentials()` di-set
- [ ] Backend di-rebuild: `dotnet build`
- [ ] Backend di-redeploy
- [ ] Backend di-restart
- [ ] Test CORS headers dengan curl

---

## Jika Masih Tidak Work

1. **Check logs** di backend untuk error CORS related
2. **Verify network** request dengan DevTools Network tab
3. **Check firewall/proxy** yang mungkin strip CORS headers
4. **Try Allow-All temporarily:**
   ```csharp
   .SetIsOriginAllowed(origin => true)
   .AllowAnyMethod()
   .AllowAnyHeader()
   .AllowCredentials()
   ```

---

**SETELAH SEMUA FIX SELESAI - Test login di v0.dev lagi, pasti sukses!**
