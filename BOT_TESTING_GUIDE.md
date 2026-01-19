# 🧪 Bot Test Rehberi

## ✅ Tamamlanan Özellikler

### 1. **Bot Manager (Singleton)**
- ✅ App.jsx'te initialize ediliyor
- ✅ LocalStorage persistence
- ✅ Sayfa değişse bile çalışıyor

### 2. **WebSocket Entegrasyonu**
- ✅ Binance Testnet WebSocket
- ✅ Gerçek zamanlı fiyat akışı
- ✅ Custom React hook (useBinanceWebSocket)

### 3. **TestBotCard Güncellemeleri**
- ✅ botManager ile entegre
- ✅ WebSocket fiyat gösterimi
- ✅ JSON export özelliği

---

## 🧪 Test Adımları

### Test 1: Bot Oluşturma ve Başlatma

1. **Test sayfasına git**
   ```
   http://localhost:3000/testpage
   ```

2. **Robot sekmesine tıkla** (Alt menüde 🤖)

3. **Bot ayarlarını yap:**
   - Coin: BTCUSDT
   - Strateji: Scalping
   - Alım Eşiği: -0.5%
   - Satım Eşiği: 0.5%
   - İşlem Tutarı: $10

4. **"▶️ Botu Başlat" butonuna tıkla**

5. **Kontrol Et:**
   - ✅ Durum: "🟢 Aktif" olmalı
   - ✅ WebSocket: Yeşil nokta (bağlı) görünmeli
   - ✅ Anlık Fiyat: Bitcoin fiyatı gösterilmeli
   - ✅ Console: "✅ WebSocket bağlandı" görünmeli

**Beklenen Sonuç:**
```
Console:
🤖 Bot Manager başlatılıyor...
✅ Bot Manager hazır
🆕 Yeni bot oluşturuldu: bot_BTCUSDT_1737123456
🔌 WebSocket bağlanıyor
✅ WebSocket bağlandı
▶️ Bot başlatılıyor: bot_BTCUSDT_1737123456
```

---

### Test 2: Sayfa Yenileme (Persistence)

1. **Bot çalışırken sayfayı yenile** (F5)

2. **Kontrol Et:**
   - ✅ Bot hala çalışıyor olmalı ("🟢 Aktif")
   - ✅ İstatistikler kaybolmamalı
   - ✅ Loglar kaybolmamalı
   - ✅ WebSocket otomatik yeniden bağlanmalı

**Beklenen Sonuç:**
```
Console:
🤖 Bot Manager başlatılıyor...
📂 1 bot yüklendi
🔄 Bot yeniden başlatılıyor: bot_BTCUSDT_1737123456
📂 Mevcut bot yüklendi: bot_BTCUSDT_1737123456
```

---

### Test 3: Sayfa Değiştirme (Background Execution)

1. **Bot çalışırken başka bir sayfaya git:**
   - Home sayfasına git (/home)
   - Veya MyPage'e git (/mypage)

2. **5 saniye bekle**

3. **Test sayfasına geri dön** (/testpage → Robot)

4. **Kontrol Et:**
   - ✅ Bot hala çalışıyor olmalı
   - ✅ İstatistikler güncellenmiş olmalı
   - ✅ Yeni loglar eklenmiş olmalı
   - ✅ Fiyat geçmişi büyümüş olmalı

**Beklenen Sonuç:**
Bot kesintisiz çalışmaya devam etmiş olmalı. Çünkü botManager App.jsx seviyesinde singleton.

---

### Test 4: LocalStorage Kontrolü

1. **Browser DevTools aç** (F12)

2. **Application → Local Storage → localhost**

3. **"safedream_bot_state" key'ini bul**

4. **JSON içeriğini kontrol et:**
```json
{
  "bots": {
    "bot_BTCUSDT_1737123456": {
      "id": "bot_BTCUSDT_1737123456",
      "symbol": "BTCUSDT",
      "strategy": "scalping",
      "isRunning": true,
      "settings": {
        "buyThreshold": -0.5,
        "sellThreshold": 0.5,
        "tradeAmount": 10
      },
      "stats": {
        "totalTrades": 0,
        "successfulTrades": 0,
        "totalProfit": 0,
        "startTime": 1737123456789
      },
      "logs": [...],
      "priceHistory": [...],
      "createdAt": 1737123456789,
      "lastSaved": 1737123456999
    }
  }
}
```

---

### Test 5: WebSocket Gerçek Zamanlı Fiyat

1. **Bot çalışırken fiyatı izle**

2. **Kontrol Et:**
   - ✅ Fiyat her saniye güncelleniy or mu?
   - ✅ Değişim yüzdesi (%) gösteriliyor mu?
   - ✅ Yeşil/kırmızı renk değişiyor mu?

3. **Console'da WebSocket mesajlarını kontrol et:**
```
Network → WS (WebSocket) → Messages
```

**Beklenen Format:**
```json
{
  "stream": "btcusdt@ticker",
  "data": {
    "s": "BTCUSDT",
    "c": "95123.45",
    "P": "1.23",
    ...
  }
}
```

---

### Test 6: Bot Durdurma ve Export

1. **"⏹️ Botu Durdur" butonuna tıkla**

2. **Kontrol Et:**
   - ✅ Durum: "🔴 Durduruldu" olmalı
   - ✅ WebSocket nokta kaybolmalı
   - ✅ Fiyat gösterimi kaybolmalı

3. **"📥 Geçmişi İndir (JSON)" butonuna tıkla**

4. **İndirilen dosyayı kontrol et:**
   - ✅ Dosya adı: `bot_BTCUSDT_timestamp.json`
   - ✅ İçerik: Bot bilgileri, stats, logs, priceHistory

---

### Test 7: Strateji Bilgi Modalı

1. **Her strateji butonunun üstündeki "?" butonuna tıkla**

2. **Kontrol Et:**
   - ✅ Modal açılıyor mu?
   - ✅ Açıklama gösteriliyor mu?
   - ✅ "Nasıl Çalışır?" bölümü var mı?
   - ✅ Örnek senaryo gösteriliyor mu?
   - ✅ Artılar/Eksiler gösteriliyor mu?

3. **Modal'ı kapat:**
   - ✅ "✕" butonu
   - ✅ "Anladım" butonu
   - ✅ Dışarıya tıklama

---

## 🐛 Bilinen Sorunlar / TODO

### Şimdilik Test Edilemeyen:
- ❌ **Gerçek emir gönderme** (Binance Testnet API key gerekli)
- ❌ **Scalping stratejisi kar/zarar hesabı** (fiyat volatilitesi yeterli olmayabilir)

### Gelecek Testler:
- [ ] Stop-loss / Take-profit
- [ ] Grid stratejisi
- [ ] DCA stratejisi
- [ ] Multi-bot (aynı anda birden fazla coin)
- [ ] Error handling (WebSocket disconnect)

---

## 📊 Beklenen Console Çıktıları

### Normal Akış:
```
🤖 Bot Manager başlatılıyor...
✅ Bot Manager hazır
🆕 Yeni bot oluşturuldu: bot_BTCUSDT_1737123456
🔌 WebSocket bağlanıyor: wss://testnet.binance.vision/stream?streams=btcusdt@ticker
✅ WebSocket bağlandı
▶️ Bot başlatılıyor: bot_BTCUSDT_1737123456
```

### Sayfa Yenileme:
```
🤖 Bot Manager başlatılıyor...
📂 1 bot yüklendi
🔄 Bot yeniden başlatılıyor: bot_BTCUSDT_1737123456
✅ WebSocket bağlandı
📂 Mevcut bot yüklendi: bot_BTCUSDT_1737123456
```

### Bot Durdurma:
```
⏹️ Bot durduruluyor: bot_BTCUSDT_1737123456
🔌 WebSocket bağlantısı kapatılıyor
```

---

## ❌ Hata Durumları

### WebSocket Bağlanamıyor:
```
❌ WebSocket hatası: [error details]
🔄 Yeniden bağlanılıyor... (1/5)
```

**Çözüm:**
- İnternet bağlantısını kontrol et
- Binance Testnet erişilebilir mi?
- Firewall/VPN engelliyor olabilir

### LocalStorage Dolu:
```
Bot kaydetme hatası: QuotaExceededError
```

**Çözüm:**
- DevTools → Application → Clear Storage
- Eski bot'ları sil

### Component Render Hatası:
```
❌ Bot yükleme hatası: [error details]
```

**Çözüm:**
- LocalStorage'ı temizle
- Sayfayı yenile

---

## 🔧 Debug Komutları

### Console'da Bot Durumunu Kontrol Et:
```javascript
// Bot Manager'ı kontrol et
botManager.getAllBots()

// Belirli bir bot'u kontrol et
botManager.getBot('bot_BTCUSDT_1737123456')

// WebSocket durumu
binanceWS.isConnected()

// LocalStorage'ı temizle
localStorage.removeItem('safedream_bot_state')
```

---

## ✅ Test Checklist

**Başlangıç:**
- [ ] App.jsx'te botManager initialize oldu mu?
- [ ] Console'da "✅ Bot Manager hazır" görünüyor mu?

**Bot Oluşturma:**
- [ ] Bot başlatıldı mı?
- [ ] WebSocket bağlandı mı?
- [ ] Fiyat gösteriliyor mu?

**Persistence:**
- [ ] Sayfa yenilenince bot devam etti mi?
- [ ] LocalStorage'a kaydediliyor mu?
- [ ] İstatistikler korunuyor mu?

**Background Execution:**
- [ ] Başka sayfaya gidince bot çalışmaya devam etti mi?
- [ ] Geri dönünce loglar artmış mı?

**UI:**
- [ ] Strateji bilgi modalı açılıyor mu?
- [ ] Export JSON çalışıyor mu?
- [ ] WebSocket durumu gösteriliyor mu?

---

## 📞 Destek

Sorun yaşarsan:
1. Console loglarını kontrol et
2. LocalStorage'ı kontrol et
3. Network → WS mesajlarını kontrol et
4. [ROBOT_ARCHITECTURE.md](ROBOT_ARCHITECTURE.md) dokümanını oku

**Başarılar! 🚀**
