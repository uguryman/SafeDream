/**
 * Binance WebSocket Servisi
 * Gerçek zamanlı fiyat akışı için WebSocket bağlantısı
 */

class BinanceWebSocketService {
  constructor() {
    this.ws = null
    this.wsKline = null // Candlestick stream için ayrı WebSocket
    this.subscribers = new Map() // symbol -> callback array (ticker için)
    this.klineSubscribers = new Map() // symbol -> callback array (candlestick için)
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 3000
    this.isTestnet = true // Testnet için
  }

  /**
   * WebSocket bağlantısı başlat
   * @param {Array<string>} symbols - Takip edilecek coin'ler (örn: ['btcusdt', 'ethusdt'])
   */
  connect(symbols) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return
    }

    // Symbol'leri küçük harfe çevir (Binance WS formatı)
    const streams = symbols.map(s => `${s.toLowerCase()}@ticker`).join('/')

    // Testnet veya Mainnet URL
    // NOT: Binance Testnet WebSocket bazen çalışmayabilir
    // Mainnet kullanmak daha güvenilir (sadece fiyat okuyoruz, işlem yok)
    const baseUrl = this.isTestnet
      ? 'wss://stream.binance.com:9443/stream' // Mainnet kullan (daha stabil)
      : 'wss://stream.binance.com:9443/stream'

    const url = `${baseUrl}?streams=${streams}`


    this.ws = new WebSocket(url)

    this.ws.onopen = () => {
      this.reconnectAttempts = 0
    }

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.stream && data.data) {
          const ticker = data.data
          const symbol = ticker.s // BTCUSDT

          // Price data objesi
          const priceData = {
            symbol: symbol,
            price: parseFloat(ticker.c), // Current price
            high: parseFloat(ticker.h),  // 24h high
            low: parseFloat(ticker.l),   // 24h low
            volume: parseFloat(ticker.v), // 24h volume
            priceChange: parseFloat(ticker.p), // Price change
            priceChangePercent: parseFloat(ticker.P), // Price change %
            timestamp: ticker.E, // Event time
            lastPrice: parseFloat(ticker.c),
            bidPrice: parseFloat(ticker.b), // Best bid
            askPrice: parseFloat(ticker.a), // Best ask
          }

          // Subscriber'lara bildir
          this.notifySubscribers(symbol, priceData)
        }
      } catch (error) {
      }
    }

    this.ws.onerror = (error) => {
    }

    this.ws.onclose = () => {
      this.handleReconnect(symbols)
    }
  }

  /**
   * Yeniden bağlanma mantığı
   */
  handleReconnect(symbols) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++

      setTimeout(() => {
        this.connect(symbols)
      }, this.reconnectDelay)
    } else {
    }
  }

  /**
   * Fiyat güncellemeleri için abone ol
   * @param {string} symbol - Coin symbol (BTCUSDT)
   * @param {Function} callback - Fiyat güncellendiğinde çağrılacak fonksiyon
   * @returns {Function} Unsubscribe fonksiyonu
   */
  subscribe(symbol, callback) {
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, [])
    }

    this.subscribers.get(symbol).push(callback)

    // Unsubscribe fonksiyonu döndür
    return () => {
      const callbacks = this.subscribers.get(symbol)
      if (callbacks) {
        const index = callbacks.indexOf(callback)
        if (index > -1) {
          callbacks.splice(index, 1)
        }
      }
    }
  }

  /**
   * Subscriber'ları bilgilendir
   */
  notifySubscribers(symbol, priceData) {
    const callbacks = this.subscribers.get(symbol)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(priceData)
        } catch (error) {
        }
      })
    }
  }

  /**
   * WebSocket bağlantısını kapat
   */
  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
      this.subscribers.clear()
    }
  }

  /**
   * Bağlantı durumunu kontrol et
   */
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN
  }

  /**
   * Testnet/Mainnet modunu değiştir
   */
  setTestnet(isTestnet) {
    this.isTestnet = isTestnet
  }

  /**
   * Candlestick (Kline) WebSocket bağlantısı başlat
   * @param {string} symbol - Coin symbol (BTCUSDT)
   * @param {string} interval - Zaman aralığı (1m, 3m, 5m, 15m, 30m, 1h, 4h, 1d)
   */
  connectKline(symbol, interval = '1m') {
    // Eğer zaten bağlantı varsa, tekrar bağlanma
    if (this.wsKline && this.wsKline.readyState === WebSocket.OPEN) {
      return
    }

    const stream = `${symbol.toLowerCase()}@kline_${interval}`
    const baseUrl = 'wss://stream.binance.com:9443/ws'
    const url = `${baseUrl}/${stream}`

    this.wsKline = new WebSocket(url)

    this.wsKline.onopen = () => {
      console.log('📊 Candlestick WebSocket bağlandı:', symbol, interval)
    }

    this.wsKline.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.e === 'kline' && data.k) {
          const kline = data.k
          const symbol = kline.s

          // Candlestick data
          const candleData = {
            symbol: symbol,
            time: kline.t / 1000, // Lightweight Charts saniye cinsinden ister
            open: parseFloat(kline.o),
            high: parseFloat(kline.h),
            low: parseFloat(kline.l),
            close: parseFloat(kline.c),
            volume: parseFloat(kline.v),
            isClosed: kline.x, // Mum kapandı mı?
            timestamp: kline.T
          }

          // Kline subscriber'larına bildir
          this.notifyKlineSubscribers(symbol, candleData)
        }
      } catch (error) {
        console.error('Kline WS parse error:', error)
      }
    }

    this.wsKline.onerror = (error) => {
      console.error('❌ Kline WebSocket hatası:', error)
    }

    this.wsKline.onclose = () => {
      console.log('Kline WebSocket kapandı')
      // Yeniden bağlanma için handleReconnect kullanılabilir
    }
  }

  /**
   * Candlestick güncellemeleri için abone ol
   * @param {string} symbol - Coin symbol (BTCUSDT)
   * @param {Function} callback - Candlestick güncellendiğinde çağrılacak fonksiyon
   * @returns {Function} Unsubscribe fonksiyonu
   */
  subscribeKline(symbol, callback) {
    if (!this.klineSubscribers.has(symbol)) {
      this.klineSubscribers.set(symbol, [])
    }

    this.klineSubscribers.get(symbol).push(callback)

    // Unsubscribe fonksiyonu döndür
    return () => {
      const callbacks = this.klineSubscribers.get(symbol)
      if (callbacks) {
        const index = callbacks.indexOf(callback)
        if (index > -1) {
          callbacks.splice(index, 1)
        }
      }
    }
  }

  /**
   * Kline subscriber'larını bilgilendir
   */
  notifyKlineSubscribers(symbol, candleData) {
    const callbacks = this.klineSubscribers.get(symbol)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(candleData)
        } catch (error) {
          console.error('Kline callback error:', error)
        }
      })
    }
  }

  /**
   * Candlestick WebSocket bağlantısını kapat
   */
  disconnectKline() {
    if (this.wsKline) {
      this.wsKline.close()
      this.wsKline = null
      this.klineSubscribers.clear()
    }
  }
}

// Singleton instance
const binanceWS = new BinanceWebSocketService()

export default binanceWS
