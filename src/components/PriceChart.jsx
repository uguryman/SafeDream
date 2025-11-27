import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'
import { useGetKlinesQuery } from '../store/api/binanceDirectApi'

/**
 * BTC Fiyat Grafiği Komponenti
 *
 * Binance API'den geçmiş verileri çeker ve gerçek zamanlı grafik gösterir
 */
function PriceChart({ currentPrice, symbol = 'BTC/USDT' }) {
  const [priceHistory, setPriceHistory] = useState([])

  // Binance'den son 100 mum verisini çek (1 dakikalık mumlar = son 100 dakika ~ 1.5 saat)
  const symbolPair = symbol.replace('/', '') // "BTC/USDT" -> "BTCUSDT"
  const { data: klines, isLoading, error } = useGetKlinesQuery({
    symbol: symbolPair,
    interval: '1m', // 1 dakikalık mumlar
    limit: 100,
  }, {
    pollingInterval: 60000, // Her 1 dakikada bir güncelle
  })

  // Klines verisini state'e yükle (ilk yüklemede)
  useEffect(() => {
    if (klines && klines.length > 0) {
      const formattedData = klines.map(candle => {
        const date = new Date(candle.closeTime)
        const timeString = date.toLocaleTimeString('tr-TR', {
          hour: '2-digit',
          minute: '2-digit',
        })

        return {
          time: timeString,
          price: candle.close, // Kapanış fiyatı
          timestamp: candle.closeTime,
          volume: candle.volume,
        }
      })

      setPriceHistory(formattedData)
    }
  }, [klines])

  // Min ve max fiyat hesapla
  const prices = priceHistory.map((d) => d.price)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const priceRange = maxPrice - minPrice

  // Custom Tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-black/90 border border-bitcoin/50 rounded-lg p-3 shadow-xl">
          <p className="text-bitcoin text-xs font-medium mb-1">{data.time}</p>
          <p className="text-white text-lg font-bold">
            ${data.price.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
      )
    }
    return null
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center bg-black/20 rounded-xl border border-white/10">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-spin">⏳</div>
          <p className="text-gray-400 text-sm">Grafik verisi yükleniyor...</p>
          <p className="text-gray-500 text-xs mt-1">
            Binance'den geçmiş veriler çekiliyor
          </p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center bg-black/20 rounded-xl border border-white/10">
        <div className="text-center">
          <div className="text-4xl mb-3">❌</div>
          <p className="text-red-400 text-sm">Grafik verisi yüklenemedi</p>
          <p className="text-gray-500 text-xs mt-1">
            {error?.data?.msg || error.error || 'Bağlantı hatası'}
          </p>
        </div>
      </div>
    )
  }

  // Veri yoksa
  if (priceHistory.length === 0) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center bg-black/20 rounded-xl border border-white/10">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse">📊</div>
          <p className="text-gray-400 text-sm">Grafik verisi bekleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Grafik Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-white text-lg font-bold flex items-center gap-2">
            <span className="text-xl">📈</span>
            {symbol} Fiyat Grafiği
          </h3>
          <p className="text-gray-400 text-xs mt-1">
            Son {priceHistory.length} dakika • 1 dakikalık mumlar • Binance
          </p>
        </div>
        <div className="text-right">
          <p className="text-gray-400 text-xs">Fiyat Aralığı</p>
          <p className="text-white text-sm font-medium">
            ${minPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })} -{' '}
            ${maxPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })}
          </p>
          <p className="text-bitcoin text-xs">
            Fark: ${priceRange.toLocaleString('en-US', { maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Grafik */}
      <div className="bg-black/20 rounded-xl border border-white/10 p-4">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={priceHistory}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f7931a" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f7931a" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis
              dataKey="time"
              stroke="#888"
              tick={{ fill: '#888', fontSize: 11 }}
              tickMargin={10}
              minTickGap={30}
            />
            <YAxis
              stroke="#888"
              tick={{ fill: '#888', fontSize: 11 }}
              tickMargin={10}
              domain={[
                (dataMin) => Math.floor(dataMin * 0.9999),
                (dataMax) => Math.ceil(dataMax * 1.0001),
              ]}
              tickFormatter={(value) =>
                `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
              }
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="price"
              stroke="#f7931a"
              strokeWidth={2}
              fill="url(#colorPrice)"
              animationDuration={300}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Grafik Footer - İstatistikler */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="bg-black/20 rounded-lg p-3 border border-white/5">
          <p className="text-gray-400 text-xs mb-1">İlk Fiyat</p>
          <p className="text-white text-sm font-bold">
            ${priceHistory[0]?.price.toLocaleString('en-US', {
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
        <div className="bg-black/20 rounded-lg p-3 border border-white/5">
          <p className="text-gray-400 text-xs mb-1">Son Fiyat</p>
          <p className="text-white text-sm font-bold">
            $
            {priceHistory[priceHistory.length - 1]?.price.toLocaleString(
              'en-US',
              { maximumFractionDigits: 2 }
            )}
          </p>
        </div>
        <div className="bg-black/20 rounded-lg p-3 border border-white/5">
          <p className="text-gray-400 text-xs mb-1">Değişim</p>
          <p
            className={`text-sm font-bold ${
              priceHistory[priceHistory.length - 1]?.price >=
              priceHistory[0]?.price
                ? 'text-green-400'
                : 'text-red-400'
            }`}
          >
            {priceHistory.length >= 2
              ? (
                  ((priceHistory[priceHistory.length - 1]?.price -
                    priceHistory[0]?.price) /
                    priceHistory[0]?.price) *
                  100
                ).toFixed(2)
              : '0.00'}
            %
          </p>
        </div>
      </div>
    </div>
  )
}

export default PriceChart
