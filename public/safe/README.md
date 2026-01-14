# LiveCarWash API Documentation

## Genel Bakış

Bu API, JWT (JSON Web Token) ve Bearer Token kullanan güvenli bir authentication sistemi içerir.

⚠️ **Production'a deploy etmeden önce [PRODUCTION_NOTES.md](PRODUCTION_NOTES.md) dosyasını mutlaka okuyun!**

## Dosya Yapısı

```
public/api/
├── .env                      # Ayarlar (DB, JWT secret)
├── core/                     # Ortak sistem dosyaları
│   ├── config.php           # .env yükleme ve DB bağlantısı
│   ├── response.php         # Ortak success/error fonksiyonları
│   ├── functions.php        # DB işlemleri (insert/update/select/delete)
│   ├── jwt.php              # JWT token oluşturma/doğrulama
│   └── middleware.php       # Token kontrolü ve yetkilendirme
├── login.php                # Login endpoint
└── profile.php              # Örnek korumalı endpoint
```

## Kurulum

1. Composer bağımlılıklarını yükleyin:
```bash
composer install
```

2. `.env` dosyasındaki ayarları kontrol edin
3. Veritabanı bağlantısını test edin

## Endpoints

### 1. Login (Giriş)

Kullanıcı girişi yapar ve JWT token döndürür.

**Endpoint:** `POST /api/login.php`

**Request Body:**
```json
{
  "kullaniciadi": "admin@example.com",
  "sifre": "password123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Kullanıcı adı veya şifre hatalı"
}
```

**Error Response (403):**
```json
{
  "success": false,
  "message": "Bu kullanıcı türü giriş yapamaz. Sadece admin kullanıcıları giriş yapabilir."
}
```

---

### 2. Profile (Profil - Korumalı)

Kullanıcı profil bilgilerini döndürür. **Token gerektirir.**

**Endpoint:** `GET /api/profile.php`

**Headers:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profil bilgileri getirildi",
  "data": {
    "kullanici": {
      "id": 1,
      "firmaid": 1,
      "subeid": 1,
      "adsoyad": "Admin User",
      "kullaniciadi": "admin@example.com",
      "kullanicitipi": 100,
      "kayitipadresi": "192.168.1.1",
      "resim": "",
      "telefon": "5551234567",
      "songiris": "2025-01-15 10:30:00",
      "aktif": 1
    },
    "jwt_data": {
      "kullaniciadi": "admin@example.com",
      "firmaid": 1,
      "subeid": 1,
      "kullanicitipi": 100
    }
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Token bulunamadı. Authorization header gerekli."
}
```

---

## JWT Token Yapısı

Token içeriği (payload):
```json
{
  "kullaniciadi": "admin@example.com",
  "firmaid": 1,
  "subeid": 1,
  "kullaniciid": 1,
  "kullanicitipi": 100,
  "iat": 1705315200,
  "exp": 1705401600,
  "iss": "livecarwash"
}
```

- **iat:** Token oluşturulma zamanı (timestamp)
- **exp:** Token geçerlilik süresi (timestamp) - 24 saat
- **iss:** Token yayınlayıcı

---

## Kullanıcı Tipleri

- `100` - ADMIN (Tüm yetkiler)
- `90` - YÖNETİCİ
- `80` - TERMİNAL KULLANICISI

**Not:** Login endpoint'i sadece `kullanicitipi = 100` (ADMIN) kullanıcılarına izin verir.

---

## Örnek Kullanımlar

### cURL ile Login
```bash
curl -X POST http://localhost/myproje/public/api/login.php \
  -H "Content-Type: application/json" \
  -d '{
    "kullaniciadi": "admin@example.com",
    "sifre": "password123"
  }'
```

### cURL ile Profile (Token ile)
```bash
curl -X GET http://localhost/myproje/public/api/profile.php \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc..."
```

### JavaScript (Fetch API)
```javascript
// Login
async function login() {
  const response = await fetch('http://localhost/myproje/public/api/login.php', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      kullaniciadi: 'admin@example.com',
      sifre: 'password123'
    })
  });

  const data = await response.json();
  if (data.success) {
    localStorage.setItem('token', data.data.token);
    console.log('Login başarılı!');
  }
}

// Profile (Token ile)
async function getProfile() {
  const token = localStorage.getItem('token');

  const response = await fetch('http://localhost/myproje/public/api/profile.php', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  console.log(data);
}
```

---

## Veritabanı Fonksiyonları (core/functions.php)

```php
require_once __DIR__ . '/core/functions.php';
```

### Insert
```php
$userId = dbInsert('kullanici', [
    'adsoyad' => 'Yeni Kullanıcı',
    'kullaniciadi' => 'user@example.com',
    'kullanicisifre' => 'pass123',
    'kullanicitipi' => 100,
    'firmaid' => 1,
    'subeid' => 1
]);
```

### Update
```php
$affected = dbUpdate('kullanici',
    ['adsoyad' => 'Güncel İsim'],
    ['id' => 1]
);
```

### Select
```php
$users = dbSelect('kullanici', ['kullanicitipi' => 100]);
```

### Select One
```php
$user = dbSelectOne('kullanici', ['id' => 1]);
```

### Delete
```php
$deleted = dbDelete('kullanici', ['id' => 5]);
```

---

## Response Fonksiyonları (core/response.php)

### Ortak Response Fonksiyonu
```php
require_once __DIR__ . '/core/response.php';

// Başarılı response
success(['token' => 'abc123...'], 200);
// Döner: {"success": true, "data": {"token": "abc123..."}}

// Hata response
error('Hata mesajı', 400);
// Döner: {"success": false, "message": "Hata mesajı"}

// Detaylı kullanım
apiResponse(true, ['user_id' => 123], '', 200);  // Başarılı
apiResponse(false, null, 'Hata oluştu', 400);    // Hata
```

**Response Yapısı:**
- **Başarılı:** `{"success": true, "data": {...}}`
- **Hata:** `{"success": false, "message": "..."}`

---

## Middleware Fonksiyonları (core/middleware.php)

### Authentication
```php
require_once __DIR__ . '/core/middleware.php';
$user = authenticate(); // Token doğrular, hata varsa otomatik response döner
```

### User Type Check
```php
requireAdmin($user); // Sadece admin kontrolü
requireManager($user); // Admin veya yönetici kontrolü
checkUserType($user, [100, 90]); // Özel tip kontrolü
```

### Input Validation
```php
$input = getJsonInput();
validateRequired($input, ['email', 'password']); // Zorunlu alan kontrolü
```

### Method Check
```php
checkMethod('POST'); // Sadece POST kabul et
checkMethod(['GET', 'POST']); // GET veya POST kabul et
```

---

## Güvenlik

### ✅ Production Güvenlik Özellikleri

1. **JWT Secret:** `.env` dosyasındaki `JWT_SECRET` değerini mutlaka değiştirin
   ```bash
   # Güvenli random string oluştur:
   openssl rand -base64 64
   ```

2. **CORS Koruması:** Sadece whitelist'teki domain'lere izin verilir
   - ✅ `livecarwash.com`
   - ✅ `www.livecarwash.com`
   - ✅ `localhost:3000` (development)

3. **Şifre Güvenliği:** Hybrid şifre kontrolü
   - Hash'lenmiş şifreler (bcrypt) → `password_verify()`
   - Düz metin şifreler (eski sistem) → Direkt karşılaştırma
   - Geriye dönük uyumluluk var

4. **.htaccess Güvenliği:**
   - ✅ `.env` dosyasına erişim engellendi
   - ✅ `core/` klasörüne doğrudan erişim engellendi
   - ✅ Hassas dosyalara (.log, .sql, .txt) erişim engellendi
   - ✅ Security header'lar eklendi

5. **Rate Limiting:** `checkRateLimit()` fonksiyonu ile istek limitlemesi

6. **HTTPS:** Production'da zorunlu (`.htaccess`'te aktif edilebilir)

### 🔒 Güvenlik Testleri
Detaylı test adımları için: [PRODUCTION_NOTES.md](PRODUCTION_NOTES.md#-test-adımları)

---

## Yeni Protected Endpoint Oluşturma

```php
<?php
require_once __DIR__ . '/core/middleware.php';
require_once __DIR__ . '/core/response.php';

setCorsHeaders();
checkMethod('POST');

try {
    // Token doğrulama
    $user = authenticate();

    // Admin kontrolü (opsiyonel)
    requireAdmin($user);

    // Input al ve validate et
    $input = getJsonInput();
    validateRequired($input, ['field1', 'field2']);

    // İşlemleri yap...
    $result = dbInsert('table', $input);

    // Response dön
    success(['id' => $result], 200);

} catch (Exception $e) {
    error('Hata: ' . $e->getMessage(), 500);
}
```

---

## Hata Kodları

- `200` - Başarılı
- `400` - Bad Request (Geçersiz istek)
- `401` - Unauthorized (Yetkisiz - Token geçersiz)
- `403` - Forbidden (Yasaklı - Yetki yok)
- `404` - Not Found (Bulunamadı)
- `405` - Method Not Allowed (Metod desteklenmiyor)
- `429` - Too Many Requests (Çok fazla istek)
- `500` - Internal Server Error (Sunucu hatası)
