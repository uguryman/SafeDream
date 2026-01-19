# ☁️ SAFEDREAM - CLOUD DEPLOYMENT GUIDE

**SafeDream Kripto Trading Platform** - Detaylı Cloud Deployment ve Proje Dokümantasyonu

---

## 📋 İÇİNDEKİLER

1. [Proje Özeti](#-proje-özeti)
2. [Teknoloji Stack](#-teknoloji-stack)
3. [Mimari Yapı](#-mimari-yapı)
4. [Cloud Deployment Seçenekleri](#-cloud-deployment-seçenekleri)
5. [AWS Deployment (Önerilen)](#-aws-deployment-önerilen)
6. [Vercel + Railway Deployment](#-vercel--railway-deployment)
7. [Docker Deployment](#-docker-deployment)
8. [Çevre Değişkenleri](#-çevre-değişkenleri)
9. [CI/CD Pipeline](#-cicd-pipeline)
10. [Güvenlik ve Monitoring](#-güvenlik-ve-monitoring)
11. [Maliyet Analizi](#-maliyet-analizi)
12. [Sorun Giderme](#-sorun-giderme)

---

## 🎯 PROJE ÖZETİ

### Genel Bilgiler

**Proje Adı:** SafeDream
**Versiyon:** 1.0.0
**Geliştirme Tarihi:** Ocak 2026
**Durum:** Production Ready (Faz 1 - Frontend Bot)

### Ne Yapar?

SafeDream, **Binance API** ile entegre, **gerçek zamanlı kripto trading bot** platformudur:

- ✅ **15 kripto para** desteği (BTC, ETH, BNB, ADA, XRP, vb.)
- ✅ **Otomatik trading bot** (Scalping stratejisi aktif)
- ✅ **Real-time WebSocket** fiyat güncellemeleri
- ✅ **Gelişmiş Risk Yönetimi:**
  - Stop-Loss (Zarar durdur)
  - Trailing Stop-Loss (Kar takibi)
  - Breakeven (Başabaş modu)
- ✅ **JWT Authentication** (Güvenli giriş)
- ✅ **Binance Testnet** desteği (Gerçek para kullanmadan test)
- ✅ **İşlem geçmişi** (JSON/CSV export)
- ✅ **Responsive Design** (Mobil uyumlu)

### Kullanıcı Senaryosu

```
1. Kullanıcı giriş yapar (JWT token alır)
2. "Test Geçmiş" sekmesine gider
3. Bot ayarlarını yapar:
   - Coin seçer (örn: ADAUSDT)
   - Strateji seçer (Scalping)
   - Risk ayarları (Stop-loss: %2, Trailing: %0.3)
4. Bot'u başlatır
5. Bot WebSocket üzerinden fiyatları izler
6. Fiyat %0.5 düşerse → Otomatik ALIR
7. Kar %0.5'e ulaşırsa → Breakeven aktif
8. Trailing stop ile kar korur
9. İşlem geçmişi kaydedilir
10. "📈 İşlemleri Grafikte Gör" → Grafik analizi
```

### 📈 Yeni Özellik: Bot İşlem Grafiği (v1.1.0)

**Tarih:** 19 Ocak 2026

Bot işlemlerini **profesyonel mum grafiği** üzerinde görselleştirme özelliği eklendi.

#### Özellikler:

- ✅ **Lightweight Charts** entegrasyonu (TradingView teknolojisi)
- ✅ 100 dakikalık 1m (1 dakika) candlestick grafiği
- ✅ Alış/Satış işaretleri (▲▼ oklar)
- ✅ Fiyat seviye çizgileri:
  - Beyaz (Alış fiyatı)
  - Kırmızı (Stop-loss)
  - Yeşil (En yüksek fiyat)
  - Mavi (Hedef kar seviyesi)
- ✅ Zoom & Drag desteği
- ✅ Responsive tasarım
- ✅ Dark theme

#### Kullanım:

```javascript
// TestBotCard içinde
<BotChartModal
  isOpen={showChartModal}
  onClose={() => setShowChartModal(false)}
  botState={botState}
  symbol={selectedCoin}
/>
```

#### Teknik Notlar:

```javascript
// Önemli: Bot logları ters sırada (en yeni önce) geldiği için
// Lightweight Charts için timestamp'e göre sıralama yapılmalı:

const sortedLogs = [...botState.logs].sort((a, b) => a.timestamp - b.timestamp)
markers.sort((a, b) => a.time - b.time)
```

#### Dosyalar:

- `src/components/BotChartModal.jsx` - Grafik modal komponenti
- `src/pages/testpage/TestBotCard.jsx` - Grafik butonu eklendi

---

## 🏗️ TEKNOLOJİ STACK

### Frontend

| Teknoloji | Versiyon | Kullanım Amacı |
|-----------|----------|----------------|
| **React** | 19.2.0 | UI Framework |
| **Vite** | 7.2.5 | Build Tool (Rolldown) |
| **Redux Toolkit** | 2.11.0 | State Management |
| **RTK Query** | - | API Caching |
| **React Router** | 7.9.6 | Routing |
| **Tailwind CSS** | 4.1.17 | Styling |
| **Lightweight Charts** | 4.2.3 | Candlestick Grafikleri |

### Backend

| Teknoloji | Versiyon | Kullanım Amacı |
|-----------|----------|----------------|
| **PHP** | 8.x | Backend API |
| **MySQL** | 8.0 | Database |
| **JWT** | firebase/php-jwt | Authentication |
| **Composer** | 2.x | PHP Package Manager |

### External APIs

- **Binance API** - Kripto işlemleri (Mainnet & Testnet)
- **Binance WebSocket** - Real-time fiyat akışı

### Development Tools

- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Git** - Version control

---

## 🎨 MİMARİ YAPI

### Klasör Yapısı

```
SafeDream/
├── src/                          # Frontend kaynak kodları
│   ├── components/               # React bileşenleri
│   │   ├── AuthGuard.jsx        # Route koruması
│   │   ├── Toast.jsx            # Bildirim sistemi
│   │   ├── CoinList.jsx         # Coin listesi
│   │   └── CryptoChart.jsx      # Grafik bileşeni
│   │
│   ├── pages/                    # Sayfa komponentleri
│   │   ├── Home.jsx             # Ana sayfa
│   │   ├── Login.jsx            # Giriş sayfası
│   │   ├── sayfam/              # Gerçek hesap
│   │   │   └── MyPage.jsx       # Cüzdan & İşlemler
│   │   └── testpage/            # Test & Bot
│   │       ├── TestPage.jsx     # Test ana sayfa
│   │       ├── TestBotCard.jsx  # Bot yönetimi
│   │       └── TestTransactionCard.jsx
│   │
│   ├── services/                 # Servis katmanı (Singleton)
│   │   ├── botManager.js        # Bot yönetimi
│   │   ├── binanceWebSocket.js  # WebSocket bağlantısı
│   │   └── tradeLogger.js       # İşlem logları
│   │
│   ├── hooks/                    # Custom React hooks
│   │   └── useBinanceWebSocket.js
│   │
│   ├── store/                    # Redux store
│   │   ├── store.js             # Store config
│   │   ├── api/                 # RTK Query APIs
│   │   │   ├── apiSlice.js      # Base config
│   │   │   ├── authApi.js       # Auth endpoints
│   │   │   ├── binanceDirectApi.js    # Direct Binance
│   │   │   └── binanceTestnetApi.js   # Testnet
│   │   ├── slices/              # Redux slices
│   │   │   └── authSlice.js     # Auth state
│   │   └── middleware/          # Custom middleware
│   │       └── errorMiddleware.js
│   │
│   ├── config/                   # Konfigürasyon
│   │   └── coins.js             # 15 coin tanımları
│   │
│   ├── App.jsx                   # Ana uygulama
│   └── main.jsx                  # Entry point
│
├── public/                       # Statik dosyalar
│   └── safe/                     # PHP Authentication API
│       ├── core/
│       │   ├── config.php       # DB & ENV config
│       │   ├── jwt.php          # JWT utilities
│       │   ├── response.php     # JSON response helper
│       │   └── binance.php      # Binance API client
│       ├── login.php            # Login endpoint
│       ├── logout.php           # Logout endpoint
│       ├── refresh-token.php    # Token refresh
│       └── profile.php          # User profile
│
├── backend/                      # Backend servisleri
│   └── binance/
│       └── klines.php           # Candlestick data proxy
│
├── dist/                         # Build output
├── node_modules/                 # NPM dependencies
├── .env                          # Environment variables (GİZLİ!)
├── package.json                  # NPM config
├── vite.config.js               # Vite config
├── tailwind.config.js           # Tailwind config
├── README.md                     # Proje dokümantasyonu
├── CLOUD.md                      # Bu dosya
└── .gitignore                    # Git ignore

```

### Bot Mimarisi (Singleton Pattern)

```javascript
// 1. BotManager (services/botManager.js)
class BotManager {
  - Singleton instance
  - Bot oluşturma & yönetimi
  - State persistence (LocalStorage)
  - Scalping/Grid/DCA stratejileri
  - Risk yönetimi (Stop-loss, Trailing, Breakeven)
}

// 2. WebSocket Service (services/binanceWebSocket.js)
class BinanceWebSocket {
  - Singleton instance
  - Publisher/Subscriber pattern
  - Auto-reconnection
  - Multi-coin support
}

// 3. Trade Logger (services/tradeLogger.js)
class TradeLogger {
  - Singleton instance
  - LocalStorage persistence
  - JSON/CSV export
  - Event tracking
}

// Data Flow:
WebSocket → BotManager → Strategy Logic → Trade Signal → API Call → Logger
```

---

## ☁️ CLOUD DEPLOYMENT SEÇENEKLERİ

### Seçenek 1: AWS (Önerilen) 🏆

**Neden AWS?**
- ✅ En güvenilir ve ölçeklenebilir
- ✅ RDS (MySQL) dahili
- ✅ Auto-scaling
- ✅ CloudWatch monitoring
- ✅ SSL sertifikası (ACM)

**Tahmini Maliyet:** $15-30/ay

---

### Seçenek 2: Vercel + Railway

**Frontend:** Vercel (Free)
**Backend + DB:** Railway ($5-10/ay)

**Avantajlar:**
- ✅ Çok kolay deployment
- ✅ Git push ile otomatik deploy
- ✅ Free SSL

---

### Seçenek 3: DigitalOcean Droplet

**VPS:** $6/ay (1GB RAM)

**Avantajlar:**
- ✅ Tam kontrol
- ✅ Düşük maliyet
- ✅ Docker desteği

---

### Seçenek 4: Heroku (Deprecated - Tavsiye Edilmez)

Heroku artık free plan sunmuyor.

---

## 🚀 AWS DEPLOYMENT (ÖNERİLEN)

### Mimari

```
Internet
   │
   ├─→ CloudFront (CDN)
   │      │
   │      └─→ S3 Bucket (Frontend - React build)
   │
   └─→ ALB (Application Load Balancer)
          │
          ├─→ EC2 Instance(s) (Backend - PHP)
          │      │
          │      └─→ RDS MySQL (Database)
          │
          └─→ Auto Scaling Group
```

### Adım 1: Frontend (S3 + CloudFront)

#### 1.1. Build Oluştur

```bash
# Local'de build al
npm run build

# dist/ klasörü oluşur
```

#### 1.2. S3 Bucket Oluştur

```bash
# AWS CLI ile (veya Console'dan)
aws s3 mb s3://safedream-frontend
aws s3 website s3://safedream-frontend --index-document index.html
```

#### 1.3. Build'i S3'e Yükle

```bash
aws s3 sync dist/ s3://safedream-frontend
```

#### 1.4. CloudFront Distribution Oluştur

- Origin: S3 bucket
- SSL Certificate: ACM'den al
- Domain: safedream.com

### Adım 2: Backend (EC2 + RDS)

#### 2.1. RDS MySQL Oluştur

```sql
-- AWS RDS Console'dan:
Engine: MySQL 8.0
Instance: db.t3.micro (Free tier)
Storage: 20GB
Multi-AZ: Hayır (maliyet için)
Public Access: Hayır
VPC: Default

-- Database bilgileri:
Endpoint: safedream-db.xxxxx.rds.amazonaws.com
Port: 3306
Username: admin
Password: (güçlü şifre)
```

#### 2.2. Database Oluştur

```sql
CREATE DATABASE safedream_prod;
USE safedream_prod;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  binance_api_key VARCHAR(255),
  binance_api_secret VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE refresh_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(500) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_token ON refresh_tokens(token);
```

#### 2.3. EC2 Instance Oluştur

```bash
# AMI: Amazon Linux 2023
# Instance Type: t2.micro (Free tier)
# Security Group:
- SSH (22) - Your IP
- HTTP (80) - 0.0.0.0/0
- HTTPS (443) - 0.0.0.0/0

# User Data (Launch script):
#!/bin/bash
yum update -y
yum install -y httpd php php-mysqlnd php-json git composer

# Apache başlat
systemctl start httpd
systemctl enable httpd

# PHP composer
cd /var/www/html
composer install

# .env dosyası oluştur (Manuel yapılacak)
```

#### 2.4. Backend Dosyalarını Yükle

```bash
# Git ile
cd /var/www/html
git clone https://github.com/yourusername/SafeDream.git
cd SafeDream

# Composer dependencies
cd public/safe
composer install

# .env oluştur
nano .env
```

#### 2.5. .env Dosyası (Production)

```env
# Database
DB_HOST=safedream-db.xxxxx.rds.amazonaws.com
DB_NAME=safedream_prod
DB_USER=admin
DB_PASS=your_strong_password

# JWT Secret (güçlü random string)
JWT_SECRET=your_super_secret_jwt_key_min_32_chars

# Binance API (Optional - User bazlı olacak)
# BINANCE_API_KEY=
# BINANCE_API_SECRET=

# Environment
APP_ENV=production
APP_DEBUG=false
```

#### 2.6. Apache VirtualHost

```apache
# /etc/httpd/conf.d/safedream.conf
<VirtualHost *:80>
    ServerName api.safedream.com
    DocumentRoot /var/www/html/SafeDream/public

    <Directory /var/www/html/SafeDream/public>
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog /var/log/httpd/safedream_error.log
    CustomLog /var/log/httpd/safedream_access.log combined
</VirtualHost>
```

```bash
# Restart Apache
systemctl restart httpd
```

### Adım 3: SSL Sertifikası (Let's Encrypt)

```bash
# Certbot kur
yum install -y certbot python3-certbot-apache

# SSL sertifikası al
certbot --apache -d api.safedream.com
```

### Adım 4: Environment Variables (Frontend)

Frontend build'de API endpoint güncelle:

```javascript
// vite.config.js veya .env
VITE_API_BASE_URL=https://api.safedream.com
```

Rebuild ve S3'e yükle:

```bash
npm run build
aws s3 sync dist/ s3://safedream-frontend --delete
```

### Adım 5: Test Et

```bash
# Backend health check
curl https://api.safedream.com/safe/profile.php

# Frontend
https://safedream.com
```

---

## 🎯 VERCEL + RAILWAY DEPLOYMENT

### Frontend: Vercel

#### 1. Vercel CLI Kur

```bash
npm i -g vercel
```

#### 2. Deploy

```bash
# Proje dizininde
vercel

# Sorular:
# - Project name: safedream
# - Directory: ./
# - Build command: npm run build
# - Output directory: dist
```

#### 3. Environment Variables (Vercel Dashboard)

```
VITE_API_BASE_URL=https://safedream-backend.railway.app
```

#### 4. Domain Bağla

Vercel Dashboard → Settings → Domains

### Backend: Railway

#### 1. Railway'e Kayıt Ol

https://railway.app/

#### 2. GitHub Repo Bağla

- New Project → Deploy from GitHub
- Repo seç: SafeDream

#### 3. MySQL Database Ekle

- Add Database → MySQL

#### 4. Environment Variables

```env
DB_HOST=${{MySQL.MYSQLHOST}}
DB_NAME=${{MySQL.MYSQLDATABASE}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASS=${{MySQL.MYSQLPASSWORD}}
JWT_SECRET=your_super_secret_key
APP_ENV=production
```

#### 5. Buildpack Ayarla

```toml
# railway.toml
[build]
builder = "heroku/php"

[deploy]
startCommand = "heroku-php-apache2 public/"
```

---

## 🐳 DOCKER DEPLOYMENT

### Dockerfile (Backend)

```dockerfile
# backend/Dockerfile
FROM php:8.2-apache

# PHP extensions
RUN docker-php-ext-install mysqli pdo pdo_mysql

# Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Apache config
RUN a2enmod rewrite

# Copy source
WORKDIR /var/www/html
COPY . .

# Composer install
RUN cd public/safe && composer install --no-dev

# Permissions
RUN chown -R www-data:www-data /var/www/html
RUN chmod -R 755 /var/www/html

EXPOSE 80

CMD ["apache2-foreground"]
```

### Dockerfile (Frontend)

```dockerfile
# frontend/Dockerfile
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Nginx serve
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  # Database
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: safedream
      MYSQL_USER: safedream_user
      MYSQL_PASSWORD: safedream_pass
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"

  # Backend
  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    environment:
      DB_HOST: mysql
      DB_NAME: safedream
      DB_USER: safedream_user
      DB_PASS: safedream_pass
      JWT_SECRET: your_secret_key
    ports:
      - "8080:80"
    depends_on:
      - mysql

  # Frontend
  frontend:
    build:
      context: .
      dockerfile: frontend/Dockerfile
    ports:
      - "3000:80"
    depends_on:
      - backend

volumes:
  mysql_data:
```

### Deploy

```bash
# Build ve başlat
docker-compose up -d

# Logları izle
docker-compose logs -f

# Durdur
docker-compose down
```

---

## 🔐 ÇEVRE DEĞİŞKENLERİ

### Frontend (.env)

```env
# API Endpoint
VITE_API_BASE_URL=http://localhost:8000

# Binance WebSocket (Public - API key gerekmez)
VITE_BINANCE_WS_URL=wss://stream.binance.com:9443/ws

# Environment
VITE_APP_ENV=development
```

### Backend (public/safe/.env)

```env
# Database
DB_HOST=localhost
DB_NAME=safedream
DB_USER=root
DB_PASS=

# JWT
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_ACCESS_EXPIRY=900           # 15 minutes
JWT_REFRESH_EXPIRY=2592000      # 30 days

# Binance API (Test - Production'da kullanıcı bazlı)
BINANCE_API_KEY=your_testnet_api_key
BINANCE_API_SECRET=your_testnet_api_secret

# Environment
APP_ENV=development
APP_DEBUG=true
APP_URL=http://localhost:5173

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### ⚠️ GÜVENLİK UYARILARI

```bash
# ❌ ASLA YAPMA:
git add .env                    # .env dosyasını commit etme
git add public/safe/.env        # Backend .env'i commit etme

# ✅ YAPILMASI GEREKENLER:
# 1. .gitignore'da .env olduğundan emin ol
# 2. Production'da güçlü JWT_SECRET kullan (min 32 karakter)
# 3. Database şifresi güçlü olsun
# 4. CORS sadece kendi domain'ine izin ver
# 5. API key'leri encrypt et (database'de)
```

---

## 🔄 CI/CD PIPELINE

### GitHub Actions (Önerilen)

```yaml
# .github/workflows/deploy.yml
name: Deploy to AWS

on:
  push:
    branches: [ main ]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          VITE_API_BASE_URL: ${{ secrets.API_URL }}

      - name: Deploy to S3
        uses: jakejarvis/s3-sync-action@master
        with:
          args: --delete
        env:
          AWS_S3_BUCKET: ${{ secrets.AWS_S3_BUCKET }}
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          SOURCE_DIR: 'dist'

      - name: Invalidate CloudFront
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_ID }} \
            --paths "/*"

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to EC2
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ec2-user
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            cd /var/www/html/SafeDream
            git pull origin main
            cd public/safe
            composer install --no-dev
            sudo systemctl restart httpd
```

### GitHub Secrets Ekle

Repository → Settings → Secrets → New repository secret:

```
AWS_S3_BUCKET=safedream-frontend
AWS_ACCESS_KEY_ID=AKIAXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxx
CLOUDFRONT_ID=E1234567890ABC
EC2_HOST=ec2-xx-xx-xx-xx.compute.amazonaws.com
EC2_SSH_KEY=(Private key)
API_URL=https://api.safedream.com
```

---

## 🔒 GÜVENLİK VE MONITORING

### Güvenlik Checklist

- [x] **SSL/TLS** - HTTPS zorunlu (Let's Encrypt)
- [x] **JWT Token** - HTTP-only cookies
- [x] **CORS** - Sadece kendi domain
- [x] **SQL Injection** - Prepared statements kullan
- [x] **XSS Protection** - Input sanitization
- [x] **API Key Encryption** - Database'de encrypt
- [x] **Rate Limiting** - API endpoint'lerde limit
- [x] **.env Gitignore** - Asla commit etme
- [x] **2FA** (Opsiyonel) - Kullanıcı hesapları için

### Monitoring (AWS CloudWatch)

```javascript
// Backend - public/safe/core/logger.php
function logToCloudWatch($level, $message, $context = []) {
    $logData = [
        'timestamp' => time(),
        'level' => $level,
        'message' => $message,
        'context' => $context,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
    ];

    error_log(json_encode($logData));
}

// Kullanım:
logToCloudWatch('ERROR', 'Login failed', ['email' => $email]);
```

### Health Check Endpoints

```php
// public/safe/health.php
<?php
header('Content-Type: application/json');

$health = [
    'status' => 'ok',
    'timestamp' => time(),
    'database' => testDatabaseConnection(),
    'api' => testBinanceAPI()
];

echo json_encode($health);

function testDatabaseConnection() {
    try {
        require_once 'core/config.php';
        $pdo = getDatabaseConnection();
        return 'connected';
    } catch (Exception $e) {
        return 'error';
    }
}
```

---

## 💰 MALİYET ANALİZİ

### AWS (Önerilen)

| Servis | Özellik | Aylık Maliyet |
|--------|---------|---------------|
| **S3** | Frontend hosting (1GB) | $0.023 |
| **CloudFront** | CDN (10GB transfer) | $0.85 |
| **EC2** | t2.micro instance | $8.50 |
| **RDS** | db.t3.micro (20GB) | $15.00 |
| **SSL** | ACM (Free) | $0 |
| **Route53** | Domain DNS | $0.50 |
| **TOPLAM** | | **~$25/ay** |

**Free Tier ile:** İlk 12 ay $0-5/ay

---

### Vercel + Railway

| Servis | Özellik | Aylık Maliyet |
|--------|---------|---------------|
| **Vercel** | Frontend (Free tier) | $0 |
| **Railway** | Backend + MySQL (Starter) | $5 |
| **TOPLAM** | | **$5/ay** |

**En uygun fiyat!** ✅

---

### DigitalOcean

| Servis | Özellik | Aylık Maliyet |
|--------|---------|---------------|
| **Droplet** | 1GB RAM, 25GB SSD | $6 |
| **TOPLAM** | | **$6/ay** |

---

## 🔧 SORUN GİDERME

### Sık Karşılaşılan Hatalar

#### 1. CORS Hatası

**Hata:**
```
Access to fetch at 'https://api.safedream.com' has been blocked by CORS policy
```

**Çözüm:**
```php
// public/safe/core/response.php
$allowedOrigins = [
    'https://safedream.com',
    'https://www.safedream.com'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}
```

---

#### 2. JWT Token Geçersiz

**Hata:**
```json
{"success": false, "message": "Token geçersiz"}
```

**Çözüm:**
- JWT_SECRET production'da değişti mi kontrol et
- Token expiry zamanı geçti mi kontrol et
- Browser cookies temizle

---

#### 3. WebSocket Bağlanamıyor

**Hata:**
```
WebSocket connection failed
```

**Çözüm:**
- Binance API erişilebilir mi kontrol et
- Firewall WebSocket'e izin veriyor mu?
- WSS (güvenli) kullan: `wss://stream.binance.com:9443`

---

#### 4. Database Connection Error

**Hata:**
```
SQLSTATE[HY000] [2002] Connection refused
```

**Çözüm:**
```bash
# RDS Security Group kontrol et
# EC2'nin security group'una RDS erişim izni ver

# MySQL servis durumu kontrol et
systemctl status mysqld

# .env dosyasında credentials doğru mu kontrol et
```

---

## 📚 EK KAYNAKLAR

### Dokümantasyon

- [README.md](README.md) - Proje genel bilgiler
- [ROBOT_ARCHITECTURE.md](ROBOT_ARCHITECTURE.md) - Bot mimarisi detayları
- [BOT_TESTING_GUIDE.md](BOT_TESTING_GUIDE.md) - Bot test rehberi
- [SUNUCU_KONTROL_LISTESI.md](SUNUCU_KONTROL_LISTESI.md) - Sunucu kurulum

### API Dokümantasyonları

- [Binance API Docs](https://binance-docs.github.io/apidocs/)
- [Binance Testnet](https://testnet.binance.vision/)
- [React Docs](https://react.dev/)
- [Redux Toolkit](https://redux-toolkit.js.org/)

---

## 📞 DESTEK

**Geliştirici:** SafeDream Team
**GitHub:** https://github.com/yourusername/SafeDream
**E-posta:** support@safedream.com

---

## 📝 LİSANS

MIT License - Detaylar için LICENSE dosyasına bakın.

---

## 📊 BOT GRAFİK ANALİZ SİSTEMİ (v1.1.0)

### Genel Bakış

SafeDream, bot işlemlerini **profesyonel trading grafiklerinde** görselleştirme özelliğine sahiptir. Bu özellik, trader'ların işlemlerini analiz etmesini ve stratejilerini optimize etmesini sağlar.

### Grafik Özellikleri

#### 1. Candlestick (Mum) Grafiği

**Kütüphane:** Lightweight Charts v4.2.3 (TradingView)

```javascript
// Grafik yapılandırması
{
  width: 'responsive',
  height: 500,
  layout: {
    background: { color: '#1a1625' },
    textColor: '#d1d4dc',
  },
  timeScale: {
    timeVisible: true,
    secondsVisible: false,
  }
}
```

**Data Source:**
- Binance API (100 adet 1m mum)
- Interval: 1 dakika
- Auto-refresh: Modal açıldığında

#### 2. İşlem İşaretleri (Markers)

**Alış İşareti (▲):**
```javascript
{
  position: 'belowBar',
  color: '#26a69a',      // Yeşil
  shape: 'arrowUp',
  text: 'ALIM $0.3641'
}
```

**Satış İşareti (▼):**
```javascript
{
  position: 'aboveBar',
  color: isProfit ? '#26a69a' : '#ef5350',  // Yeşil/Kırmızı
  shape: 'arrowDown',
  text: '✅ $0.3673 (+$0.88)'  // Kar
}
```

#### 3. Fiyat Seviye Çizgileri (Price Lines)

| Çizgi | Renk | Stil | Açıklama |
|-------|------|------|----------|
| **Alış Fiyatı** | Beyaz | Kesikli | Bot'un giriş yaptığı fiyat |
| **Stop-Loss** | Kırmızı | Düz | Zarar durdur seviyesi |
| **En Yüksek** | Yeşil | Kesikli | Pozisyon süresince ulaşılan max fiyat |
| **Hedef Kar** | Mavi | Kesikli | Kar hedefi seviyesi |

```javascript
// Örnek: Stop-loss çizgisi
candlestickSeries.createPriceLine({
  price: 0.3568,
  color: '#ef5350',
  lineWidth: 2,
  lineStyle: 0,  // Solid
  title: 'Stop: $0.3568'
})
```

### Veri Akışı

```
Bot Logs → Sort (timestamp asc) → Match with Candles → Create Markers → Render
```

**Kritik Not:** Bot logları ters sırada saklandığı için sıralama zorunlu:

```javascript
// ❌ Hata: Logs ters sırada
logs: [
  { timestamp: 1768795388318, type: 'sell' },  // En yeni
  { timestamp: 1768795204323, type: 'buy' },
  { timestamp: 1768794943324, type: 'sell' },
  { timestamp: 1768792953336, type: 'buy' }    // En eski
]

// ✅ Çözüm: Sırala
const sortedLogs = [...logs].sort((a, b) => a.timestamp - b.timestamp)
```

### Kullanıcı Etkileşimi

| Özellik | Açıklama |
|---------|----------|
| **Zoom** | Mouse scroll wheel ile zoom in/out |
| **Pan** | Grafik üzerinde sürükleyerek kaydırma |
| **Crosshair** | Mouse ile fiyat ve zaman bilgisi |
| **Tooltip** | İşaret üzerine gelince detaylar |
| **Responsive** | Mobil uyumlu, otomatik boyutlandırma |

### Teknik İmplementasyon

#### Component Hierarchy

```
TestBotCard
  └─ BotChartModal
       ├─ Chart Container (ref)
       ├─ Candlestick Series
       ├─ Markers (Buy/Sell)
       └─ Price Lines (Stop/Target/Max)
```

#### State Management

```javascript
const [showChartModal, setShowChartModal] = useState(false)
const chartRef = useRef(null)
const candlestickSeriesRef = useRef(null)
const markersRef = useRef([])
```

#### Lifecycle

```javascript
useEffect(() => {
  if (!isOpen) return

  // 1. Create chart
  const chart = createChart(container, options)

  // 2. Add candlestick series
  const series = chart.addCandlestickSeries()

  // 3. Set data
  series.setData(formattedKlines)

  // 4. Add bot markers
  addBotMarkers(series, candleData)

  // 5. Add price lines
  addPriceLines(chart, botState)

  // Cleanup on unmount
  return () => chart.remove()
}, [isOpen, klinesData, botState])
```

### Performance Optimizations

1. **Lazy Loading:** Modal açılana kadar grafik render edilmez
2. **Chart Cleanup:** Component unmount'ta chart instance temizlenir
3. **Memory Management:** Ref'ler kullanılarak memory leak önlenir
4. **Conditional Rendering:** Data hazır olana kadar loading gösterir

```javascript
{isLoading ? (
  <LoadingSpinner />
) : (
  <div ref={chartContainerRef} />
)}
```

### Hata Yönetimi

#### Sık Karşılaşılan Hatalar

**1. Timestamp Sıralama Hatası**

```javascript
// Hata:
Error: data must be asc ordered by time

// Çözüm:
const sortedLogs = [...logs].sort((a, b) => a.timestamp - b.timestamp)
markers.sort((a, b) => a.time - b.time)
```

**2. Candle Matching Hatası**

```javascript
// Sorunu önle:
const nearestCandle = findNearestCandle(candleData, log.timestamp)
if (nearestCandle) {
  // İşareti ekle
}
```

**3. Null Reference Hatası**

```javascript
// Guard clause kullan:
if (!candlestickSeriesRef.current) return
candlestickSeriesRef.current.createPriceLine(...)
```

### Deployment Notları

#### Production Build

```bash
npm run build
```

Lightweight Charts otomatik tree-shaking ile optimize edilir.

#### Bundle Size Impact

- Lightweight Charts: ~43KB (gzipped)
- BotChartModal: ~8KB
- **Toplam Ek Yük:** ~51KB

#### Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile: ✅ Touch gestures

### Gelecek Geliştirmeler

- [ ] **Multi-timeframe:** 1m, 5m, 15m, 1h seçenekleri
- [ ] **Indicator'lar:** RSI, MACD, Bollinger Bands
- [ ] **Drawing Tools:** Trend çizgileri, Fibonacci
- [ ] **Snapshot:** Grafik screenshot alma
- [ ] **Export:** PNG/SVG export
- [ ] **Replay Mode:** İşlemleri animasyonlu oynatma

### Dosya Yapısı

```
src/
├── components/
│   └── BotChartModal.jsx           # 300+ satır
│       ├── Chart creation
│       ├── Marker processing
│       ├── Price line drawing
│       └── Event handlers
│
└── pages/testpage/
    └── TestBotCard.jsx              # Chart button integration
```

### API Dependencies

| Servis | Endpoint | Kullanım |
|--------|----------|----------|
| **Binance** | `/api/v3/klines` | Candlestick data |
| **Bot Manager** | `botState.logs` | İşlem işaretleri |
| **Bot Manager** | `botState.buyPrice` | Fiyat çizgileri |

---

## 🎯 GELECEK PLANLAR (Roadmap)

### Faz 1.1: Grafik Geliştirmeleri (Q1 2026) ✅

- [x] Lightweight Charts entegrasyonu
- [x] Candlestick grafiği
- [x] İşlem işaretleri (Buy/Sell markers)
- [x] Fiyat seviye çizgileri
- [x] Responsive tasarım
- [ ] Multi-timeframe desteği
- [ ] Technical indicators (RSI, MACD)

### Faz 2: Backend Worker (Q2 2026)

- [ ] Node.js backend worker servisi
- [ ] MongoDB entegrasyonu
- [ ] 7/24 server-side bot execution
- [ ] Multi-user support
- [ ] Advanced analytics

### Faz 3: Mobile App (Q3 2026)

- [ ] React Native mobil uygulama
- [ ] Push notifications
- [ ] Biometric authentication
- [ ] Background services

### Faz 4: Advanced Features (Q4 2026)

- [ ] Machine Learning stratejileri
- [ ] Social trading
- [ ] Copy trading
- [ ] Advanced risk management

---

**Son Güncelleme:** 19 Ocak 2026
**Versiyon:** 1.1.0
**Durum:** Production Ready ✅

**Yeni Özellikler (v1.1.0):**
- ✅ Bot İşlem Grafiği (Lightweight Charts)
- ✅ Visual Trading Analysis
- ✅ Interactive Chart Markers
