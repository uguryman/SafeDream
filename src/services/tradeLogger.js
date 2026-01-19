/**
 * Trade Logger Service
 * Tüm bot işlemlerini kaydeder ve JSON export eder
 */

class TradeLogger {
  constructor() {
    this.storageKey = 'safedream_trade_history'
    this.maxTrades = 1000 // Son 1000 işlem
  }

  /**
   * Bot başlatma kaydı
   */
  logBotStart(botInfo) {
    const history = this.getHistory()

    const startRecord = {
      id: `start_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      datetime: new Date().toISOString(),
      type: 'BOT_START',
      botId: botInfo.botId,
      symbol: botInfo.symbol,
      strategy: botInfo.strategy,
      settings: botInfo.settings,
      message: `Bot başlatıldı: ${botInfo.symbol} - ${botInfo.strategy.toUpperCase()}`
    }

    if (!history.botEvents) {
      history.botEvents = []
    }

    history.botEvents.unshift(startRecord)

    // Son 500 event
    if (history.botEvents.length > 500) {
      history.botEvents = history.botEvents.slice(0, 500)
    }

    history.lastUpdate = Date.now()
    this.saveHistory(history)

    console.log('🚀 Bot başlatma kaydedildi:', startRecord)

    return startRecord
  }

  /**
   * Bot durdurma kaydı
   */
  logBotStop(botInfo) {
    const history = this.getHistory()

    const stopRecord = {
      id: `stop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      datetime: new Date().toISOString(),
      type: 'BOT_STOP',
      botId: botInfo.botId,
      symbol: botInfo.symbol,
      strategy: botInfo.strategy,
      stats: botInfo.stats,
      message: `Bot durduruldu: ${botInfo.symbol} - ${botInfo.stats.totalTrades} işlem`
    }

    if (!history.botEvents) {
      history.botEvents = []
    }

    history.botEvents.unshift(stopRecord)

    // Son 500 event
    if (history.botEvents.length > 500) {
      history.botEvents = history.botEvents.slice(0, 500)
    }

    history.lastUpdate = Date.now()
    this.saveHistory(history)

    console.log('🛑 Bot durdurma kaydedildi:', stopRecord)

    return stopRecord
  }

  /**
   * İşlem kaydet
   */
  logTrade(trade) {
    const history = this.getHistory()

    const tradeRecord = {
      id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      datetime: new Date().toISOString(),
      botId: trade.botId,
      symbol: trade.symbol,
      type: trade.type, // 'BUY' | 'SELL'
      status: trade.status, // 'success' | 'failed'
      price: trade.price,
      quantity: trade.quantity,
      amount: trade.amount, // Total USDT
      profit: trade.profit || 0,
      error: trade.error || null,
      strategy: trade.strategy,
      settings: trade.settings
    }

    history.trades.unshift(tradeRecord) // En yeni en üstte

    // Son N işlemi tut
    if (history.trades.length > this.maxTrades) {
      history.trades = history.trades.slice(0, this.maxTrades)
    }

    // İstatistikleri güncelle
    history.stats.totalTrades++
    if (trade.status === 'success') {
      history.stats.successfulTrades++
      history.stats.totalProfit += (trade.profit || 0)
    } else {
      history.stats.failedTrades++
    }

    history.lastUpdate = Date.now()

    // LocalStorage'a kaydet
    this.saveHistory(history)

    console.log('📝 İşlem kaydedildi:', tradeRecord)

    return tradeRecord
  }

  /**
   * Hata kaydet
   */
  logError(error) {
    const history = this.getHistory()

    const errorRecord = {
      id: `error_${Date.now()}`,
      timestamp: Date.now(),
      datetime: new Date().toISOString(),
      type: 'ERROR',
      message: error.message,
      botId: error.botId,
      symbol: error.symbol,
      details: error.details
    }

    if (!history.errors) {
      history.errors = []
    }

    history.errors.unshift(errorRecord)

    // Son 100 hata
    if (history.errors.length > 100) {
      history.errors = history.errors.slice(0, 100)
    }

    history.lastUpdate = Date.now()

    this.saveHistory(history)

    console.log('❌ Hata kaydedildi:', errorRecord)

    return errorRecord
  }

  /**
   * Geçmişi al
   */
  getHistory() {
    try {
      const data = localStorage.getItem(this.storageKey)
      if (data) {
        return JSON.parse(data)
      }
    } catch (error) {
      console.error('Trade history yükleme hatası:', error)
    }

    // Varsayılan yapı
    return {
      trades: [],
      errors: [],
      stats: {
        totalTrades: 0,
        successfulTrades: 0,
        failedTrades: 0,
        totalProfit: 0
      },
      lastUpdate: null
    }
  }

  /**
   * Geçmişi kaydet (LocalStorage + JSON dosyası)
   */
  saveHistory(history) {
    try {
      // LocalStorage'a kaydet
      localStorage.setItem(this.storageKey, JSON.stringify(history))

      // JSON dosyasına da kaydet (otomatik güncelleme)
      this.saveToFile(history)
    } catch (error) {
      console.error('Trade history kaydetme hatası:', error)
    }
  }

  /**
   * JSON dosyasına kaydet (src/config/botTrades.json)
   */
  async saveToFile(history) {
    try {
      // Browser'da dosya sistemine direkt yazamayız
      // Bunun yerine: Her kayıtta otomatik download yapabiliriz
      // VEYA: Backend API kullanabiliriz

      // ÇÖ ZÜM 1: Otomatik download (her 10 işlemde bir)
      if (history.trades.length % 10 === 0) {
        const blob = new Blob([JSON.stringify(history, null, 2)], {
          type: 'application/json'
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'botTrades.json'
        // a.click() // Bu satırı aç otomatik indirsin
        URL.revokeObjectURL(url)
      }

      // ÇÖZÜM 2: Backend'e gönder (daha iyi)
      // await fetch('/api/save-trades', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(history)
      // })

    } catch (error) {
      console.error('JSON dosyasına kaydetme hatası:', error)
    }
  }

  /**
   * Belirli bir bot'un işlemlerini getir
   */
  getBotTrades(botId) {
    const history = this.getHistory()
    return history.trades.filter(t => t.botId === botId)
  }

  /**
   * Belirli bir symbol'ün işlemlerini getir
   */
  getSymbolTrades(symbol) {
    const history = this.getHistory()
    return history.trades.filter(t => t.symbol === symbol)
  }

  /**
   * JSON export
   */
  exportToJSON() {
    const history = this.getHistory()

    const exportData = {
      exportDate: new Date().toISOString(),
      ...history
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `safedream_trades_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)

    console.log('📥 Trade history indirildi')
  }

  /**
   * CSV export
   */
  exportToCSV() {
    const history = this.getHistory()

    const csvRows = [
      ['ID', 'Timestamp', 'Bot ID', 'Symbol', 'Type', 'Status', 'Price', 'Quantity', 'Amount', 'Profit', 'Error'].join(',')
    ]

    history.trades.forEach(trade => {
      const row = [
        trade.id,
        trade.datetime,
        trade.botId,
        trade.symbol,
        trade.type,
        trade.status,
        trade.price,
        trade.quantity,
        trade.amount,
        trade.profit || 0,
        trade.error || ''
      ].join(',')

      csvRows.push(row)
    })

    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `safedream_trades_${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)

    console.log('📊 CSV indirildi')
  }

  /**
   * İstatistikler
   */
  getStats() {
    const history = this.getHistory()
    return history.stats
  }

  /**
   * Temizle
   */
  clear() {
    localStorage.removeItem(this.storageKey)
    console.log('🗑️ Trade history temizlendi')
  }
}

// Singleton instance
const tradeLogger = new TradeLogger()

export default tradeLogger
