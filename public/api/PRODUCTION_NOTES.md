# Production Deployment Notes

## ✅ Yapılan Güvenlik Güncellemeleri

### 1. **CORS Güvenliği**
- `Access-Control-Allow-Origin: *` kaldırıldı
- Sadece izin verilen domain'ler için CORS aktif
- Whitelist: `livecarwash.com`, `www.livecarwash.com`, `localhost:3000`

**Dosyalar:**
- [login.php](login.php#L14-L29)
- [core/middleware.php](core/middleware.php#L67-L90) (`setCorsHeaders()` fonksiyonu)

---

### 2. **Şifre Kontrolü (Hybrid)**
Hem hash'lenmiş hem düz metin şifreleri destekler:

```php
// Bcrypt hash ($2y$ ile başlıyorsa) → password_verify()
// Düz metin (eski sistem) → direkt karşılaştırma
```

Bu sayede:
- Eski sistemdeki düz metin şifreler çalışır
- Yeni sistemde hash'lenmiş şifreler çalışır
- Geriye dönük uyumluluk var

**Dosya:** [login.php](login.php#L78-L92)

---

### 3. **API Güvenlik (.htaccess)**

Korunan dosyalar ve klasörler:
- ✅ `.env` dosyasına erişim engellendi
- ✅ `core/` klasörüne doğrudan erişim engellendi
- ✅ `.txt`, `.log`, `.md`, `.ini`, `.sql` dosyalarına erişim engellendi
- ✅ Directory listing kapatıldı
- ✅ Security header'lar eklendi

**Dosya:** [.htaccess](.htaccess)

---

## 🔒 Güvenlik Kontrol Listesi

### Sunucuya Deploy Öncesi:

- [x] CORS ayarları güncellendi
- [x] Şifre kontrolü hybrid yapıldı
- [x] .htaccess oluşturuldu
- [x] JWT_SECRET güvenli (değiştirin!)
- [ ] HTTPS kontrolü (zorunlu!)
- [ ] Rate limiting aktif mi?
- [ ] Error logging aktif mi?

---

## 🚀 Test Adımları

### 1. **Login Testi**
```bash
curl -X POST https://livecarwash.com/api/login.php \
  -H "Content-Type: application/json" \
  -d '{
    "kullaniciadi": "admin@test.com",
    "sifre": "password123"
  }'
```

**Beklenen Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
  }
}
```

### 2. **Token ile Profile Testi**
```bash
curl -X GET https://livecarwash.com/api/profile.php \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc..."
```

### 3. **Güvenlik Testleri**

**Test 1: .env Erişimi (Engellenmiş Olmalı)**
```bash
curl https://livecarwash.com/api/.env
# Beklenen: 403 Forbidden
```

**Test 2: core/ Erişimi (Engellenmiş Olmalı)**
```bash
curl https://livecarwash.com/api/core/config.php
# Beklenen: 403 Forbidden
```

**Test 3: Hatalı Token**
```bash
curl -X GET https://livecarwash.com/api/profile.php \
  -H "Authorization: Bearer invalid_token"
# Beklenen: {"success": false, "message": "Geçersiz veya süresi dolmuş token."}
```

---

## ⚠️ Önemli Notlar

### 1. **JWT Secret**
`.env` dosyasındaki `JWT_SECRET`'i mutlaka değiştirin:
```env
JWT_SECRET=YOUR_VERY_SECURE_RANDOM_STRING_HERE_CHANGE_THIS
```

Güvenli random string oluşturmak için:
```bash
openssl rand -base64 64
```

### 2. **Veritabanı Bağlantısı**
İki farklı .env dosyası var:
- **Root:** `/livecarwash.com/.env` (Mevcut sistem)
- **API:** `/livecarwash.com/api/.env` (Yeni API)

Her ikisi de aynı veritabanını kullanıyor, çakışma yok.

### 3. **CORS Origin Ekleme**
Yeni bir domain eklemek için:

**login.php:**
```php
$allowedOrigins = [
    'https://livecarwash.com',
    'https://www.livecarwash.com',
    'https://yeni-domain.com',  // YENİ EKLE
    'http://localhost:3000',
];
```

**core/middleware.php:**
```php
$allowedOrigins = [
    'https://livecarwash.com',
    'https://www.livecarwash.com',
    'https://yeni-domain.com',  // YENİ EKLE
    'http://localhost:3000',
];
```

### 4. **Rate Limiting**
Şu an basit file-based rate limiting var. Production'da Redis kullanılması önerilir.

---

## 📊 Performans İyileştirmeleri

### 1. **Opcache (Önerilir)**
```ini
; php.ini
opcache.enable=1
opcache.memory_consumption=128
opcache.max_accelerated_files=10000
```

### 2. **JWT Token Cache**
Token doğrulama işlemini cache'lemek için Redis kullanılabilir.

---

## 🔧 Sorun Giderme

### Problem: CORS hatası alıyorum
**Çözüm:** Origin'i whitelist'e ekleyin veya tarayıcı console'da origin'i kontrol edin.

### Problem: Token geçersiz hatası
**Çözüm:**
1. Token expire olmuş olabilir (24 saat)
2. JWT_SECRET değiştirilmiş olabilir
3. Yeni login yapın

### Problem: 403 Forbidden hatası
**Çözüm:**
1. `.htaccess` doğru yüklenmiş mi?
2. Apache'de `mod_rewrite` aktif mi?
3. Dosya izinleri doğru mu?

### Problem: Şifre hatalı diyor ama doğru
**Çözüm:**
1. Veritabanında şifre düz metin mi hash'li mi kontrol edin
2. `kullanicitipi = 100` mi kontrol edin
3. `aktif = 1` mi kontrol edin

---

## 📞 Destek

Herhangi bir sorun için:
1. Error log'ları kontrol edin: `/var/log/php_errors.log`
2. Apache error log: `/var/log/apache2/error.log`
3. API response'larını kontrol edin

---

## 🎉 Deployment Checklist

Sunucuya deploy etmeden önce:

- [ ] **Tüm API klasörünü yükle** (vendor dahil)
- [ ] `.env` dosyası kontrol edildi
- [ ] `JWT_SECRET` değiştirildi
- [ ] ⚠️ **Composer install GEREKLI DEĞİL** (vendor zaten dahil)
- [ ] `.htaccess` kontrol edildi
- [ ] CORS origin'leri kontrol edildi
- [ ] Test kullanıcısı ile login test edildi
- [ ] Token ile korumalı endpoint test edildi
- [ ] Güvenlik testleri yapıldı
- [ ] Error logging aktif
- [ ] HTTPS zorunlu yapıldı (production)

---

**Son Güncelleme:** 2025-01-25
**Versiyon:** 1.0.0
