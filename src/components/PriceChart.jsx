import { useEffect, useState } from 'react'
import { useGetKlinesQuery } from '../store/api/binanceDirectApi'

// Zaman aralığı seçenekleri
const timeIntervals = [
  { label: '1Sa', value: '1m', limit: 60 },       // 1 saat = 60 x 1 dakika
  { label: '4Sa', value: '1m', limit: 240 },      // 4 saat = 240 x 1 dakika
  { label: '1D', value: '5m', limit: 288 },       // 1 gün = 288 x 5 dakika
  { label: '5D', value: '15m', limit: 480 },      // 5 gün = 480 x 15 dakika
  { label: '15D', value: '1h', limit: 360 },      // 15 gün = 360 x 1 saat
  { label: '1Gün', value: '15m', limit: 96 },     // 1 gün = 96 x 15 dakika
  { label: '1Ay', value: '4h', limit: 180 },      // 1 ay = 180 x 4 saat
]

/**
 * BTC Fiyat Grafiği Komponenti
 */
function PriceChart({ currentPrice, symbol = 'BTC/USDT' }) {
  const [priceHistory, setPriceHistory] = useState([])
  const [hoveredIndex, setHoveredIndex] = useState(null)
  const [clickedIndex, setClickedIndex] = useState(null) // Tıklanan mum için

  // Viewport state'leri - Kaç mum gösterileceği (SABİT)
  const VISIBLE_CANDLE_COUNT = 50 // HER ZAMAN 50 MUM GÖSTER
  const [startIndex, setStartIndex] = useState(0) // Başlangıç indexi
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, startIndex: 0 })
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })

  // localStorage'dan seçili interval'i al veya default '1Sa' kullan
  const [selectedInterval, setSelectedInterval] = useState(() => {
    const saved = localStorage.getItem('chart-interval')
    return saved || '1Sa'
  })

  // Seçili interval'e göre ayarları al
  const currentIntervalConfig = timeIntervals.find(t => t.label === selectedInterval) || timeIntervals[0]

  // Binance'den mum verisini çek
  const symbolPair = symbol.replace('/', '')
  const { data: klines, isLoading, error } = useGetKlinesQuery({
    symbol: symbolPair,
    interval: currentIntervalConfig.value,
    limit: currentIntervalConfig.limit,
  }, {
    pollingInterval: 60000,
  })

  // Interval değiştiğinde localStorage'a kaydet
  const handleIntervalChange = (interval) => {
    setSelectedInterval(interval)
    localStorage.setItem('chart-interval', interval)
  }

  // Scroll ve Pan fonksiyonları
  const handleWheel = (e) => {
    // preventDefault artık gerekli değil, sadece state güncelle
    // Wheel ile ileri-geri kaydır
    const delta = e.deltaY > 0 ? 5 : -5
    const newStartIndex = startIndex + delta
    setStartIndex(Math.max(0, Math.min(newStartIndex, priceHistory.length - VISIBLE_CANDLE_COUNT)))
  }

  // Container boyutunu ölç
  useEffect(() => {
    const updateSize = () => {
      const container = document.getElementById('chart-container')
      if (container) {
        const rect = container.getBoundingClientRect()
        setContainerSize({ width: rect.width, height: rect.height })
      }
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  // useEffect ile passive listener ekle
  useEffect(() => {
    const div = document.getElementById('chart-container')
    if (!div) return

    const wheelHandler = (e) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 5 : -5
      const newStartIndex = startIndex + delta
      setStartIndex(Math.max(0, Math.min(newStartIndex, priceHistory.length - VISIBLE_CANDLE_COUNT)))
    }

    div.addEventListener('wheel', wheelHandler, { passive: false })
    return () => div.removeEventListener('wheel', wheelHandler)
  }, [startIndex, priceHistory.length])

  const handleMouseDown = (e) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX, startIndex })
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    const deltaX = e.clientX - dragStart.x
    const candleShift = Math.round(deltaX / candleWidth)

    const newStartIndex = dragStart.startIndex - candleShift
    setStartIndex(Math.max(0, Math.min(newStartIndex, priceHistory.length - VISIBLE_CANDLE_COUNT)))
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseLeave = () => {
    setIsDragging(false)
  }

  // Reset viewport - En son mumlara git
  const resetViewport = () => {
    setStartIndex(Math.max(0, priceHistory.length - VISIBLE_CANDLE_COUNT))
  }

  // Data değiştiğinde EN SON mumları göster
  useEffect(() => {
    if (priceHistory.length > 0) {
      setStartIndex(Math.max(0, priceHistory.length - VISIBLE_CANDLE_COUNT))
    }
  }, [priceHistory.length])

  // Klines verisini state'e yükle
  useEffect(() => {
    if (klines && klines.length > 0) {
      const formattedData = klines.map(candle => {
        const date = new Date(candle.closeTime)

        // Label'a göre zaman formatı belirle
        let timeString = ''
        const label = selectedInterval

        if (label === '1Sa' || label === '4Sa') {
          // Saatlik grafikler - Saat:Dakika
          timeString = date.toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit',
          })
        } else if (label === '1D' || label === '1Gün') {
          // 1 günlük grafikler - Saat:Dakika
          timeString = date.toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit',
          })
        } else if (label === '5D') {
          // 5 günlük - Gün Ay + Saat
          timeString = date.toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: 'short',
          }) + ' ' + date.toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit',
          })
        } else if (label === '15D' || label === '1Ay') {
          // 15 gün ve 1 aylık - Sadece Gün Ay
          timeString = date.toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: 'short',
          })
        } else {
          // Default - Saat formatı
          timeString = date.toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit',
          })
        }

        return {
          time: timeString,
          open: parseFloat(candle.open),
          high: parseFloat(candle.high),
          low: parseFloat(candle.low),
          close: parseFloat(candle.close),
          timestamp: candle.closeTime,
          volume: candle.volume,
        }
      })

      setPriceHistory(formattedData)
    }
  }, [klines, selectedInterval])

  // Görünür mumları al - HER ZAMAN 50 MUM
  const visibleCandles = priceHistory.slice(startIndex, startIndex + VISIBLE_CANDLE_COUNT)

  // İstatistikler - Sadece görünür mumlar için
  const prices = visibleCandles.map((d) => d.close)
  const minPrice = prices.length > 0 ? Math.min(...prices, ...visibleCandles.map(d => d.low)) : 0
  const maxPrice = prices.length > 0 ? Math.max(...prices, ...visibleCandles.map(d => d.high)) : 0
  const firstPrice = priceHistory[0]?.open || 0
  const lastPrice = priceHistory[priceHistory.length - 1]?.close || 0
  const change = ((lastPrice - firstPrice) / firstPrice) * 100

  // Loading
  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black/20 rounded-lg border border-white/10">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-spin">⏳</div>
          <p className="text-gray-400 text-sm">Grafik verisi yükleniyor...</p>
        </div>
      </div>
    )
  }

  // Error
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black/20 rounded-lg border border-white/10">
        <div className="text-center">
          <div className="text-4xl mb-3">❌</div>
          <p className="text-red-400 text-sm">Grafik verisi yüklenemedi</p>
        </div>
      </div>
    )
  }

  // No data
  if (priceHistory.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black/20 rounded-lg border border-white/10">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse">📊</div>
          <p className="text-gray-400 text-sm">Grafik verisi bekleniyor...</p>
        </div>
      </div>
    )
  }

  // Gerçek container boyutlarını kullan
  const svgWidth = containerSize.width || 1000
  const svgHeight = containerSize.height || 600
  const padding = { top: 20, right: 90, bottom: 50, left: 70 }
  const chartWidth = svgWidth - padding.left - padding.right
  const chartHeight = svgHeight - padding.top - padding.bottom

  // Her mum için sabit genişlik - RESPONSIVE
  const candleWidth = chartWidth / VISIBLE_CANDLE_COUNT
  const candleBodyWidth = Math.max(candleWidth * 0.7, 2)

  // Scale fonksiyonları - Her mum eşit aralıklı
  const xScale = (index) => padding.left + (index * candleWidth)
  const yScale = (value) => {
    const range = maxPrice - minPrice
    if (range === 0) return padding.top + chartHeight / 2
    const normalized = (value - minPrice) / range
    return padding.top + chartHeight - (normalized * chartHeight)
  }

  // Y ekseni için dinamik etiket sayısı (fiyat aralığına göre)
  const priceRange = maxPrice - minPrice
  const yLabelCount = priceRange > 1000 ? 8 : priceRange > 100 ? 6 : 5

  // X ekseni için dinamik etiket sayısı (ekran genişliğine ve interval'e göre)
  const xLabelInterval = Math.max(1, Math.floor(VISIBLE_CANDLE_COUNT / (svgWidth > 600 ? 10 : 6)))

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Header ve Stats */}
      <div className="flex-shrink-0 mb-2 flex flex-wrap items-center justify-between gap-2 text-xs px-4 py-2">
        {/* Sol: Başlık, Zaman Seçici ve Reset */}
        <div className="flex items-center gap-3">
          <h3 className="text-white text-sm sm:text-base font-bold flex items-center gap-1">
            <span className="text-base sm:text-lg">📊</span>
            <span className="hidden sm:inline">{symbol}</span>
          </h3>

          <select
            value={selectedInterval}
            onChange={(e) => handleIntervalChange(e.target.value)}
            className="bg-white/5 border border-white/10 text-white px-2 py-1 rounded text-xs font-medium focus:outline-none focus:border-bitcoin hover:bg-white/10 transition-all cursor-pointer"
          >
            {timeIntervals.map((interval) => (
              <option key={interval.label} value={interval.label} className="bg-[#1a1625] text-white">
                {interval.label}
              </option>
            ))}
          </select>

          {startIndex !== Math.max(0, priceHistory.length - VISIBLE_CANDLE_COUNT) && (
            <button
              onClick={resetViewport}
              className="bg-white/5 border border-white/10 text-white px-2 py-1 rounded text-xs font-medium hover:bg-white/10 transition-all"
              title="En son mumlara git"
            >
              ⏭️
            </button>
          )}

          <span className="text-gray-500 text-xs">
            {priceHistory.length > 0 && `${startIndex + 1}-${Math.min(startIndex + VISIBLE_CANDLE_COUNT, priceHistory.length)}/${priceHistory.length}`}
          </span>
        </div>

        {/* Sağ: Stats - Kompakt */}
        <div className="flex gap-2 sm:gap-3 text-xs">
          <div className="text-center">
            <p className="text-gray-400 text-[10px]">İlk</p>
            <p className="text-white font-bold">${firstPrice.toFixed(2)}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-[10px]">Son</p>
            <p className="text-white font-bold">${lastPrice.toFixed(2)}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-[10px]">Değişim</p>
            <p className={`font-bold ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {change >= 0 ? '+' : ''}{change.toFixed(2)}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-[10px]">Aralık</p>
            <p className="text-white font-bold">${(maxPrice - minPrice).toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* SVG Candlestick Chart - Flex ile tam ekranı kapla */}
      <div
        className="flex-1 overflow-hidden relative"
        style={{ minHeight: 0 }}
        id="chart-container"
      >
        <div
          className="absolute inset-0 w-full h-full"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            preserveAspectRatio="xMidYMid meet"
            style={{ display: 'block', pointerEvents: 'auto' }}
            onClick={(e) => {
              // Sadece SVG arka planına tıklandığında kapat
              if (e.target.tagName === 'svg') {
                setClickedIndex(null)
              }
            }}
          >
          {/* Grid Lines - Dinamik */}
          <g>
            {Array.from({ length: yLabelCount }).map((_, i) => {
              const ratio = i / (yLabelCount - 1)
              const y = padding.top + ratio * chartHeight
              return (
                <line
                  key={`grid-${i}`}
                  x1={padding.left}
                  y1={y}
                  x2={svgWidth - padding.right}
                  y2={y}
                  stroke="rgba(255,255,255,0.05)"
                  strokeDasharray="3 3"
                />
              )
            })}
          </g>

          {/* Y Axis Labels - Dinamik */}
          <g>
            {Array.from({ length: yLabelCount }).map((_, i) => {
              const ratio = i / (yLabelCount - 1)
              const y = padding.top + ratio * chartHeight
              const value = maxPrice - (ratio * priceRange)
              // Fiyat formatı - büyük sayılar için daha az ondalık
              const decimals = value > 1000 ? 0 : value > 10 ? 2 : value > 1 ? 3 : 4
              return (
                <text
                  key={`ylabel-${i}`}
                  x={svgWidth - padding.right + 10}
                  y={y}
                  fill="#888"
                  fontSize="10"
                  textAnchor="start"
                  dominantBaseline="middle"
                >
                  ${value.toFixed(decimals)}
                </text>
              )
            })}
          </g>

          {/* Candlesticks */}
          <g>
            {visibleCandles.map((candle, index) => {
              const { open, close, high, low, time } = candle
              const isGreen = close >= open
              const color = isGreen ? '#10b981' : '#ef4444'

              const x = xScale(index)
              const highY = yScale(high)
              const lowY = yScale(low)
              const openY = yScale(open)
              const closeY = yScale(close)

              const bodyTop = Math.min(openY, closeY)
              const bodyBottom = Math.max(openY, closeY)
              const bodyHeight = Math.max(bodyBottom - bodyTop, 1)

              const centerX = x + candleWidth / 2

              return (
                <g
                  key={`candle-${index}`}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Tıklanabilir alan - Görünmez rect */}
                  <rect
                    x={x}
                    y={padding.top}
                    width={candleWidth}
                    height={chartHeight}
                    fill="transparent"
                    onClick={(e) => {
                      e.stopPropagation()
                      setClickedIndex(clickedIndex === index ? null : index)
                    }}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />

                  {/* Üst fitil */}
                  <line
                    x1={centerX}
                    y1={highY}
                    x2={centerX}
                    y2={bodyTop}
                    stroke={color}
                    strokeWidth={Math.max(1, candleWidth * 0.1)}
                    style={{ pointerEvents: 'none' }}
                  />

                  {/* Mum gövdesi */}
                  <rect
                    x={x + (candleWidth - candleBodyWidth) / 2}
                    y={bodyTop}
                    width={candleBodyWidth}
                    height={bodyHeight}
                    fill={color}
                    stroke={clickedIndex === index ? '#fff' : color}
                    strokeWidth={clickedIndex === index ? 2 : 1}
                    opacity={hoveredIndex === index || clickedIndex === index ? 0.9 : 1}
                    style={{ pointerEvents: 'none' }}
                  />

                  {/* Alt fitil */}
                  <line
                    x1={centerX}
                    y1={bodyBottom}
                    x2={centerX}
                    y2={lowY}
                    stroke={color}
                    strokeWidth={Math.max(1, candleWidth * 0.1)}
                    style={{ pointerEvents: 'none' }}
                  />
                </g>
              )
            })}
          </g>

          {/* X Axis Labels - Dinamik interval */}
          <g>
            {visibleCandles.filter((_, i) => i % xLabelInterval === 0).map((candle, filterIndex) => {
              const originalIndex = filterIndex * xLabelInterval
              const x = xScale(originalIndex)
              const centerX = x + candleWidth / 2
              return (
                <text
                  key={`xlabel-${originalIndex}`}
                  x={centerX}
                  y={svgHeight - padding.bottom + 25}
                  fill="#888"
                  fontSize="10"
                  textAnchor="middle"
                >
                  {candle.time}
                </text>
              )
            })}
          </g>

          {/* Tooltip - Detaylı Bilgi (Tıklanan veya Hover) */}
          {(() => {
            const activeIndex = clickedIndex !== null ? clickedIndex : hoveredIndex
            if (activeIndex === null || activeIndex >= visibleCandles.length) return null

            const candle = visibleCandles[activeIndex]
            const date = new Date(candle.timestamp)
            const label = selectedInterval

            // Tam tarih/saat formatı - label'a göre
            let fullDateTime = ''
            if (label === '1Sa' || label === '4Sa' || label === '1D' || label === '1Gün') {
              // Kısa dönem - Gün Ay Saat:Dakika
              fullDateTime = date.toLocaleDateString('tr-TR', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })
            } else if (label === '5D') {
              // 5 gün - Gün Ay Saat
              fullDateTime = date.toLocaleDateString('tr-TR', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })
            } else if (label === '15D' || label === '1Ay') {
              // Uzun dönem - Gün Ay Yıl
              fullDateTime = date.toLocaleDateString('tr-TR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })
            }

            const tooltipX = Math.min(xScale(activeIndex), svgWidth - 170)
            const tooltipPadding = 10

            return (
              <g>
                <rect
                  x={tooltipX}
                  y={15}
                  width={160}
                  height={135}
                  fill="rgba(0,0,0,0.95)"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth={1.5}
                  rx={8}
                />
                {/* Tarih/Saat */}
                <text x={tooltipX + tooltipPadding} y={35} fill="#999" fontSize="10" fontWeight="bold">
                  📅 {fullDateTime}
                </text>
                {/* Açılış */}
                <text x={tooltipX + tooltipPadding} y={55} fill="#aaa" fontSize="10">
                  Açılış:
                </text>
                <text x={tooltipX + tooltipPadding + 50} y={55} fill="#fff" fontSize="10" fontWeight="bold">
                  ${candle.open.toFixed(4)}
                </text>
                {/* En Yüksek */}
                <text x={tooltipX + tooltipPadding} y={73} fill="#aaa" fontSize="10">
                  En Yüksek:
                </text>
                <text x={tooltipX + tooltipPadding + 50} y={73} fill="#10b981" fontSize="10" fontWeight="bold">
                  ${candle.high.toFixed(4)}
                </text>
                {/* En Düşük */}
                <text x={tooltipX + tooltipPadding} y={91} fill="#aaa" fontSize="10">
                  En Düşük:
                </text>
                <text x={tooltipX + tooltipPadding + 50} y={91} fill="#ef4444" fontSize="10" fontWeight="bold">
                  ${candle.low.toFixed(4)}
                </text>
                {/* Kapanış */}
                <text x={tooltipX + tooltipPadding} y={109} fill="#aaa" fontSize="10">
                  Kapanış:
                </text>
                <text x={tooltipX + tooltipPadding + 50} y={109} fill="#fff" fontSize="10" fontWeight="bold">
                  ${candle.close.toFixed(4)}
                </text>
                {/* Değişim */}
                <text x={tooltipX + tooltipPadding} y={127} fill="#aaa" fontSize="10">
                  Değişim:
                </text>
                <text
                  x={tooltipX + tooltipPadding + 50}
                  y={127}
                  fill={candle.close >= candle.open ? '#10b981' : '#ef4444'}
                  fontSize="10"
                  fontWeight="bold"
                >
                  {((candle.close - candle.open) / candle.open * 100).toFixed(2)}%
                </text>
              </g>
            )
          })()}
          </svg>
        </div>
      </div>
    </div>
  )
}

export default PriceChart
