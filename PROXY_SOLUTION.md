# CORS Bypass Solution - API Proxy

## Problem
Backend `https://api.mknops.web.id` tidak mengirim CORS headers yang benar untuk v0.dev preview domains (`*.vusercontent.net`), sehingga login gagal dengan CORS error.

## Solution
Saya telah mengimplementasikan **API Proxy** di frontend yang forward requests langsung ke backend menggunakan `fetch` API native browser, yang automatically include CORS headers.

## Changes Made

### 1. Created: `src/services/apiProxy.ts`
File baru yang menyediakan `proxyFetch()` function untuk forward requests ke backend dengan proper CORS handling.

```typescript
export const proxyFetch = async (
  endpoint: string,
  options: RequestInit = {}
) => {
  // Forward request ke backend dengan mode: 'cors'
  const response = await fetch(url, {
    ...options,
    mode: "cors",
    credentials: "include",
  });
  // Return response data
}
```

### 2. Updated: `src/services/api.ts`
- Import `proxyFetch` dari `apiProxy.ts`
- Updated `authApi.login()` untuk gunakan `proxyFetch` daripada `axios`
- Updated `testConnection()` untuk gunakan `proxyFetch`

### 3. Behavior
- Login requests sekarang menggunakan `proxyFetch` yang handle CORS dengan benar
- Axios masih digunakan untuk API calls lainnya (dashboard, reports, etc.)
- Token & user data tetap disimpan di localStorage seperti sebelumnya

## Testing

1. Buka preview v0.dev
2. Clear cache (Ctrl+Shift+Delete)
3. Refresh halaman (Ctrl+F5)
4. Masukkan credentials:
   - Username: `pm`
   - Password: `@Password1!`
5. Klik Sign In

Login seharusnya **BERHASIL** sekarang tanpa CORS error!

## Why This Works

Browser's `fetch()` API dengan `mode: 'cors'` secara otomatis:
1. Mengirim preflight OPTIONS request
2. Menerima CORS headers dari server
3. Forward request jika CORS check pass

Axios dengan XMLHttpRequest tidak memiliki behavior yang sama untuk CORS handling di environment v0.dev.

## Backend CORS Configuration

Meskipun proxy ini solve login issue, pastikan backend tetap dikonfigurasi dengan `*.vusercontent.net` di AllowedOrigins untuk API calls lainnya:

```json
"AllowedOrigins": "..., https://*.vusercontent.net"
```

## Future API Calls

Untuk API endpoints lainnya (dashboard, reports, etc.) yang memerlukan auth token, gunakan axios yang sudah memiliki token di headers (dari request interceptor).

Hanya login endpoint yang menggunakan proxy untuk bypass CORS issue saat first-time authentication.
