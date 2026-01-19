/**
 * Bot Manager Service
 * Singleton pattern - Tüm app'te tek instance
 * Sayfa değişse bile bot çalışmaya devam eder
 */

import binanceWS from './binanceWebSocket'
import tradeLogger from './tradeLogger'

class BotManager {
  constructor() {
    this.bots = new Map() // botId -> bot instance
    this.isInitialized = false
    this.storageKey = 'safedream_bot_state'
  }

  /**
   * Manager'ı başlat - App açılırken bir kez çağrılır
   */
  initialize() {
    if (this.isInitialized) return

    // console.log('🤖 Bot Manager başlatılıyor...')

    // LocalStorage'dan kayıtlı bot'ları yükle
    this.loadBotsFromStorage()

    // WebSocket'i başlat
    binanceWS.setTestnet(true)

    this.isInitialized = true
    // console.log('✅ Bot Manager hazır')
  }

  /**
   * LocalStorage'dan bot state'lerini yükle
   */
  loadBotsFromStorage() {
    try {
      const savedState = localStorage.getItem(this.storageKey)
      if (!savedState) return

      const state = JSON.parse(savedState)

      // Her kayıtlı bot'u yeniden başlat
      Object.entries(state.bots || {}).forEach(([botId, botData]) => {
        if (botData.isRunning) {
          // console.log(`🔄 Bot yeniden başlatılıyor: ${botId}`)
          this.restoreBot(botId, botData)
        }
      })

      // console.log(`📂 ${Object.keys(state.bots || {}).length} bot yüklendi`)
    } catch (error) {
      console.error('Bot yükleme hatası:', error)
    }
  }

  /**
   * Bot state'ini localStorage'a kaydet
   */
  saveBotState(botId, botData) {
    try {
      const currentState = JSON.parse(localStorage.getItem(this.storageKey) || '{"bots":{}}')

      currentState.bots = currentState.bots || {}

      // ✅ Tüm trading state'ini kaydet
      currentState.bots[botId] = {
        ...botData,
        buyPrice: botData.buyPrice || null,
        buyQuantity: botData.buyQuantity || null,
        maxPriceSinceBuy: botData.maxPriceSinceBuy || null,
        trailingStopPrice: botData.trailingStopPrice || null,
        tradeStatus: botData.tradeStatus || 'IDLE',
        lastSaved: Date.now()
      }

      localStorage.setItem(this.storageKey, JSON.stringify(currentState))
    } catch (error) {
      console.error('Bot kaydetme hatası:', error)
    }
  }

  /**
   * Yeni bot oluştur
   */
  createBot(config) {
    const botId = `bot_${config.symbol}_${Date.now()}`

    // ✅ NaN değerlerini temizle, default değerler kullan
    const settings = {
      buyThreshold: !isNaN(config.settings?.buyThreshold) ? config.settings.buyThreshold : -0.5,
      sellThreshold: !isNaN(config.settings?.sellThreshold) ? config.settings.sellThreshold : 0.5,
      tradeAmount: !isNaN(config.settings?.tradeAmount) ? config.settings.tradeAmount : 10,

      // 🛡️ Risk Yönetimi
      stopLoss: !isNaN(config.settings?.stopLoss) ? config.settings.stopLoss : -2.0, // %2 zarar dur

      // 📈 Trailing Stop-Loss
      trailingActivation: !isNaN(config.settings?.trailingActivation) ? config.settings.trailingActivation : 0.3, // %0.3'te başla
      trailingDistance: !isNaN(config.settings?.trailingDistance) ? config.settings.trailingDistance : 0.2, // %0.2 mesafe

      // ⚡ Breakeven
      breakEvenTrigger: !isNaN(config.settings?.breakEvenTrigger) ? config.settings.breakEvenTrigger : 0.5 // %0.5'te breakeven
    }

    const bot = {
      id: botId,
      symbol: config.symbol,
      strategy: config.strategy,
      isRunning: false,
      settings: settings,
      stats: {
        totalTrades: 0,
        successfulTrades: 0,
        totalProfit: 0,
        startTime: null,
      },
      logs: [],
      priceHistory: [],
      buyPrice: null, // ✅ Alış fiyatı
      buyQuantity: null, // ✅ Alınan coin miktarı
      maxPriceSinceBuy: null, // 📊 Alış sonrası en yüksek fiyat
      trailingStopPrice: null, // 🎯 Trailing stop fiyatı
      tradeStatus: 'IDLE', // IDLE | WAITING_FOR_PROFIT | BREAKEVEN | TRAILING
      createdAt: Date.now(),
    }

    this.bots.set(botId, bot)
    this.saveBotState(botId, bot)

    return botId
  }

  /**
   * Bot'u başlat
   */
  async startBot(botId, callbacks = {}) {
    const bot = this.bots.get(botId)
    if (!bot) {
      throw new Error('Bot bulunamadı')
    }

    if (bot.isRunning) {
      // console.log('⚠️ Bot zaten çalışıyor')
      return
    }

    // console.log(`▶️ Bot başlatılıyor: ${botId}`)

    // Bot durumunu güncelle
    bot.isRunning = true
    bot.stats.startTime = Date.now()

    // WebSocket'e abone ol
    bot.unsubscribe = binanceWS.subscribe(bot.symbol, (priceData) => {
      this.handlePriceUpdate(botId, priceData, callbacks)
    })

    // WebSocket'i başlat (henüz başlatılmadıysa)
    if (!binanceWS.isConnected()) {
      const symbols = Array.from(this.bots.values())
        .filter(b => b.isRunning)
        .map(b => b.symbol)

      binanceWS.connect(symbols)
    }

    // State'i kaydet
    this.saveBotState(botId, bot)

    // Callback
    if (callbacks.onStart) {
      callbacks.onStart(bot)
    }
  }

  /**
   * Bot'u durdur
   */
  stopBot(botId, callbacks = {}) {
    const bot = this.bots.get(botId)
    if (!bot) return

    // console.log(`⏹️ Bot durduruluyor: ${botId}`)

    bot.isRunning = false

    // WebSocket aboneliğini iptal et
    if (bot.unsubscribe) {
      bot.unsubscribe()
      bot.unsubscribe = null
    }

    // State'i kaydet
    this.saveBotState(botId, bot)

    // Callback
    if (callbacks.onStop) {
      callbacks.onStop(bot)
    }
  }

  /**
   * Fiyat güncellendiğinde çağrılır
   */
  handlePriceUpdate(botId, priceData, callbacks = {}) {
    const bot = this.bots.get(botId)
    if (!bot || !bot.isRunning) return

    // Fiyat geçmişine ekle
    bot.priceHistory.push({
      price: priceData.price,
      timestamp: Date.now(),
      priceChangePercent: priceData.priceChangePercent
    })

    // Son 100 fiyatı tut
    if (bot.priceHistory.length > 100) {
      bot.priceHistory = bot.priceHistory.slice(-100)
    }

    // Strateji çalıştır
    this.runStrategy(botId, priceData, callbacks)

    // Her 10 fiyat güncellemesinde bir kaydet (performans için)
    if (bot.priceHistory.length % 10 === 0) {
      this.saveBotState(botId, bot)
    }

    // Callback
    if (callbacks.onPriceUpdate) {
      callbacks.onPriceUpdate(priceData, bot)
    }
  }

  /**
   * Strateji mantığı
   */
  runStrategy(botId, priceData, callbacks = {}) {
    const bot = this.bots.get(botId)
    if (!bot || bot.priceHistory.length < 2) return

    const currentPrice = priceData.price
    const lastPrice = bot.priceHistory[bot.priceHistory.length - 2].price

    switch (bot.strategy) {
      case 'scalping':
        this.runScalpingStrategy(bot, currentPrice, lastPrice, callbacks)
        break
      case 'grid':
        this.runGridStrategy(bot, currentPrice, callbacks)
        break
      case 'dca':
        this.runDcaStrategy(bot, currentPrice, callbacks)
        break
    }
  }

  /**
   * Scalping stratejisi (Gelişmiş - Stop-Loss, Trailing, Breakeven)
   */
  runScalpingStrategy(bot, currentPrice, lastPrice, callbacks) {
    const priceChange = ((currentPrice - lastPrice) / lastPrice) * 100
    const {
      buyThreshold,
      sellThreshold,
      tradeAmount,
      stopLoss,
      trailingActivation,
      trailingDistance,
      breakEvenTrigger
    } = bot.settings

    // ========================================
    // AŞAMA 1: ALIM SİNYALİ
    // ========================================
    if (priceChange <= buyThreshold && !bot.buyPrice) {
      const quantity = tradeAmount / currentPrice

      bot.buyPrice = currentPrice
      bot.buyQuantity = quantity
      bot.maxPriceSinceBuy = currentPrice
      bot.trailingStopPrice = currentPrice * (1 + stopLoss / 100) // İlk stop-loss
      bot.tradeStatus = 'WAITING_FOR_PROFIT'

      this.addLog(bot.id, `📥 ALIM: $${currentPrice.toFixed(4)} (${priceChange.toFixed(2)}%) | Stop: $${bot.trailingStopPrice.toFixed(4)}`, 'buy')

      if (callbacks.onTrade) {
        callbacks.onTrade({
          botId: bot.id,
          symbol: bot.symbol,
          type: 'BUY',
          price: currentPrice,
          quantity: quantity,
          amount: tradeAmount,
          strategy: bot.strategy,
          settings: bot.settings
        })
      }

      this.saveBotState(bot.id, bot)
      return
    }

    // ========================================
    // AŞAMA 2: POSİSYON YÖNETİMİ
    // ========================================
    if (bot.buyPrice && bot.buyQuantity) {
      const profitPercent = ((currentPrice - bot.buyPrice) / bot.buyPrice) * 100

      // En yüksek fiyatı güncelle
      if (currentPrice > bot.maxPriceSinceBuy) {
        bot.maxPriceSinceBuy = currentPrice
      }

      // ----------------------------------------
      // 2.1: STOP-LOSS KONTROLÜ (Zarar durdur)
      // ----------------------------------------
      if (profitPercent <= stopLoss) {
        this.executeSell(bot, currentPrice, profitPercent, 'STOP-LOSS', callbacks)
        return
      }

      // ----------------------------------------
      // 2.2: BREAKEVEN AKTIVASYONU
      // ----------------------------------------
      if (bot.tradeStatus === 'WAITING_FOR_PROFIT' && profitPercent >= breakEvenTrigger) {
        bot.trailingStopPrice = bot.buyPrice // Stop-loss'u giriş fiyatına çek
        bot.tradeStatus = 'BREAKEVEN'
        this.addLog(bot.id, `🛡️ BREAKEVEN Aktif! Stop: $${bot.trailingStopPrice.toFixed(4)} (Artık zarar yok!)`, 'info')
        this.saveBotState(bot.id, bot)
      }

      // ----------------------------------------
      // 2.3: TRAILING STOP-LOSS AKTIVASYONU
      // ----------------------------------------
      if (bot.tradeStatus === 'BREAKEVEN' && profitPercent >= trailingActivation) {
        bot.tradeStatus = 'TRAILING'
        this.addLog(bot.id, `📈 TRAILING Aktif! En yüksek: $${bot.maxPriceSinceBuy.toFixed(4)}`, 'info')
      }

      // ----------------------------------------
      // 2.4: TRAILING STOP-LOSS GÜNCELLEME
      // ----------------------------------------
      if (bot.tradeStatus === 'TRAILING') {
        const newTrailingStop = bot.maxPriceSinceBuy * (1 - trailingDistance / 100)

        // Trailing stop yükselirse güncelle (asla düşürme!)
        if (newTrailingStop > bot.trailingStopPrice) {
          const oldStop = bot.trailingStopPrice
          bot.trailingStopPrice = newTrailingStop
          this.addLog(
            bot.id,
            `⬆️ Trailing güncellendi: $${oldStop.toFixed(4)} → $${newTrailingStop.toFixed(4)} | Max: $${bot.maxPriceSinceBuy.toFixed(4)}`,
            'info'
          )
          this.saveBotState(bot.id, bot)
        }

        // Trailing stop tetiklendi mi?
        if (currentPrice <= bot.trailingStopPrice) {
          this.executeSell(bot, currentPrice, profitPercent, 'TRAILING-STOP', callbacks)
          return
        }
      }

      // ----------------------------------------
      // 2.5: TAKİP EDİLEN BREAKEVEN STOP
      // ----------------------------------------
      if (bot.tradeStatus === 'BREAKEVEN') {
        if (currentPrice <= bot.trailingStopPrice) {
          this.executeSell(bot, currentPrice, profitPercent, 'BREAKEVEN-STOP', callbacks)
          return
        }
      }

      // ----------------------------------------
      // 2.6: TAKİP EDİLMEYEN NORMAL KAR HEDEF
      // ----------------------------------------
      if (bot.tradeStatus === 'WAITING_FOR_PROFIT' && profitPercent >= sellThreshold) {
        this.executeSell(bot, currentPrice, profitPercent, 'TAKE-PROFIT', callbacks)
        return
      }
    }
  }

  /**
   * Satış işlemini gerçekleştir
   */
  executeSell(bot, currentPrice, profitPercent, reason, callbacks) {
    const buyPrice = bot.buyPrice
    const quantity = bot.buyQuantity
    const profit = (currentPrice - buyPrice) * quantity

    bot.stats.totalTrades++
    if (profit > 0) {
      bot.stats.successfulTrades++
    }
    bot.stats.totalProfit += profit

    // Log mesajı
    const emoji = profit >= 0 ? '✅' : '❌'
    const reasonText = {
      'STOP-LOSS': '🛑 STOP-LOSS',
      'BREAKEVEN-STOP': '🔄 BREAKEVEN',
      'TRAILING-STOP': '📉 TRAILING',
      'TAKE-PROFIT': '🎯 KAR AL'
    }[reason] || reason

    this.addLog(
      bot.id,
      `${emoji} SATIM (${reasonText}): $${currentPrice.toFixed(4)} | Kar: $${profit.toFixed(2)} (${profitPercent.toFixed(2)}%)`,
      profit >= 0 ? 'sell' : 'error'
    )

    // Callback
    if (callbacks.onTrade) {
      callbacks.onTrade({
        botId: bot.id,
        symbol: bot.symbol,
        type: 'SELL',
        price: currentPrice,
        quantity: quantity,
        amount: quantity * currentPrice,
        profit: profit,
        reason: reason,
        strategy: bot.strategy,
        settings: bot.settings
      })
    }

    // Reset bot state
    bot.buyPrice = null
    bot.buyQuantity = null
    bot.maxPriceSinceBuy = null
    bot.trailingStopPrice = null
    bot.tradeStatus = 'IDLE'

    this.saveBotState(bot.id, bot)
  }

  /**
   * Grid stratejisi (basit versiyon)
   */
  runGridStrategy(bot, currentPrice, callbacks) {
    // TODO: Grid mantığı
  }

  /**
   * DCA stratejisi
   */
  runDcaStrategy(bot, currentPrice, callbacks) {
    // TODO: DCA mantığı
  }

  /**
   * Log ekle
   */
  addLog(botId, message, type = 'info') {
    const bot = this.bots.get(botId)
    if (!bot) return

    const log = {
      timestamp: Date.now(),
      time: new Date().toLocaleTimeString('tr-TR'),
      message,
      type
    }

    bot.logs.unshift(log)

    // Son 100 log'u tut
    if (bot.logs.length > 100) {
      bot.logs = bot.logs.slice(0, 100)
    }
  }

  /**
   * Bot'u kayıttan yeniden yükle
   */
  restoreBot(botId, botData) {
    this.bots.set(botId, {
      ...botData,
      buyPrice: botData.buyPrice || null,
      buyQuantity: botData.buyQuantity || null,
      maxPriceSinceBuy: botData.maxPriceSinceBuy || null,
      trailingStopPrice: botData.trailingStopPrice || null,
      tradeStatus: botData.tradeStatus || 'IDLE',
      unsubscribe: null // WebSocket callback'i yeniden oluşturulacak
    })

    // Eğer bot çalışıyorsa, yeniden başlat
    if (botData.isRunning) {
      this.startBot(botId)
    }
  }

  /**
   * Bot bilgilerini al
   */
  getBot(botId) {
    return this.bots.get(botId)
  }

  /**
   * Tüm bot'ları listele
   */
  getAllBots() {
    return Array.from(this.bots.values())
  }

  /**
   * Bot'u sil
   */
  deleteBot(botId) {
    const bot = this.bots.get(botId)
    if (!bot) return

    // Çalışıyorsa durdur
    if (bot.isRunning) {
      this.stopBot(botId)
    }

    // Map'ten sil
    this.bots.delete(botId)

    // Storage'dan sil
    try {
      const currentState = JSON.parse(localStorage.getItem(this.storageKey) || '{"bots":{}}')
      delete currentState.bots[botId]
      localStorage.setItem(this.storageKey, JSON.stringify(currentState))
    } catch (error) {
      console.error('Bot silme hatası:', error)
    }
  }

  /**
   * Tüm işlem geçmişini JSON olarak export et
   */
  exportBotHistory(botId) {
    const bot = this.bots.get(botId)
    if (!bot) return null

    return {
      bot: {
        id: bot.id,
        symbol: bot.symbol,
        strategy: bot.strategy,
        settings: bot.settings,
        createdAt: bot.createdAt
      },
      stats: bot.stats,
      logs: bot.logs,
      priceHistory: bot.priceHistory,
      exportedAt: Date.now()
    }
  }
}

// Singleton instance
const botManager = new BotManager()

export default botManager
