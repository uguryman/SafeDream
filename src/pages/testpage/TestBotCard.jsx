import { useState, useEffect } from 'react'
import { useCreateTestOrderMutation, useGetExchangeInfoQuery } from '../../store/api/binanceTestnetApi'
import { useToast } from '../../components/Toast'
import { getCoinOptions } from '../../config/coins'
import botManager from '../../services/botManager'
import tradeLogger from '../../services/tradeLogger'
import { useBinanceWebSocket } from '../../hooks/useBinanceWebSocket'
import BotChartModal from '../../components/BotChartModal'

/**
 * Test Bot Kartı Komponenti
 * Bot Manager ile entegre - Sayfa değişse bile çalışır
 */
function TestBotCard() {
  // Bot ID (her component instance için unique)
  const [botId, setBotId] = useState(null)

  // Bot Ayarları
  const [selectedCoin, setSelectedCoin] = useState('BTCUSDT')
  const [strategy, setStrategy] = useState('scalping')
  const [showStrategyInfo, setShowStrategyInfo] = useState(false)
  const [selectedStrategyInfo, setSelectedStrategyInfo] = useState(null)

  // Scalping Ayarları
  const [scalpingBuyThreshold, setScalpingBuyThreshold] = useState(-0.5)
  const [scalpingSellThreshold, setScalpingSellThreshold] = useState(0.5)
  const [tradeAmount, setTradeAmount] = useState('10')

  // 🛡️ Risk Yönetimi Ayarları
  const [stopLoss, setStopLoss] = useState(-2.0) // %2 zarar dur
  const [trailingActivation, setTrailingActivation] = useState(0.3) // %0.3'te trailing başla
  const [trailingDistance, setTrailingDistance] = useState(0.2) // %0.2 mesafe
  const [breakEvenTrigger, setBreakEvenTrigger] = useState(0.5) // %0.5'te breakeven

  // Bot State (botManager'dan gelecek)
  const [botState, setBotState] = useState(null)
  const [isRunning, setIsRunning] = useState(false)

  // Grafik Modal
  const [showChartModal, setShowChartModal] = useState(false)

  // WebSocket fiyat takibi
  const { price, priceData, isConnected } = useBinanceWebSocket(selectedCoin, isRunning)

  // API Hooks
  const { success, error: showError } = useToast()
  const [createOrder] = useCreateTestOrderMutation()
  const { data: exchangeInfo } = useGetExchangeInfoQuery(selectedCoin)

  // Strateji Açıklamaları
  const strategyInfoData = {
    scalping: {
      title: '⚡ Scalping (Kısa Vadeli)',
      description: 'Çok kısa sürede küçük kar marjlarıyla hızlı alım-satım yapmak',
      howItWorks: [
        'Fiyat belirlediğin % düşerse otomatik ALIR',
        'Aldığın fiyattan belirlediğin % yükselirse otomatik SATAR',
        'Küçük kar marjları ama çok sık işlem',
        'Günde onlarca işlem yapabilir'
      ],
      example: 'Bitcoin $95,000\n↓ Düşer $94,525 (-0.5%) → BOT ALIR\n↑ Çıkar $95,000 (+0.5%) → BOT SATAR\nKar: $475 ✅',
      pros: 'Hızlı kar, düşük risk',
      cons: 'Çok işlem = çok komisyon'
    },
    grid: {
      title: '📊 Grid Trading (Izgara)',
      description: 'Fiyat aralığında birden fazla seviyede otomatik alım-satım',
      howItWorks: [
        'Bir fiyat aralığı belirlersin (örn: ±2%)',
        'Bu aralığı seviyelere bölersin (örn: 5 seviye)',
        'Her seviyede otomatik al-sat emri koyar',
        'Fiyat yukarı-aşağı gidip gelirken sürekli kar eder'
      ],
      example: 'Bitcoin $95,000 - 5 seviye (±2%)\n\nSeviye 1: $93,100 → AL\nSeviye 2: $94,050 → AL\nSeviye 3: $95,000 → --\nSeviye 4: $95,950 → SAT\nSeviye 5: $96,900 → SAT',
      pros: 'Yan piyasalarda (yatay) çok karlı',
      cons: 'Trend piyasalarda (tek yön) zor'
    },
    dca: {
      title: '💵 DCA (Ortalama Maliyet)',
      description: 'Belirli aralıklarla sürekli küçük miktarda alım yapmak',
      howItWorks: [
        'Belirlediğin sürede bir (örn: 60 saniye) belirli tutar alır',
        'Fiyat düşükse daha fazla, yüksekse daha az coin alırsın',
        'Zamanla ortalama maliyetin düşer',
        'Satış yapmazsın, sadece birikim'
      ],
      example: 'Gün 1: $95,000 den $10 → 0.000105 BTC\nGün 2: $94,000 den $10 → 0.000106 BTC\nGün 3: $96,000 den $10 → 0.000104 BTC\n\nOrtalama: $95,000 ✅',
      pros: 'Piyasa zamanlaması gerektirmez, uzun vadeli',
      cons: 'Yavaş, satış stratejisi yok'
    }
  }

  // Component mount - Var olan bot'u yükle veya yeni oluştur
  useEffect(() => {
    // ✅ Zaten bir botId varsa, tekrar oluşturma (StrictMode double-mount koruması)
    if (botId) return

    // LocalStorage'dan çalışan bir bot var mı kontrol et
    const existingBots = botManager.getAllBots()
    const runningBot = existingBots.find(b => b.isRunning)

    if (runningBot) {
      // Çalışan bot varsa, onun ayarlarını yükle
      setBotId(runningBot.id)
      setBotState(runningBot)
      setIsRunning(true)
      setSelectedCoin(runningBot.symbol) // ✅ Coin'i güncelle
      setStrategy(runningBot.strategy) // ✅ Stratejiyi güncelle

      // ✅ NaN kontrolü ile ayarları yükle
      const buyThreshold = !isNaN(runningBot.settings.buyThreshold) ? runningBot.settings.buyThreshold : -0.5
      const sellThreshold = !isNaN(runningBot.settings.sellThreshold) ? runningBot.settings.sellThreshold : 0.5
      const amount = !isNaN(runningBot.settings.tradeAmount) ? runningBot.settings.tradeAmount : 10

      setScalpingBuyThreshold(buyThreshold)
      setScalpingSellThreshold(sellThreshold)
      setTradeAmount(amount.toString())

      // Risk yönetimi ayarlarını yükle
      if (runningBot.settings.stopLoss !== undefined) setStopLoss(runningBot.settings.stopLoss)
      if (runningBot.settings.trailingActivation !== undefined) setTrailingActivation(runningBot.settings.trailingActivation)
      if (runningBot.settings.trailingDistance !== undefined) setTrailingDistance(runningBot.settings.trailingDistance)
      if (runningBot.settings.breakEvenTrigger !== undefined) setBreakEvenTrigger(runningBot.settings.breakEvenTrigger)
      console.log('📂 Çalışan bot yüklendi:', runningBot.id, runningBot.symbol)
    } else {
      // Çalışan bot yoksa, son oluşturulan durdurulmuş bot'u kullan veya yeni oluştur
      const lastBot = existingBots[existingBots.length - 1]

      if (lastBot && !lastBot.isRunning) {
        // Son bot varsa onu kullan
        setBotId(lastBot.id)
        setBotState(lastBot)
        console.log('📂 Mevcut bot yüklendi:', lastBot.id)
      } else {
        // Hiç bot yoksa yeni oluştur
        const newBotId = botManager.createBot({
          symbol: selectedCoin,
          strategy: strategy,
          settings: {
            buyThreshold: scalpingBuyThreshold,
            sellThreshold: scalpingSellThreshold,
            tradeAmount: parseFloat(tradeAmount),
            stopLoss: stopLoss,
            trailingActivation: trailingActivation,
            trailingDistance: trailingDistance,
            breakEvenTrigger: breakEvenTrigger
          }
        })
        setBotId(newBotId)
        console.log('🆕 Yeni bot oluşturuldu:', newBotId)
      }
    }
  }, []) // Sadece ilk render'da çalış

  // Bot state'ini periyodik olarak güncelle
  useEffect(() => {
    if (!botId) return

    const interval = setInterval(() => {
      const bot = botManager.getBot(botId)
      if (bot) {
        setBotState(bot)

        // ✅ SADECE BOT ÇALIŞIYORKEN ayarları senkronize et
        // Bot durduysa kullanıcı değiştirebilir
        if (bot.isRunning) {
          // Bot ayarlarını UI'a senkronize et
          if (bot.symbol !== selectedCoin) {
            setSelectedCoin(bot.symbol)
          }
          if (bot.strategy !== strategy) {
            setStrategy(bot.strategy)
          }
          // Scalping ayarları - NaN kontrolü ile
          if (bot.settings) {
            const buyThreshold = !isNaN(bot.settings.buyThreshold) ? bot.settings.buyThreshold : scalpingBuyThreshold
            const sellThreshold = !isNaN(bot.settings.sellThreshold) ? bot.settings.sellThreshold : scalpingSellThreshold
            const amount = !isNaN(bot.settings.tradeAmount) ? bot.settings.tradeAmount : parseFloat(tradeAmount)

            if (buyThreshold !== scalpingBuyThreshold) {
              setScalpingBuyThreshold(buyThreshold)
            }
            if (sellThreshold !== scalpingSellThreshold) {
              setScalpingSellThreshold(sellThreshold)
            }
            if (amount !== parseFloat(tradeAmount)) {
              setTradeAmount(amount.toString())
            }
          }
        }
      }
    }, 500) // Her 500ms'de bir güncelle

    return () => clearInterval(interval)
  }, [botId, selectedCoin, strategy, scalpingBuyThreshold, scalpingSellThreshold, tradeAmount])

  // Strateji bilgisi göster
  const showStrategyInfoModal = (strategyType) => {
    setSelectedStrategyInfo(strategyInfoData[strategyType])
    setShowStrategyInfo(true)
  }

  // Bot Başlat/Durdur
  const toggleBot = async () => {
    if (!botId) return

    if (isRunning) {
      // Bot'u durdur
      const bot = botManager.getBot(botId)

      botManager.stopBot(botId, {
        onStop: () => {
          setIsRunning(false)

          // Bot durdurma kaydı
          if (bot) {
            tradeLogger.logBotStop({
              botId: bot.id,
              symbol: bot.symbol,
              strategy: bot.strategy,
              stats: bot.stats
            })
          }

          success('Bot durduruldu')
        }
      })
    } else {
      // Bot'u başlatmadan önce ayarları güncelle
      const bot = botManager.getBot(botId)
      if (bot) {
        bot.symbol = selectedCoin
        bot.strategy = strategy
        bot.settings = {
          buyThreshold: scalpingBuyThreshold,
          sellThreshold: scalpingSellThreshold,
          tradeAmount: parseFloat(tradeAmount),
          stopLoss: stopLoss,
          trailingActivation: trailingActivation,
          trailingDistance: trailingDistance,
          breakEvenTrigger: breakEvenTrigger
        }
        botManager.saveBotState(botId, bot)
      }

      // Bot'u başlat
      try {
        await botManager.startBot(botId, {
          onStart: (bot) => {
            setIsRunning(true)

            // Bot başlatma kaydı
            tradeLogger.logBotStart({
              botId: bot.id,
              symbol: bot.symbol,
              strategy: bot.strategy,
              settings: bot.settings
            })

            success(`Bot başlatıldı - ${strategy.toUpperCase()}`)
          },
          onPriceUpdate: (priceData, bot) => {
            // UI güncellemesi için state zaten periyodik olarak güncelleniyor
          },
          onTrade: async (trade) => {
            // Gerçek emir gönder (Binance Testnet)
            try {
              // Exchange info kontrolü
              if (!exchangeInfo) {
                throw new Error('Exchange info yüklenemedi')
              }

              const minQty = parseFloat(exchangeInfo.filters.minQty)
              const stepSize = parseFloat(exchangeInfo.filters.stepSize)
              const minNotional = parseFloat(exchangeInfo.filters.minNotional)

              // ✅ Quantity'yi LOT_SIZE kuralına göre yuvarla
              const roundToStepSize = (qty, step) => {
                const precision = step.toString().split('.')[1]?.length || 0
                return Math.floor(qty / step) * step
              }

              let quantity = roundToStepSize(trade.quantity, stepSize)

              // 8 haneye yuvarla (Binance max precision)
              quantity = parseFloat(quantity.toFixed(8))

              console.log('💰 Trade sinyali:', {
                symbol: trade.symbol,
                type: trade.type,
                price: trade.price,
                quantity: quantity,
                originalQty: trade.quantity,
                stepSize: stepSize,
                amount: trade.amount
              })

              if (quantity < minQty) {
                const error = `Miktar çok düşük: ${quantity} (Min: ${minQty})`
                console.warn('⚠️', error)

                // Hatayı logla ama bot'u DURDURMA
                tradeLogger.logError({
                  message: error,
                  botId: trade.botId,
                  symbol: trade.symbol,
                  details: { quantity, minQty, minNotional }
                })

                return // Bot çalışmaya devam etsin
              }

              if (trade.amount < minNotional) {
                const error = `Tutar çok düşük: $${trade.amount} (Min: $${minNotional})`
                console.warn('⚠️', error)

                tradeLogger.logError({
                  message: error,
                  botId: trade.botId,
                  symbol: trade.symbol,
                  details: { amount: trade.amount, minNotional }
                })

                return
              }

              // Emir gönder
              const orderData = {
                symbol: trade.symbol,
                side: trade.type,
                type: 'MARKET',
                quantity: quantity
              }

              const result = await createOrder(orderData).unwrap()

              console.log('✅ Emir başarılı:', result)

              // Başarılı işlemi logla
              tradeLogger.logTrade({
                ...trade,
                status: 'success',
                orderId: result.orderId
              })

              success(`${trade.type === 'BUY' ? '📥 Alım' : '📤 Satım'} başarılı!`)

            } catch (error) {
              console.error('❌ Emir hatası:', error)

              // Hatayı logla ama bot'u DURDURMA
              tradeLogger.logTrade({
                ...trade,
                status: 'failed',
                error: error?.data?.message || error.message || 'Bilinmeyen hata'
              })

              tradeLogger.logError({
                message: error?.data?.message || error.message,
                botId: trade.botId,
                symbol: trade.symbol,
                details: error
              })

              showError(`Emir hatası: ${error?.data?.message || 'Bilinmeyen hata'}`)

              // Bot çalışmaya devam etsin, bir sonraki fırsatı beklesin
            }
          }
        })
      } catch (error) {
        showError('Bot başlatma hatası')
        console.error(error)
      }
    }
  }

  // Export bot history
  const exportHistory = () => {
    if (!botId) return

    const history = botManager.exportBotHistory(botId)

    const blob = new Blob([JSON.stringify(history, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bot_${selectedCoin}_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)

    success('Bot geçmişi indirildi')
  }

  // Export all trades
  const exportAllTrades = () => {
    tradeLogger.exportToJSON()
    success('Tüm işlemler indirildi')
  }

  // İstatistikler
  const stats = botState?.stats || {
    totalTrades: 0,
    successfulTrades: 0,
    totalProfit: 0
  }
  const winRate = stats.totalTrades > 0
    ? ((stats.successfulTrades / stats.totalTrades) * 100).toFixed(1)
    : 0

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-6 hover:border-bitcoin/30 transition-all duration-300">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h3 className="text-white text-lg sm:text-xl font-bold flex items-center gap-2">
          <span className="text-xl sm:text-2xl">🤖</span>
          Trading Bot
        </h3>
        <div className="flex items-center gap-2">
          {/* WebSocket Durumu */}
          {isRunning && (
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}
                 title={isConnected ? 'WebSocket Bağlı' : 'WebSocket Bağlı Değil'}
            />
          )}
          {/* Bot Durumu */}
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            isRunning
              ? 'bg-green-500/20 text-green-400 border border-green-500/50'
              : 'bg-gray-500/20 text-gray-400 border border-gray-500/50'
          }`}>
            {isRunning ? '🟢 Aktif' : '🔴 Durduruldu'}
          </div>
        </div>
      </div>

      {/* Güncel Fiyat */}
      {price && isRunning && (
        <div className="mb-4 bg-black/30 border border-bitcoin/30 rounded-lg p-3">
          <p className="text-gray-400 text-xs mb-1">Anlık Fiyat (WebSocket)</p>
          <div className="flex items-baseline gap-2">
            <p className="text-white font-bold text-xl">
              ${parseFloat(price).toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
            </p>
            {priceData?.priceChangePercent && (
              <span className={`text-sm font-medium ${
                priceData.priceChangePercent >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {priceData.priceChangePercent >= 0 ? '+' : ''}{priceData.priceChangePercent.toFixed(2)}%
              </span>
            )}
          </div>
        </div>
      )}

      {/* İstatistikler */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="bg-black/30 border border-white/10 rounded-lg p-2 text-center">
          <p className="text-gray-400 text-xs mb-1">İşlem</p>
          <p className="text-white font-bold text-sm">{stats.totalTrades}</p>
        </div>
        <div className="bg-black/30 border border-white/10 rounded-lg p-2 text-center">
          <p className="text-gray-400 text-xs mb-1">Başarı</p>
          <p className="text-green-400 font-bold text-sm">{stats.successfulTrades}</p>
        </div>
        <div className="bg-black/30 border border-white/10 rounded-lg p-2 text-center">
          <p className="text-gray-400 text-xs mb-1">Oran</p>
          <p className="text-bitcoin font-bold text-sm">{winRate}%</p>
        </div>
        <div className="bg-black/30 border border-white/10 rounded-lg p-2 text-center">
          <p className="text-gray-400 text-xs mb-1">Kar</p>
          <p className={`font-bold text-sm ${stats.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ${stats.totalProfit.toFixed(2)}
          </p>
        </div>
      </div>

      {/* 🎯 Pozisyon Durumu */}
      {isRunning && botState && botState.buyPrice && (
        <div className="mb-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-white text-sm font-bold">📊 Pozisyon Durumu</p>
            <div className={`px-2 py-0.5 rounded text-xs font-medium ${
              botState.tradeStatus === 'IDLE' ? 'bg-gray-500/20 text-gray-400' :
              botState.tradeStatus === 'WAITING_FOR_PROFIT' ? 'bg-yellow-500/20 text-yellow-400' :
              botState.tradeStatus === 'BREAKEVEN' ? 'bg-blue-500/20 text-blue-400' :
              botState.tradeStatus === 'TRAILING' ? 'bg-green-500/20 text-green-400' :
              'bg-gray-500/20 text-gray-400'
            }`}>
              {botState.tradeStatus === 'IDLE' && '⏸️ Bekleme'}
              {botState.tradeStatus === 'WAITING_FOR_PROFIT' && '⏳ Kar Bekliyor'}
              {botState.tradeStatus === 'BREAKEVEN' && '🛡️ Breakeven'}
              {botState.tradeStatus === 'TRAILING' && '📈 Trailing Aktif'}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-gray-400">Alış Fiyatı</p>
              <p className="text-white font-mono">${botState.buyPrice?.toFixed(4)}</p>
            </div>
            {price && (
              <div>
                <p className="text-gray-400">Kar/Zarar</p>
                <p className={`font-mono font-bold ${
                  ((price - botState.buyPrice) / botState.buyPrice * 100) >= 0
                    ? 'text-green-400'
                    : 'text-red-400'
                }`}>
                  {((price - botState.buyPrice) / botState.buyPrice * 100).toFixed(2)}%
                </p>
              </div>
            )}
            {botState.buyQuantity && (
              <div>
                <p className="text-gray-400">Alınan Miktar</p>
                <p className="text-blue-400 font-mono">{botState.buyQuantity.toFixed(8)}</p>
                {botState.buyPrice && (
                  <p className="text-gray-500 text-[10px] font-mono mt-0.5">
                    ${(botState.buyQuantity * botState.buyPrice).toFixed(2)} USDT
                  </p>
                )}
              </div>
            )}
            {botState.trailingStopPrice && (
              <div>
                <p className="text-gray-400">Stop Fiyatı</p>
                <p className="text-red-400 font-mono">${botState.trailingStopPrice.toFixed(4)}</p>
              </div>
            )}
            {botState.maxPriceSinceBuy && botState.maxPriceSinceBuy > botState.buyPrice && (
              <div>
                <p className="text-gray-400">En Yüksek</p>
                <p className="text-green-400 font-mono">${botState.maxPriceSinceBuy.toFixed(4)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ayarlar */}
      <div className="space-y-4 mb-4">
        {/* Coin Seçimi */}
        <div>
          <label className="text-gray-400 text-sm mb-2 block">Coin Çifti</label>
          <select
            value={selectedCoin}
            onChange={(e) => setSelectedCoin(e.target.value)}
            disabled={isRunning}
            className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-bitcoin focus:outline-none disabled:opacity-50"
          >
            {getCoinOptions().map(option => (
              <option key={option.value} value={option.value}>
                {option.icon} {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Strateji Seçimi */}
        <div>
          <label className="text-gray-400 text-sm mb-2 block">Strateji</label>
          <div className="grid grid-cols-3 gap-2">
            <div className="relative">
              <button
                onClick={() => setStrategy('scalping')}
                disabled={isRunning}
                className={`w-full px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  strategy === 'scalping'
                    ? 'bg-bitcoin/30 border border-bitcoin text-bitcoin'
                    : 'bg-black/30 border border-white/10 text-gray-400'
                } disabled:opacity-50`}
              >
                ⚡ Scalping
              </button>
              <button
                onClick={() => showStrategyInfoModal('scalping')}
                className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500/80 hover:bg-blue-500 rounded-full text-white text-xs flex items-center justify-center transition-all"
                title="Bilgi"
              >
                ?
              </button>
            </div>
            <div className="relative">
              <button
                onClick={() => setStrategy('grid')}
                disabled={isRunning}
                className={`w-full px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  strategy === 'grid'
                    ? 'bg-bitcoin/30 border border-bitcoin text-bitcoin'
                    : 'bg-black/30 border border-white/10 text-gray-400'
                } disabled:opacity-50`}
              >
                📊 Grid
              </button>
              <button
                onClick={() => showStrategyInfoModal('grid')}
                className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500/80 hover:bg-blue-500 rounded-full text-white text-xs flex items-center justify-center transition-all"
                title="Bilgi"
              >
                ?
              </button>
            </div>
            <div className="relative">
              <button
                onClick={() => setStrategy('dca')}
                disabled={isRunning}
                className={`w-full px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  strategy === 'dca'
                    ? 'bg-bitcoin/30 border border-bitcoin text-bitcoin'
                    : 'bg-black/30 border border-white/10 text-gray-400'
                } disabled:opacity-50`}
              >
                💵 DCA
              </button>
              <button
                onClick={() => showStrategyInfoModal('dca')}
                className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500/80 hover:bg-blue-500 rounded-full text-white text-xs flex items-center justify-center transition-all"
                title="Bilgi"
              >
                ?
              </button>
            </div>
          </div>
        </div>

        {/* Strateji Ayarları - Scalping */}
        {strategy === 'scalping' && (
          <div className="space-y-3 p-3 bg-black/20 rounded-lg border border-white/5">
            <p className="text-white text-sm font-medium">📊 Temel Ayarlar</p>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">
                Alım Eşiği (%) <span className="text-gray-500">Min: -5%</span>
              </label>
              <input
                type="number"
                step="0.1"
                value={scalpingBuyThreshold}
                onChange={(e) => {
                  let val = parseFloat(e.target.value)
                  if (isNaN(val)) val = -0.5
                  // ✅ Minimum -5%, Maximum 0%
                  if (val > 0) val = 0
                  if (val < -5) val = -5
                  setScalpingBuyThreshold(val)
                }}
                disabled={isRunning}
                className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-white text-sm disabled:opacity-50"
              />
              <p className="text-gray-500 text-xs mt-1">Fiyat bu kadar düşünce AL (örn: -0.5 = %0.5 düşüş)</p>
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">
                Satım Eşiği (%) <span className="text-gray-500">Min: 0.1%</span>
              </label>
              <input
                type="number"
                step="0.1"
                value={scalpingSellThreshold}
                onChange={(e) => {
                  let val = parseFloat(e.target.value)
                  if (isNaN(val)) val = 0.5
                  // ✅ Minimum 0.1%, Maximum 10%
                  if (val < 0.1) val = 0.1
                  if (val > 10) val = 10
                  setScalpingSellThreshold(val)
                }}
                disabled={isRunning}
                className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-white text-sm disabled:opacity-50"
              />
              <p className="text-gray-500 text-xs mt-1">Bu kadar kar olunca SAT (örn: 0.5 = %0.5 kar)</p>
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">İşlem Tutarı (USDT)</label>
              <input
                type="number"
                step="1"
                value={tradeAmount}
                onChange={(e) => setTradeAmount(e.target.value)}
                disabled={isRunning}
                className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-white text-sm disabled:opacity-50"
              />
            </div>

            {/* 🛡️ Risk Yönetimi Ayarları */}
            <div className="pt-3 mt-3 border-t border-white/10">
              <p className="text-white text-sm font-medium mb-3 flex items-center gap-2">
                🛡️ Risk Yönetimi
                <span className="text-green-400 text-xs bg-green-500/20 px-2 py-0.5 rounded">YENİ</span>
              </p>

              {/* Stop-Loss */}
              <div className="mb-3">
                <label className="text-gray-400 text-xs mb-1 block flex items-center gap-1">
                  🛑 Stop-Loss (%)
                  <span className="text-red-400 font-medium">Zorunlu</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={stopLoss}
                  onChange={(e) => {
                    let val = parseFloat(e.target.value)
                    if (isNaN(val)) val = -2.0
                    if (val > 0) val = 0
                    if (val < -10) val = -10
                    setStopLoss(val)
                  }}
                  disabled={isRunning}
                  className="w-full bg-red-500/10 border border-red-500/30 rounded px-3 py-2 text-white text-sm disabled:opacity-50"
                />
                <p className="text-gray-500 text-xs mt-1">
                  ❌ Bu kadar zarar ederse SAT (örn: -2.0 = %2 zarar)
                </p>
              </div>

              {/* Breakeven Trigger */}
              <div className="mb-3">
                <label className="text-gray-400 text-xs mb-1 block">
                  🛡️ Breakeven Tetikleme (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={breakEvenTrigger}
                  onChange={(e) => {
                    let val = parseFloat(e.target.value)
                    if (isNaN(val)) val = 0.5
                    if (val < 0.1) val = 0.1
                    if (val > 5) val = 5
                    setBreakEvenTrigger(val)
                  }}
                  disabled={isRunning}
                  className="w-full bg-blue-500/10 border border-blue-500/30 rounded px-3 py-2 text-white text-sm disabled:opacity-50"
                />
                <p className="text-gray-500 text-xs mt-1">
                  🔒 Bu kadar kar edince stop-loss'u giriş fiyatına çek (zarar riski yok!)
                </p>
              </div>

              {/* Trailing Activation */}
              <div className="mb-3">
                <label className="text-gray-400 text-xs mb-1 block">
                  📈 Trailing Başlatma (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={trailingActivation}
                  onChange={(e) => {
                    let val = parseFloat(e.target.value)
                    if (isNaN(val)) val = 0.3
                    if (val < 0.1) val = 0.1
                    if (val > 5) val = 5
                    setTrailingActivation(val)
                  }}
                  disabled={isRunning}
                  className="w-full bg-purple-500/10 border border-purple-500/30 rounded px-3 py-2 text-white text-sm disabled:opacity-50"
                />
                <p className="text-gray-500 text-xs mt-1">
                  🚀 Bu kadar kar edince trailing stop başlar (kar koruması)
                </p>
              </div>

              {/* Trailing Distance */}
              <div>
                <label className="text-gray-400 text-xs mb-1 block">
                  📉 Trailing Mesafe (%)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={trailingDistance}
                  onChange={(e) => {
                    let val = parseFloat(e.target.value)
                    if (isNaN(val)) val = 0.2
                    if (val < 0.05) val = 0.05
                    if (val > 2) val = 2
                    setTrailingDistance(val)
                  }}
                  disabled={isRunning}
                  className="w-full bg-purple-500/10 border border-purple-500/30 rounded px-3 py-2 text-white text-sm disabled:opacity-50"
                />
                <p className="text-gray-500 text-xs mt-1">
                  ↕️ En yüksek fiyattan bu kadar düşerse SAT
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Butonlar */}
      <div className="space-y-2">
        {/* Başlat/Durdur */}
        <button
          onClick={toggleBot}
          disabled={!botId}
          className={`w-full rounded-lg py-3 font-medium transition-all duration-300 ${
            isRunning
              ? 'bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30'
              : 'bg-green-500/20 border border-green-500/50 text-green-400 hover:bg-green-500/30'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isRunning ? '⏹️ Botu Durdur' : '▶️ Botu Başlat'}
        </button>

        {/* Grafik Göster */}
        <button
          onClick={() => setShowChartModal(true)}
          disabled={!botId || !botState || stats.totalTrades === 0}
          className="w-full bg-gradient-to-r from-bitcoin/20 to-purple-500/20 border border-bitcoin/50 text-bitcoin hover:from-bitcoin/30 hover:to-purple-500/30 rounded-lg py-2 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          📈 İşlemleri Grafikte Gör
        </button>

        {/* Export History */}
        <button
          onClick={exportHistory}
          disabled={!botId || stats.totalTrades === 0}
          className="w-full bg-purple-500/20 border border-purple-500/50 text-purple-400 hover:bg-purple-500/30 rounded-lg py-2 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          📥 Bot Geçmişi (JSON)
        </button>

        {/* Export All Trades */}
        <button
          onClick={exportAllTrades}
          className="w-full bg-blue-500/20 border border-blue-500/50 text-blue-400 hover:bg-blue-500/30 rounded-lg py-2 text-sm font-medium transition-all"
        >
          📊 Tüm İşlemler (JSON)
        </button>
      </div>

      {/* Bot Logları */}
      <div className="mt-4">
        <p className="text-gray-400 text-sm mb-2 font-medium">Bot Logları</p>
        <div className="bg-black/30 border border-white/10 rounded-lg p-3 max-h-48 overflow-y-auto">
          {!botState?.logs || botState.logs.length === 0 ? (
            <p className="text-gray-500 text-xs text-center py-4">Henüz log yok</p>
          ) : (
            <div className="space-y-1">
              {botState.logs.slice(0, 20).map((log, index) => (
                <div key={index} className="text-xs text-gray-300 flex gap-2">
                  <span className="text-gray-500">{log.time}</span>
                  <span className={
                    log.type === 'buy' ? 'text-green-400' :
                    log.type === 'sell' ? 'text-bitcoin' :
                    log.type === 'error' ? 'text-red-400' :
                    'text-gray-400'
                  }>{log.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Strateji Bilgi Modal */}
      {showStrategyInfo && selectedStrategyInfo && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowStrategyInfo(false)}
        >
          <div
            className="bg-gradient-to-br from-[#1a1625] to-[#2d2640] border border-white/20 rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Başlık */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-xl font-bold">{selectedStrategyInfo.title}</h3>
              <button
                onClick={() => setShowStrategyInfo(false)}
                className="w-8 h-8 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 rounded-full flex items-center justify-center transition-all"
              >
                ✕
              </button>
            </div>

            {/* Açıklama */}
            <p className="text-gray-300 text-sm mb-4 pb-4 border-b border-white/10">
              {selectedStrategyInfo.description}
            </p>

            {/* Nasıl Çalışır */}
            <div className="mb-4">
              <h4 className="text-bitcoin text-sm font-bold mb-2">📝 Nasıl Çalışır?</h4>
              <ul className="space-y-2">
                {selectedStrategyInfo.howItWorks.map((item, index) => (
                  <li key={index} className="text-gray-300 text-xs flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Örnek */}
            <div className="mb-4 bg-black/30 border border-white/10 rounded-lg p-3">
              <h4 className="text-purple-400 text-sm font-bold mb-2">💡 Örnek</h4>
              <pre className="text-gray-300 text-xs whitespace-pre-wrap font-mono">
                {selectedStrategyInfo.example}
              </pre>
            </div>

            {/* Artı/Eksi */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                <h4 className="text-green-400 text-xs font-bold mb-1 flex items-center gap-1">
                  <span>✅</span> Artıları
                </h4>
                <p className="text-gray-300 text-xs">{selectedStrategyInfo.pros}</p>
              </div>
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <h4 className="text-red-400 text-xs font-bold mb-1 flex items-center gap-1">
                  <span>⚠️</span> Eksileri
                </h4>
                <p className="text-gray-300 text-xs">{selectedStrategyInfo.cons}</p>
              </div>
            </div>

            {/* Kapat Butonu */}
            <button
              onClick={() => setShowStrategyInfo(false)}
              className="w-full mt-4 bg-bitcoin/20 hover:bg-bitcoin/30 border border-bitcoin/50 text-bitcoin rounded-lg py-3 font-medium transition-all"
            >
              Anladım
            </button>
          </div>
        </div>
      )}

      {/* Grafik Modal */}
      <BotChartModal
        isOpen={showChartModal}
        onClose={() => setShowChartModal(false)}
        botState={botState}
        symbol={selectedCoin}
      />
    </div>
  )
}

export default TestBotCard
