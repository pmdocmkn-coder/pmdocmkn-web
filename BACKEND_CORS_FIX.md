# 🔧 Backend CORS Fix untuk v0.dev

## Masalah
Login di v0.dev gagal dengan **Network Error** karena backend belum mengizinkan requests dari `v0.dev`.

## Solusi

### Update `Program.cs` di backend Anda

Cari bagian CORS configuration dan update seperti ini:

**SEBELUM (Current):**
```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
            "https://pm.mknops.web.id",
            "https://pmfrontend.vercel.app",
            "http://localhost:3000",
            "http://localhost:5173",
            "https://pmfrontend-git-*.vercel.app",
            "https://pmdocmkn-web.vercel.app",
            "https://*.vercel.app"
        )
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
    });
});
```

**SESUDAH (Fixed):**
```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
            "https://pm.mknops.web.id",
            "https://pmfrontend.vercel.app",
            "http://localhost:3000",
            "http://localhost:5173",
            "https://pmfrontend-git-*.vercel.app",
            "https://pmdocmkn-web.vercel.app",
            "https://*.vercel.app",
            "https://v0.dev"  // ← TAMBAH INI
        )
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
    });
});
```

### Atau (Alternatif Lebih Fleksibel):
Jika Anda ingin allow semua Vercel domains dan v0.dev sekaligus:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        var allowedOrigins = new[]
        {
            "https://pm.mknops.web.id",
            "https://pmfrontend.vercel.app",
            "https://pmdocmkn-web.vercel.app",
            "https://v0.dev",
            "http://localhost:3000",
            "http://localhost:5173"
        };

        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});
```

## Langkah-Langkah

1. **Open backend project Anda** di Visual Studio / Visual Studio Code
2. **Cari file `Program.cs`**
3. **Cari bagian CORS configuration** (sekitar line 148)
4. **Copy-paste solusi yang sudah saya sediakan di atas**
5. **Save dan compile**
6. **Restart backend server**
7. **Test login di v0.dev lagi**

## Verifikasi

Setelah update, test CORS dengan:

```bash
curl -H "Origin: https://v0.dev" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS https://api.mknops.web.id/api/auth/login -v
```

Response harus include:
```
Access-Control-Allow-Origin: https://v0.dev
Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE, PATCH
Access-Control-Allow-Credentials: true
```

## Catatan
- Backend sudah dikonfigurasi dengan baik untuk development & production
- JWT Settings, Database Connection, Cloudinary sudah jalan
- Hanya perlu add `https://v0.dev` ke CORS whitelist

✅ Setelah fix ini, login di v0.dev akan berfungsi normal!
