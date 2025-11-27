# Sunucu Kontrol Listesi - Login 500 Hatası Çözümü

## 1. Composer Bağımlılıkları Kontrolü

Sunucuda `public/api` klasöründe şu komutu çalıştırın:

```bash
cd public/api
composer install
```

Eğer composer.json yoksa, oluşturun:

```bash
composer require firebase/php-jwt
```

**Kontrol:** `public/api/vendor/autoload.php` dosyası oluşmuş olmalı.

---

## 2. .env Dosyası Kontrolü

`public/api/.env` dosyasının olduğundan emin olun:

```bash
ls -la public/api/.env
```

Dosya içeriği:
```env
DB_HOST=141.98.204.162
DB_NAME=livecarwash_com_PlrsGr
DB_USER=livecarwashuygulama
DB_PASS=KOmF49bzDSHKUD3
DB_CHARSET=utf8

JWT_SECRET=LcW_2025_s3cR3t_K3y_V3rY_S3cuR3_R4nd0m_Str1ng_F0r_JWT
JWT_ISSUER=livecarwash

BINANCE_TR_API_KEY=LYfNKRgwihFLsfe0IJL92sQNf2TxaICTMKIHSXDB8sDWYPBs2NZDlMnYEE5rzfLn
BINANCE_TR_SECRET_KEY=WmQ9RAbnVcp0DuC19md7VImbtnhTvgTHJsOrzAiXNyJO6dfkBE7dLYykkERFdyfg
```

---

## 3. PHP Hata Loglarını Aktifleştirin

`public/api/login.php` dosyasının en başına şunu ekleyin (geçici olarak):

```php
<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php_error.log');
```

Sonra login yapmayı deneyin ve şu dosyayı kontrol edin:
```bash
cat public/api/php_error.log
```

---

## 4. Veritabanı Bağlantısını Test Edin

`public/api/test-db.php` dosyası oluşturun:

```php
<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    require_once __DIR__ . '/core/config.php';
    $pdo = getDbConnection();
    echo "✅ Veritabanı bağlantısı başarılı\n";

    $users = dbSelect('kullanici', ['aktif' => 1], 'id, kullaniciadi', '', 5);
    echo "✅ Toplam aktif kullanıcı: " . count($users) . "\n";

} catch (Exception $e) {
    echo "❌ Hata: " . $e->getMessage() . "\n";
}
```

Çalıştırın:
```bash
php public/api/test-db.php
```

---

## 5. JWT Kütüphanesi Kontrolü

`public/api/test-jwt.php` dosyası oluşturun:

```php
<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

if (!file_exists(__DIR__ . '/vendor/autoload.php')) {
    die("❌ vendor/autoload.php bulunamadı! 'composer install' çalıştırın.\n");
}

require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/core/config.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

try {
    $payload = ['test' => 'data'];
    $token = JWT::encode($payload, $_ENV['JWT_SECRET'], 'HS256');
    echo "✅ JWT Token oluşturuldu: $token\n";

    $decoded = JWT::decode($token, new Key($_ENV['JWT_SECRET'], 'HS256'));
    echo "✅ JWT Token doğrulandı\n";

} catch (Exception $e) {
    echo "❌ JWT Hatası: " . $e->getMessage() . "\n";
}
```

Çalıştırın:
```bash
php public/api/test-jwt.php
```

---

## 6. Apache/Nginx Hata Loglarını Kontrol Edin

**Apache:**
```bash
tail -f /var/log/apache2/error.log
```

**Nginx:**
```bash
tail -f /var/log/nginx/error.log
```

Login yapmayı deneyin ve log'larda ne göründüğüne bakın.

---

## 7. CORS Ayarları Kontrolü

Eğer sunucu farklı bir domain'de ise, CORS ayarlarını kontrol edin.

`public/api/.htaccess` dosyası oluşturun:

```apache
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "https://livecarwash.com"
    Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization"
    Header set Access-Control-Allow-Credentials "true"
</IfModule>

# Handle preflight requests
RewriteEngine On
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]
```

---

## 8. Dosya İzinleri Kontrolü

```bash
# API klasörüne yazma izni
chmod -R 755 public/api
chmod -R 777 public/api/vendor  # Sadece gerekirse

# .env dosyası okunabilir olmalı
chmod 644 public/api/.env
```

---

## 9. PHP Versiyonu Kontrolü

```bash
php -v
```

Minimum PHP 7.4 gerekli, tercihen PHP 8.x

---

## 10. Basit Test Endpoint'i Oluşturun

`public/api/ping.php`:

```php
<?php
header('Content-Type: application/json');
echo json_encode(['success' => true, 'message' => 'API çalışıyor']);
```

Test edin:
```bash
curl https://livecarwash.com/api/ping.php
```

---

## Hataları Görmek İçin Frontend'de:

1. Tarayıcınızı açın
2. Developer Tools > Network sekmesini açın
3. Login yapmayı deneyin
4. `login.php` isteğine tıklayın
5. **Response** sekmesinde hata mesajını görün
6. **Console** sekmesinde detaylı hata loglarını görün

---

## Muhtemel Hatalar ve Çözümleri:

### ❌ "vendor/autoload.php not found"
**Çözüm:** `composer install` çalıştırın

### ❌ "Class 'Firebase\JWT\JWT' not found"
**Çözüm:** `composer require firebase/php-jwt`

### ❌ "Connection refused" / "SQLSTATE[HY000] [2002]"
**Çözüm:** Veritabanı bağlantı bilgilerini kontrol edin (.env dosyası)

### ❌ "JWT_SECRET undefined"
**Çözüm:** .env dosyasının doğru yüklendiğinden emin olun

### ❌ "CORS policy blocked"
**Çözüm:** .htaccess veya login.php'deki CORS header'larını kontrol edin

---

## İlk Yapmanız Gereken:

1. ✅ `composer install` çalıştırın (sunucuda)
2. ✅ `public/api/test-jwt.php` test dosyasını oluşturup çalıştırın
3. ✅ Tarayıcı Network sekmesinden hatayı görün
4. ✅ Bana hatayı bildirin, birlikte çözelim

---

**NOT:** Dosyaları sunucuya yükledikten sonra mutlaka `composer install` çalıştırmanız gerekiyor!
