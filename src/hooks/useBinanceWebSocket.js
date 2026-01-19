/**
 * Binance WebSocket Custom Hook
 * Component'lerde kolayca kullanılabilir
 */

import { useEffect, useState, useRef } from 'react'
import binanceWS from '../services/binanceWebSocket'

/**
 * Binance WebSocket Hook
 * @param {string} symbol - Coin symbol (BTCUSDT)
 * @param {boolean} enabled - WebSocket aktif olsun mu?
 * @returns {Object} { price, priceData, isConnected, error }
 */
export const useBinanceWebSocket = (symbol, enabled = true) => {
  const [priceData, setPriceData] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState(null)
  const unsubscribeRef = useRef(null)

  useEffect(() => {
    if (!enabled || !symbol) {
      return
    }

    // WebSocket'i başlat
    try {
      binanceWS.connect([symbol])
      setIsConnected(true)

      // Fiyat güncellemelerini dinle
      unsubscribeRef.current = binanceWS.subscribe(symbol, (data) => {
        setPriceData(data)
        setError(null)
      })
    } catch (err) {
      console.error('WebSocket başlatma hatası:', err)
      setError(err.message)
      setIsConnected(false)
    }

    // Cleanup: Component unmount olduğunda
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [symbol, enabled])

  return {
    price: priceData?.price,
    priceData,
    isConnected,
    error,
  }
}

/**
 * Fiyat Geçmişi Tutan Hook
 * @param {string} symbol - Coin symbol
 * @param {number} maxHistory - Kaç fiyat saklanacak (default: 100)
 * @returns {Object} { currentPrice, priceHistory, averagePrice, volatility }
 */
export const usePriceHistory = (symbol, maxHistory = 100) => {
  const [priceHistory, setPriceHistory] = useState([])
  const { price, priceData, isConnected } = useBinanceWebSocket(symbol)

  useEffect(() => {
    if (price) {
      setPriceHistory(prev => {
        const newHistory = [...prev, {
          price: price,
          timestamp: Date.now(),
          priceChangePercent: priceData?.priceChangePercent || 0
        }]

        // Son N fiyatı tut
        return newHistory.slice(-maxHistory)
      })
    }
  }, [price, maxHistory])

  // Ortalama fiyat hesapla
  const averagePrice = priceHistory.length > 0
    ? priceHistory.reduce((sum, item) => sum + item.price, 0) / priceHistory.length
    : 0

  // Volatilite hesapla (standart sapma)
  const volatility = priceHistory.length > 1
    ? Math.sqrt(
        priceHistory.reduce((sum, item) => {
          return sum + Math.pow(item.price - averagePrice, 2)
        }, 0) / priceHistory.length
      )
    : 0

  return {
    currentPrice: price,
    priceData,
    priceHistory,
    averagePrice: averagePrice.toFixed(2),
    volatility: volatility.toFixed(2),
    isConnected,
    historyCount: priceHistory.length
  }
}
