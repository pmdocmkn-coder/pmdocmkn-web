# 🔧 CORS Configuration Guide untuk v0.dev

## ❌ Error yang Dihadapi
```
Network Error: Tidak dapat terhubung ke https://api.mknops.web.id
```

Ini adalah **CORS Error** - browser memblokir request dari v0.dev ke backend Anda.

---

## ✅ Solusi: Configure CORS di Backend

### **Jika Backend Anda Menggunakan Node.js/Express:**

```javascript
const express = require('express');
const cors = require('cors');
const app = express();

// ✅ Configure CORS
app.use(cors({
  origin: [
    'http://localhost:3000',      // Local development
    'http://localhost:5173',      // Vite dev server
    'http://localhost:5174',      // Alternative Vite port
    'https://v0.dev',             // v0.dev domain
    'https://*.v0.dev',           // All v0.dev subdomains
  ],
  credentials: true,              // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Middleware untuk handle preflight requests
app.options('*', cors());

// Routes
app.post('/api/auth/login', (req, res) => {
  // Login logic
});

app.listen(5116, () => {
  console.log('✅ Server running dengan CORS enabled untuk v0.dev');
});
```

---

### **Jika Backend Anda Menggunakan .NET/C#:**

```csharp
// Program.cs atau Startup.cs
public void ConfigureServices(IServiceCollection services)
{
    services.AddCors(options =>
    {
        options.AddPolicy("AllowV0Dev", builder =>
        {
            builder.WithOrigins(
                "http://localhost:3000",
                "http://localhost:5173",
                "https://v0.dev",
                "https://*.v0.dev"
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
        });
    });

    services.AddControllers();
}

public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
{
    app.UseCors("AllowV0Dev");  // ✅ Add this line

    app.UseRouting();
    app.UseEndpoints(endpoints => endpoints.MapControllers());
}
```

---

### **Jika Backend Anda Menggunakan Python/Flask:**

```python
from flask import Flask
from flask_cors import CORS

app = Flask(__name__)

# ✅ Configure CORS
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "http://localhost:3000",
            "http://localhost:5173",
            "https://v0.dev",
            "https://*.v0.dev"
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

@app.route('/api/auth/login', methods=['POST'])
def login():
    # Login logic
    pass

if __name__ == '__main__':
    app.run(port=5116, debug=True)
```

---

### **Jika Backend Anda Menggunakan Python/FastAPI:**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# ✅ Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://v0.dev",
        "https://*.v0.dev"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/auth/login")
async def login(credentials: LoginRequest):
    # Login logic
    pass
```

---

### **Jika Backend Anda Menggunakan Java/Spring:**

```java
// WebConfig.java
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins(
                "http://localhost:3000",
                "http://localhost:5173",
                "https://v0.dev",
                "https://*.v0.dev"
            )
            .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
            .allowedHeaders("*")
            .allowCredentials(true)
            .maxAge(3600);
    }
}
```

---

### **Jika Backend Anda Menggunakan PHP/Laravel:**

```php
// config/cors.php atau middleware
<?php

namespace App\Http\Middleware;

use Closure;

class HandleCors
{
    public function handle($request, Closure $next)
    {
        $allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:5173',
            'https://v0.dev',
        ];

        if (in_array($request->header('Origin'), $allowedOrigins)) {
            return $next($request)
                ->header('Access-Control-Allow-Origin', $request->header('Origin'))
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
                ->header('Access-Control-Allow-Credentials', 'true');
        }

        return $next($request);
    }
}
```

---

## 🔍 Cara Test CORS Configuration

Setelah configure CORS di backend, test dengan curl:

```bash
# Test preflight request
curl -X OPTIONS https://api.mknops.web.id/api/auth/login \
  -H "Origin: https://v0.dev" \
  -H "Access-Control-Request-Method: POST" \
  -v

# Seharusnya response header berisi:
# Access-Control-Allow-Origin: https://v0.dev
# Access-Control-Allow-Methods: POST, GET, OPTIONS
```

---

## 📋 Checklist

- [ ] Backend sudah enable CORS
- [ ] Frontend URL (https://v0.dev) sudah di-add ke `allowedOrigins`
- [ ] `credentials: true` sudah di-set di backend
- [ ] Restart backend server
- [ ] Clear browser cache
- [ ] Test login di v0.dev

---

## 📞 Jika Masih Ada Error

1. **Buka Browser DevTools** (F12 → Network → Console)
2. **Coba login lagi** dan lihat error detail di console
3. **Cari error CORS** di console - message akan lebih spesifik
4. **Share error message** dengan backend developer

---

## 🎯 Quick Summary

**Backend harus return:**
```
Access-Control-Allow-Origin: https://v0.dev
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

Setelah itu, login akan bekerja di v0.dev! 🚀
