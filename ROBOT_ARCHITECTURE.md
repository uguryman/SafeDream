# 🤖 SafeDream Trading Bot Mimarisi

## 📋 İçindekiler
1. [Mevcut Mimari (Faz 1 - Frontend)](#faz-1-frontend-only)
2. [Gelecek Mimari (Faz 2 - Backend)](#faz-2-backend-worker)
3. [Kullanım Örnekleri](#kullanım-örnekleri)
4. [Veri Yapısı](#veri-yapısı)

---

## 🎯 Faz 1: Frontend Only (MEVCUT)

### Mimari Şeması
```
┌─────────────────────────────────────────────┐
│           React Application                  │
│  ┌─────────────────────────────────────┐    │
│  │  App.jsx (Initialize Bot Manager)   │    │
│  └──────────────┬──────────────────────┘    │
│                 │                            │
│  ┌──────────────▼──────────────────────┐    │
│  │    Bot Manager Service (Singleton)  │◄───┼─── Tüm sayfalar paylaşır
│  │    - Bot lifecycle yönetimi         │    │
│  │    - State management               │    │
│  │    - Strategy execution             │    │
│  └──────────────┬──────────────────────┘    │
│                 │                            │
│  ┌──────────────▼──────────────────────┐    │
│  │   WebSocket Service (Singleton)     │    │
│  │    - Binance real-time fiyat        │    │
│  │    - Publisher/Subscriber pattern   │    │
│  └──────────────┬──────────────────────┘    │
│                 │                            │
└─────────────────┼────────────────────────────┘
                  │
    ┌─────────────▼─────────────┐
    │   LocalStorage/IndexedDB  │
    │   - Bot state             │
    │   - Trade history         │
    │   - Settings              │
    │   - Logs                  │
    └───────────────────────────┘
```

### Nasıl Çalışır?

#### 1. **Uygulama Başlatma**
```javascript
// App.jsx - Uygulama açılırken
useEffect(() => {
  botManager.initialize() // Bot Manager başlatılır
  // LocalStorage'dan kayıtlı bot'lar yüklenir
  // Çalışan bot'lar otomatik başlatılır
}, [])
```

#### 2. **Bot Oluşturma**
```javascript
// TestBotCard.jsx
const botId = botManager.createBot({
  symbol: 'BTCUSDT',
  strategy: 'scalping',
  settings: {
    buyThreshold: -0.5,  // -0.5% düşünce al
    sellThreshold: 0.5,   // +0.5% kar yap sat
    tradeAmount: 10       // $10 USDT
  }
})
```

#### 3. **Bot Başlatma**
```javascript
botManager.startBot(botId, {
  onStart: (bot) => {
    console.log('Bot başladı:', bot)
  },
  onPriceUpdate: (priceData, bot) => {
    // Her fiyat güncellemesinde
    console.log('Fiyat:', priceData.price)
  },
  onTrade: (trade) => {
    // İşlem yapıldığında
    console.log('İşlem:', trade.type, trade.price)
  }
})
```

#### 4. **WebSocket Fiyat Akışı**
```
Binance → WebSocket → Bot Manager → Strategy → Trade Decision
  ↓                                                    ↓
Her saniye                                      LocalStorage'a kaydet
```

#### 5. **State Persistence**
```javascript
// Her 10 fiyat güncellemesinde bir
botManager.saveBotState(botId, bot)

// LocalStorage yapısı:
{
  "bots": {
    "bot_BTCUSDT_1234567890": {
      "id": "bot_BTCUSDT_1234567890",
      "symbol": "BTCUSDT",
      "strategy": "scalping",
      "isRunning": true,
      "stats": {
        "totalTrades": 15,
        "successfulTrades": 12,
        "totalProfit": 45.67
      },
      "logs": [...],
      "priceHistory": [...],
      "lastSaved": 1737123456789
    }
  }
}
```

### ✅ Avantajlar
- ✅ Backend'e gerek yok
- ✅ Hızlı uygulama
- ✅ Sayfa değişse bile çalışır (singleton)
- ✅ Sayfa yenilenince kaldığı yerden devam eder
- ✅ Gerçek zamanlı WebSocket ile hızlı

### ❌ Sınırlamalar
- ❌ Browser/Tab kapanınca durur
- ❌ Mobil uygulama kapalıyken çalışmaz
- ❌ Multi-device sync yok
- ❌ API key'ler frontend'de (güvenlik riski)

---

## 🚀 Faz 2: Backend Worker (GELECEK)

### Mimari Şeması
```
┌──────────────────────────────────────┐
│  Mobile App / Web Browser            │
│  ├─ UI Components                    │
│  ├─ Real-time updates (Socket.io)   │
│  └─ Control API calls                │
└────────────┬─────────────────────────┘
             │ REST API / Socket.io
    ┌────────▼────────────────────────┐
    │     Backend Server (Node.js)    │
    │  ┌──────────────────────────┐   │
    │  │   Bot Engine Service     │   │ ← 7/24 ÇALIŞIR
    │  │   - Strategy execution   │   │
    │  │   - Trade management     │   │
    │  └──────────────────────────┘   │
    │  ┌──────────────────────────┐   │
    │  │   WebSocket Client       │   │ ← Binance'e bağlı
    │  │   - Price streaming      │   │
    │  └──────────────────────────┘   │
    │  ┌──────────────────────────┐   │
    │  │   Database (MongoDB)     │   │
    │  │   - Bot states           │   │
    │  │   - Trade history        │   │
    │  │   - User settings        │   │
    │  └──────────────────────────┘   │
    └──────────────────────────────────┘
```

### Backend API Endpoints (Planlanmış)

```javascript
// Bot yönetimi
POST   /api/bots              // Yeni bot oluştur
GET    /api/bots              // Kullanıcının bot'larını listele
GET    /api/bots/:id          // Bot detayı
PUT    /api/bots/:id          // Bot ayarlarını güncelle
DELETE /api/bots/:id          // Bot'u sil

POST   /api/bots/:id/start    // Bot'u başlat
POST   /api/bots/:id/stop     // Bot'u durdur

// İşlem geçmişi
GET    /api/bots/:id/history  // İşlem geçmişi
GET    /api/bots/:id/logs     // Bot logları
GET    /api/bots/:id/stats    // İstatistikler

// Real-time updates (Socket.io)
socket.on('bot:priceUpdate')  // Fiyat güncellemeleri
socket.on('bot:trade')        // İşlem bildirimleri
socket.on('bot:statusChange') // Durum değişiklikleri
```

### Database Schema (MongoDB)

```javascript
// User collection
{
  _id: ObjectId,
  email: String,
  binanceApiKey: String,      // Encrypted
  binanceApiSecret: String,   // Encrypted
  createdAt: Date
}

// Bot collection
{
  _id: ObjectId,
  userId: ObjectId,
  symbol: String,
  strategy: String,
  settings: Object,
  isRunning: Boolean,
  stats: {
    totalTrades: Number,
    successfulTrades: Number,
    totalProfit: Number,
    startTime: Date
  },
  createdAt: Date,
  updatedAt: Date
}

// Trade collection
{
  _id: ObjectId,
  botId: ObjectId,
  userId: ObjectId,
  type: String,        // 'BUY' | 'SELL'
  symbol: String,
  price: Number,
  quantity: Number,
  profit: Number,
  timestamp: Date
}

// PriceHistory collection (optional - cached data)
{
  _id: ObjectId,
  symbol: String,
  price: Number,
  timestamp: Date
}
```

### ✅ Avantajlar
- ✅ 7/24 kesintisiz çalışır
- ✅ Mobil uygulama kapalıyken de çalışır
- ✅ Multi-device sync (telefon + bilgisayar)
- ✅ API key'ler güvende (backend'de encrypted)
- ✅ Daha güçlü stratejiler (ML/AI eklenebilir)
- ✅ Rate limiting & risk management
- ✅ Cloud hosting (AWS/Heroku/DigitalOcean)

### ❌ Maliyetler
- ❌ Backend geliştirme zamanı
- ❌ Hosting maliyeti (~$5-20/ay)
- ❌ Database maliyeti
- ❌ Bakım ve monitoring

---

## 📱 Mobil Uygulama Desteği (Gelecek)

### React Native App
```
┌──────────────────────────────────┐
│    React Native App              │
│  ├─ Background Service           │ ← Uygulama kapalıyken
│  ├─ Push Notifications           │ ← İşlem bildirimleri
│  └─ Local bot mode (optional)   │ ← Offline çalışma
└────────────┬─────────────────────┘
             │
    ┌────────▼────────┐
    │  Backend Server │ ← Asıl bot buradan çalışır
    └─────────────────┘
```

### Background Service Stratejileri

1. **Headless JS (React Native)**
   - Uygulama kapalıyken çalışır
   - iOS: Sınırlı (10-15 dakika)
   - Android: Daha uzun süre

2. **Backend Worker (Önerilen)**
   - Uygulama durumu farketmez
   - 7/24 garantili çalışma
   - Cross-platform

---

## 💡 Önerilen Yol Haritası

### ✅ Şimdi (Faz 1 - Hafta 1-2)
1. ✅ Frontend bot manager (mevcut)
2. ✅ WebSocket entegrasyonu
3. ✅ LocalStorage persistence
4. ✅ Sayfa değişse bile çalışma

### 🔄 Yakında (Faz 1.5 - Hafta 3-4)
1. Daha gelişmiş stratejiler
2. Stop-loss / Take-profit
3. Grafik görselleştirme
4. Export/Import bot ayarları (JSON)
5. Email/Telegram bildirimleri (webhook)

### 🚀 Gelecek (Faz 2 - Ay 2-3)
1. Backend API geliştirme
2. Database entegrasyonu
3. Multi-user support
4. Cloud deployment
5. Mobil uygulama (React Native)
6. Push notifications

---

## 🔧 Kullanım Örnekleri

### Bot Oluştur ve Başlat
```javascript
import botManager from './services/botManager'

// Bot oluştur
const botId = botManager.createBot({
  symbol: 'BTCUSDT',
  strategy: 'scalping',
  settings: {
    buyThreshold: -0.5,
    sellThreshold: 0.5,
    tradeAmount: 10
  }
})

// Bot'u başlat
botManager.startBot(botId, {
  onTrade: (trade) => {
    if (trade.type === 'BUY') {
      console.log('Alım yapıldı:', trade.price)
    } else {
      console.log('Satım yapıldı:', trade.price, '| Kar:', trade.profit)
    }
  }
})
```

### Bot Durumunu Takip Et
```javascript
const bot = botManager.getBot(botId)

console.log('Bot çalışıyor mu?', bot.isRunning)
console.log('Toplam işlem:', bot.stats.totalTrades)
console.log('Kar:', bot.stats.totalProfit)
console.log('Loglar:', bot.logs)
```

### Bot Geçmişini Export Et
```javascript
const history = botManager.exportBotHistory(botId)

// JSON dosyası olarak indir
const blob = new Blob([JSON.stringify(history, null, 2)], {
  type: 'application/json'
})
const url = URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url
a.download = `bot_${botId}_history.json`
a.click()
```

### Sayfa Değişse Bile Çalışma
```javascript
// App.jsx - Uygulama başlangıcında
useEffect(() => {
  botManager.initialize() // Kayıtlı bot'lar otomatik başlar
}, [])

// Kullanıcı başka sayfaya gitse bile bot çalışır
// Çünkü botManager singleton ve App seviyesinde
```

---

## 📊 Veri Yapısı

### Bot State
```typescript
interface Bot {
  id: string
  symbol: string
  strategy: 'scalping' | 'grid' | 'dca'
  isRunning: boolean
  settings: {
    buyThreshold: number    // %
    sellThreshold: number   // %
    tradeAmount: number     // USDT
  }
  stats: {
    totalTrades: number
    successfulTrades: number
    totalProfit: number
    startTime: number | null
  }
  logs: Array<{
    timestamp: number
    time: string
    message: string
    type: 'info' | 'buy' | 'sell' | 'error'
  }>
  priceHistory: Array<{
    price: number
    timestamp: number
    priceChangePercent: number
  }>
  buyPrice: number | null   // Aktif alım fiyatı
  createdAt: number
}
```

### LocalStorage Structure
```json
{
  "safedream_bot_state": {
    "bots": {
      "bot_BTCUSDT_1737123456": { Bot },
      "bot_ETHUSDT_1737123457": { Bot }
    }
  }
}
```

---

## 🔒 Güvenlik Notları

### Faz 1 (Frontend)
- ⚠️ API key'ler LocalStorage'da (şifrelenmeli)
- ⚠️ Hassas işlemler için backend gerekli
- ✅ Testnet kullanılıyor (gerçek para yok)

### Faz 2 (Backend)
- ✅ API key'ler server-side encrypted
- ✅ HTTPS zorunlu
- ✅ Rate limiting
- ✅ User authentication
- ✅ Trade validation
- ✅ Risk management

---

## 📞 Destek

Bot ile ilgili sorular için:
- GitHub Issues
- Discord: SafeDream Community
- Email: support@safedream.com

---

**Son Güncelleme:** 2026-01-19
**Versiyon:** 1.0.0 (Faz 1 - Frontend Only)
