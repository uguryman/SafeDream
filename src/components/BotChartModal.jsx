import { useEffect, useRef, useState } from 'react'
import { createChart } from 'lightweight-charts'
import { useGetKlinesQuery } from '../store/api/binanceDirectApi'

/**
 * Bot Grafik Modal Komponenti
 * Bot işlemlerini mum grafiği üzerinde gösterir
 * - Alış/Satış işaretleri
 * - Stop-loss, Trailing stop, Breakeven seviyeleri
 * - Kar/Zarar analizi
 */
function BotChartModal({ isOpen, onClose, botState, symbol }) {
  const chartContainerRef = useRef(null)
  const chartRef = useRef(null)
  const candlestickSeriesRef = useRef(null)
  const markersRef = useRef([])

  // Klines data al (1 saatlik, 100 mum)
  const { data: klinesData, isLoading } = useGetKlinesQuery(
    { symbol, interval: '1m', limit: 100 },
    { skip: !isOpen }
  )

  // Grafik oluştur
  useEffect(() => {
    if (!isOpen || !chartContainerRef.current || !klinesData) return

    // Grafik varsa temizle
    if (chartRef.current) {
      chartRef.current.remove()
      chartRef.current = null
    }

    // Yeni grafik oluştur
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 500,
      layout: {
        background: { color: '#1a1625' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: '#2d2640' },
        horzLines: { color: '#2d2640' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#3f3a4f',
      },
      timeScale: {
        borderColor: '#3f3a4f',
        timeVisible: true,
        secondsVisible: false,
      },
    })

    chartRef.current = chart

    // Candlestick serisi ekle
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    })

    candlestickSeriesRef.current = candlestickSeries

    // Klines data'yı formatlayıp grafiye ekle
    const formattedData = klinesData.map((kline) => ({
      time: Math.floor(kline.openTime / 1000),
      open: parseFloat(kline.open),
      high: parseFloat(kline.high),
      low: parseFloat(kline.low),
      close: parseFloat(kline.close),
    }))

    candlestickSeries.setData(formattedData)

    // Bot işlemlerini işaretle
    if (botState) {
      addBotMarkers(candlestickSeries, formattedData)
      addPriceLines(chart, botState)
    }

    // Responsive
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (chart) {
        chart.remove()
      }
    }
  }, [isOpen, klinesData, botState, symbol])

  // Bot işlem işaretlerini ekle
  const addBotMarkers = (series, candleData) => {
    const markers = []

    // Bot loglarından alış/satış işlemlerini bul
    if (botState?.logs) {
      // ✅ Logları eskiden yeniye sırala (timestamp artan)
      const sortedLogs = [...botState.logs].sort((a, b) => a.timestamp - b.timestamp)

      sortedLogs.forEach((log) => {
        // Alış işareti
        if (log.type === 'buy' && log.message.includes('ALIM')) {
          const priceMatch = log.message.match(/\$(\d+\.\d+)/)
          if (priceMatch) {
            const price = parseFloat(priceMatch[1])
            const nearestCandle = findNearestCandle(candleData, log.timestamp)

            if (nearestCandle) {
              markers.push({
                time: nearestCandle.time,
                position: 'belowBar',
                color: '#26a69a',
                shape: 'arrowUp',
                text: `ALIM $${price.toFixed(4)}`,
              })
            }
          }
        }

        // Satış işareti
        if (log.type === 'sell' && (log.message.includes('SATIM') || log.message.includes('SATIŞ'))) {
          const priceMatch = log.message.match(/\$(\d+\.\d+)/)
          const profitMatch = log.message.match(/Kar: \$?([\d.-]+)/)

          if (priceMatch) {
            const price = parseFloat(priceMatch[1])
            const profit = profitMatch ? parseFloat(profitMatch[1]) : 0
            const nearestCandle = findNearestCandle(candleData, log.timestamp)

            if (nearestCandle) {
              const isProfit = profit >= 0
              markers.push({
                time: nearestCandle.time,
                position: 'aboveBar',
                color: isProfit ? '#26a69a' : '#ef5350',
                shape: 'arrowDown',
                text: `${isProfit ? '✅' : '❌'} $${price.toFixed(4)} (${profit >= 0 ? '+' : ''}$${profit.toFixed(2)})`,
              })
            }
          }
        }
      })
    }

    if (markers.length > 0) {
      // ✅ Marker'ları da time'a göre sırala (güvenlik için)
      markers.sort((a, b) => a.time - b.time)
      series.setMarkers(markers)
      markersRef.current = markers
    }
  }

  // Fiyat seviyesi çizgileri ekle
  const addPriceLines = (chart, botState) => {
    if (!candlestickSeriesRef.current) return

    // 1. Alış fiyatı (Beyaz çizgi)
    if (botState.buyPrice) {
      candlestickSeriesRef.current.createPriceLine({
        price: botState.buyPrice,
        color: '#ffffff',
        lineWidth: 2,
        lineStyle: 2, // Dashed
        axisLabelVisible: true,
        title: `Alış: $${botState.buyPrice.toFixed(4)}`,
      })
    }

    // 2. Stop-Loss (Kırmızı çizgi)
    if (botState.trailingStopPrice) {
      candlestickSeriesRef.current.createPriceLine({
        price: botState.trailingStopPrice,
        color: '#ef5350',
        lineWidth: 2,
        lineStyle: 0, // Solid
        axisLabelVisible: true,
        title: `Stop: $${botState.trailingStopPrice.toFixed(4)}`,
      })
    }

    // 3. En yüksek fiyat (Yeşil çizgi)
    if (botState.maxPriceSinceBuy && botState.maxPriceSinceBuy > botState.buyPrice) {
      candlestickSeriesRef.current.createPriceLine({
        price: botState.maxPriceSinceBuy,
        color: '#26a69a',
        lineWidth: 1,
        lineStyle: 2, // Dashed
        axisLabelVisible: true,
        title: `Max: $${botState.maxPriceSinceBuy.toFixed(4)}`,
      })
    }

    // 4. Hedef kar seviyesi (Mavi çizgi)
    if (botState.buyPrice && botState.settings?.sellThreshold) {
      const targetPrice = botState.buyPrice * (1 + botState.settings.sellThreshold / 100)
      candlestickSeriesRef.current.createPriceLine({
        price: targetPrice,
        color: '#2196f3',
        lineWidth: 1,
        lineStyle: 2, // Dashed
        axisLabelVisible: true,
        title: `Hedef: $${targetPrice.toFixed(4)}`,
      })
    }
  }

  // Timestamp'e en yakın mumu bul
  const findNearestCandle = (candleData, timestamp) => {
    if (!candleData || candleData.length === 0) return null

    const targetTime = Math.floor(timestamp / 1000)
    let nearest = candleData[0]
    let minDiff = Math.abs(candleData[0].time - targetTime)

    for (let i = 1; i < candleData.length; i++) {
      const diff = Math.abs(candleData[i].time - targetTime)
      if (diff < minDiff) {
        minDiff = diff
        nearest = candleData[i]
      }
    }

    return nearest
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-br from-[#1a1625] to-[#2d2640] border border-white/20 rounded-2xl p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-white text-2xl font-bold flex items-center gap-2">
              📈 Bot İşlem Grafiği
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              {symbol} - Son 100 dakika (1m mum)
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 rounded-full flex items-center justify-center transition-all"
          >
            ✕
          </button>
        </div>

        {/* Legend */}
        {botState && (
          <div className="mb-4 flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-white rounded-full"></div>
              <span className="text-gray-300">Alış Fiyatı</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-300">Stop-Loss</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-300">En Yüksek</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-300">Hedef Kar</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">▲</span>
              <span className="text-gray-300">Alım</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-red-400">▼</span>
              <span className="text-gray-300">Satım</span>
            </div>
          </div>
        )}

        {/* Bot Stats */}
        {botState && (
          <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {botState.buyPrice && (
              <div className="bg-black/30 border border-white/10 rounded-lg p-2">
                <p className="text-gray-400">Alış Fiyatı</p>
                <p className="text-white font-mono">${botState.buyPrice.toFixed(4)}</p>
              </div>
            )}
            {botState.trailingStopPrice && (
              <div className="bg-black/30 border border-red-500/20 rounded-lg p-2">
                <p className="text-gray-400">Stop-Loss</p>
                <p className="text-red-400 font-mono">${botState.trailingStopPrice.toFixed(4)}</p>
              </div>
            )}
            {botState.maxPriceSinceBuy && (
              <div className="bg-black/30 border border-green-500/20 rounded-lg p-2">
                <p className="text-gray-400">En Yüksek</p>
                <p className="text-green-400 font-mono">${botState.maxPriceSinceBuy.toFixed(4)}</p>
              </div>
            )}
            <div className="bg-black/30 border border-white/10 rounded-lg p-2">
              <p className="text-gray-400">Toplam İşlem</p>
              <p className="text-white font-bold">{botState.stats?.totalTrades || 0}</p>
            </div>
          </div>
        )}

        {/* Chart */}
        {isLoading ? (
          <div className="h-[500px] flex items-center justify-center">
            <div className="text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bitcoin mb-4 mx-auto"></div>
              <p>Grafik yükleniyor...</p>
            </div>
          </div>
        ) : (
          <div
            ref={chartContainerRef}
            className="bg-[#1a1625] rounded-lg border border-white/10 overflow-hidden"
          />
        )}

        {/* Info */}
        <div className="mt-4 text-xs text-gray-400 space-y-1">
          <p>💡 <strong>İpucu:</strong> Grafik üzerine geldiğinizde detaylı fiyat bilgilerini görebilirsiniz</p>
          <p>📊 Alış işaretleri (↑) yeşil, satış işaretleri (↓) kırmızı/yeşil renktedir</p>
          <p>📈 Çizgiler: Beyaz (Alış), Kırmızı (Stop), Yeşil (Max), Mavi (Hedef)</p>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="mt-6 w-full bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 text-purple-400 rounded-lg py-3 font-medium transition-all"
        >
          Kapat
        </button>
      </div>
    </div>
  )
}

export default BotChartModal
