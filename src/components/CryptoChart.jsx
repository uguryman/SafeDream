import { useEffect, useRef, useState } from 'react'
import { createChart } from 'lightweight-charts'
import { useGetKlinesQuery } from '../store/api/binanceTestnetApi'
import binanceWS from '../services/binanceWebSocket'

/**
 * CryptoChart Component
 *
 * Lightweight Charts kullanarak gerçek zamanlı candlestick grafik gösterir
 * - REST API ile historical data yükler
 * - WebSocket ile real-time güncellemeler alır
 *
 * @param {string} symbol - Coin symbol (BTCUSDT, ETHUSDT, vb.)
 * @param {string} interval - Zaman aralığı (1m, 5m, 15m, 1h, 4h, 1d)
 * @param {number} height - Grafik yüksekliği (px)
 */
function CryptoChart({ symbol = 'BTCUSDT', interval = '1m', height = 400 }) {
  const chartContainerRef = useRef(null)
  const chartRef = useRef(null)
  const candleSeriesRef = useRef(null)
  const volumeSeriesRef = useRef(null)
  const [isReady, setIsReady] = useState(false)

  // Historical data yükle (REST API)
  const { data: historicalData, isLoading, error } = useGetKlinesQuery({
    symbol,
    interval,
    limit: 100
  })

  // Chart'ı oluştur
  useEffect(() => {
    if (!chartContainerRef.current) return

    // Chart instance oluştur
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: height,
      layout: {
        background: { color: 'transparent' },
        textColor: '#9CA3AF',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#F7931A',
          width: 1,
          style: 2,
          labelBackgroundColor: '#F7931A',
        },
        horzLine: {
          color: '#F7931A',
          width: 1,
          style: 2,
          labelBackgroundColor: '#F7931A',
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        scaleMargins: {
          top: 0.1,
          bottom: 0.2,
        },
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        timeVisible: true,
        secondsVisible: false,
      },
      watermark: {
        visible: false,
      },
    })

    // Candlestick series
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#10B981',
      downColor: '#EF4444',
      borderUpColor: '#10B981',
      borderDownColor: '#EF4444',
      wickUpColor: '#10B981',
      wickDownColor: '#EF4444',
    })

    // Volume series (histogram)
    const volumeSeries = chart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: 'volume',
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    })

    chartRef.current = chart
    candleSeriesRef.current = candleSeries
    volumeSeriesRef.current = volumeSeries

    // Responsive - Window resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        })
      }
    }

    window.addEventListener('resize', handleResize)

    setIsReady(true)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
      }
    }
  }, [height])

  // Historical data'yı chart'a yükle
  useEffect(() => {
    if (!isReady || !historicalData || !candleSeriesRef.current || !volumeSeriesRef.current) return

    // Candlestick data
    const candleData = historicalData.map(d => ({
      time: d.time,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }))

    // Volume data
    const volumeData = historicalData.map(d => ({
      time: d.time,
      value: d.volume,
      color: d.close >= d.open ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)',
    }))

    candleSeriesRef.current.setData(candleData)
    volumeSeriesRef.current.setData(volumeData)

    // Chart'ı en son data'ya scroll et
    chartRef.current.timeScale().scrollToRealTime()
  }, [isReady, historicalData])

  // WebSocket ile real-time güncellemeler
  useEffect(() => {
    if (!isReady || !candleSeriesRef.current || !volumeSeriesRef.current) return

    // WebSocket bağlantısını başlat
    binanceWS.connectKline(symbol, interval)

    // Candlestick güncellemelerini dinle
    const unsubscribe = binanceWS.subscribeKline(symbol, (candleData) => {
      if (!candleSeriesRef.current || !volumeSeriesRef.current) return

      // Yeni candlestick data'sını ekle/güncelle
      candleSeriesRef.current.update({
        time: candleData.time,
        open: candleData.open,
        high: candleData.high,
        low: candleData.low,
        close: candleData.close,
      })

      // Volume güncelle
      volumeSeriesRef.current.update({
        time: candleData.time,
        value: candleData.volume,
        color: candleData.close >= candleData.open
          ? 'rgba(16, 185, 129, 0.5)'
          : 'rgba(239, 68, 68, 0.5)',
      })
    })

    // Cleanup
    return () => {
      unsubscribe()
      binanceWS.disconnectKline()
    }
  }, [isReady, symbol, interval])

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
        <p className="text-red-400 text-sm">❌ Grafik yüklenemedi</p>
        <p className="text-red-300 text-xs mt-1">{error.message}</p>
      </div>
    )
  }

  return (
    <div className="relative w-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bitcoin mx-auto mb-2"></div>
            <p className="text-gray-400 text-sm">Grafik yükleniyor...</p>
          </div>
        </div>
      )}
      <div
        ref={chartContainerRef}
        className="w-full rounded-lg overflow-hidden border border-white/10"
        style={{ height: `${height}px` }}
      />
    </div>
  )
}

export default CryptoChart
