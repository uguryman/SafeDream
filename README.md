# Safe Dream - Crypto Wallet Dashboard

Modern, güvenli kripto cüzdan yönetim paneli. React + Redux Toolkit + PHP Backend ile geliştirilmiştir.

## 🚀 Özellikler

- ✅ Güvenli JWT authentication (Access + Refresh token)
- ✅ Binance Global API entegrasyonu
- ✅ Gerçek zamanlı bakiye görüntüleme
- ✅ Canlı coin fiyatları (otomatik polling)
- ✅ Responsive tasarım (Tailwind CSS)
- ✅ RTK Query ile otomatik cache yönetimi
- ✅ HTTP-Only cookies (XSS koruması)

## 📦 Teknolojiler

### Frontend
- React 19
- Redux Toolkit + RTK Query
- React Router v7
- Tailwind CSS v4
- Recharts (grafik)
- Vite (build tool)

### Backend
- PHP 8.x
- JWT Authentication (firebase/php-jwt)
- MySQL Database
- Binance Global API

## 🛠️ Kurulum

### 1. Gereksinimler

- Node.js 18+
- PHP 8.0+
- MySQL 5.7+
- Composer

### 2. Frontend Kurulumu

```bash
# Bağımlılıkları yükle
npm install

# Development server başlat
npm run dev

# Production build
npm run build
```

### 3. Backend Kurulumu

```bash
# API klasörüne git
cd public/api

# Composer bağımlılıklarını yükle
composer install

# .env dosyası oluştur
cp .env.example .env

# .env dosyasını düzenle (veritabanı, JWT, Binance API bilgileri)
nano .env
```

### 4. .env Dosyası Yapılandırması

`public/api/.env` dosyasını oluşturun ve düzenleyin:

```env
# Veritabanı
DB_HOST=your_database_host
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASS=your_database_password
DB_CHARSET=utf8

# JWT
JWT_SECRET=your_very_secure_random_jwt_secret_key
JWT_ISSUER=safe_dream

# Binance Global API
BINANCE_TR_API_KEY=your_binance_api_key
BINANCE_TR_SECRET_KEY=your_binance_secret_key
```

## 🔐 Güvenlik

### Access Token (Memory Only)
- 15 dakika geçerlilik
- Sadece Redux state'de tutulur
- Sayfa yenilendiğinde kaybolur

### Refresh Token (HTTP-Only Cookie)
- 30 gün geçerlilik
- HTTP-Only cookie'de saklanır
- JavaScript erişemez (XSS koruması)

### API Key Güvenliği
- Binance API key'leri **ASLA** frontend'e gönderilmez
- Sadece backend .env dosyasında tutulur
- .gitignore ile versiyon kontrolüne dahil edilmez

## 🌐 API Endpoints

### Auth
- `POST /safe/login.php` - Kullanıcı girişi
- `POST /safe/logout.php` - Çıkış
- `POST /safe/refresh-token.php` - Token yenileme
- `GET /safe/profile.php` - Kullanıcı profili

### Binance
- `GET /safe/binance/balance.php` - Cüzdan bakiyesi (admin only)
- `GET /safe/binance/ticker.php` - Coin fiyatları

## 📂 Proje Yapısı

```
myproje/
├── public/
│   └── api/                    # PHP Backend
│       ├── core/               # Core fonksiyonlar
│       │   ├── config.php
│       │   ├── functions.php
│       │   ├── jwt.php
│       │   ├── response.php
│       │   └── binance.php
│       ├── binance/            # Binance endpoints
│       │   └── balance.php
│       ├── vendor/             # Composer dependencies
│       ├── .env                # Environment variables (GİZLİ!)
│       └── .env.example        # .env şablonu
│
├── src/
│   ├── components/             # React komponentleri
│   ├── pages/                  # Sayfalar
│   │   ├── Login.jsx
│   │   ├── Home.jsx
│   │   └── sayfam/
│   │       ├── MyPage.jsx
│   │       ├── WalletCard.jsx
│   │       └── ...
│   ├── store/                  # Redux store
│   │   ├── store.js
│   │   ├── slices/
│   │   │   └── authSlice.js
│   │   ├── api/
│   │   │   ├── apiSlice.js
│   │   │   ├── authApi.js
│   │   │   ├── binanceApi.js
│   │   │   └── binanceDirectApi.js
│   │   └── middleware/
│   │       └── errorMiddleware.js
│   ├── App.jsx
│   └── main.jsx
│
├── vite.config.js              # Vite yapılandırması
├── tailwind.config.js          # Tailwind yapılandırması
├── .gitignore
└── package.json
```

## 🔧 Development

```bash
# Frontend dev server (http://localhost:5173)
npm run dev

# Backend (PHP sunucusu gerekli - WAMP/XAMPP/etc)
# API: https://appmobile.golaks.com/safe/
```

### Vite Proxy Yapılandırması

Development'ta Vite proxy kullanılır:

```javascript
// vite.config.js
proxy: {
  '/safe': {
    target: 'https://appmobile.golaks.com',
    changeOrigin: true,
  }
}
```

## 🚀 Production Deployment

```bash
# Frontend build
npm run build

# dist/ klasörünü sunucuya yükle
# public/api/ klasörünü sunucuya yükle
# composer install çalıştır (sunucuda)
# .env dosyasını yapılandır
```

## 📝 Önemli Notlar

⚠️ **GİZLİ BİLGİLER**
- `.env` dosyasını **ASLA** git'e commit etmeyin
- API key'leri paylaşmayın
- JWT secret güçlü ve random olmalı

⚠️ **Admin Yetkisi**
- Bakiye görüntüleme sadece `kullanicitipi = 100` (admin) için çalışır
- Diğer kullanıcılar 403 Forbidden alır

⚠️ **Binance API**
- Rate limit: Dakikada max 1200 istek
- IP whitelist ekleyin (güvenlik için)
- API key izinleri: Sadece "Read" yeterli

## 🐛 Sorun Giderme

### Login 500 Hatası
- `composer install` çalıştırın
- `.env` dosyasının mevcut olduğundan emin olun
- Veritabanı bağlantısını kontrol edin

### Timestamp Hatası (-1021)
- Sunucu saati senkronizasyonu otomatik yapılır
- `recvWindow` 60 saniyeye çıkarıldı

### CORS Hatası
- Backend CORS header'ları doğru mu kontrol edin
- `Access-Control-Allow-Origin` izinli mi?

## 📄 License

Private Project - All Rights Reserved

## 👨‍💻 Developer

Built with ❤️ by Your Team
