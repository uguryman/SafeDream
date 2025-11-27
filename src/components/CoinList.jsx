import { useGetDirectMultipleTickerPricesQuery } from '../store/api/binanceDirectApi'

/**
 * Coin Listesi Komponenti
 * BTC, ETH, ADA, XRP fiyatlarını anlık gösterir
 *
 * @param {Function} onCoinSelect - Coin seçildiğinde çağrılır
 * @param {string} selectedSymbol - Seçili coin'in symbol'ü
 */
function CoinList({ onCoinSelect, selectedSymbol }) {
  const symbols = ['BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'XRPUSDT']

  // Birden fazla coin fiyatını çek (her 10 saniyede otomatik yenilenir)
  const { data: coins, isLoading, error, refetch, isFetching } = useGetDirectMultipleTickerPricesQuery(symbols, {
    pollingInterval: 10000, // 10 saniye
  })

  // Coin tıklandığında
  const handleCoinClick = (coinSymbol) => {
    const coinName = getCoinName(coinSymbol)
    if (onCoinSelect) {
      onCoinSelect({ symbol: coinSymbol, name: coinName })
    }
  }

  // Manuel refresh
  const handleRefresh = () => {
    refetch()
  }

  // Coin için icon/emoji
  const getCoinIcon = (symbol) => {
    const icons = {
      BTCUSDT: '₿',
      ETHUSDT: 'Ξ',
      ADAUSDT: '₳',
      XRPUSDT: '✕',
    }
    return icons[symbol] || '●'
  }

  // Coin için renk
  const getCoinColor = (symbol) => {
    const colors = {
      BTCUSDT: 'text-bitcoin',
      ETHUSDT: 'text-blue-400',
      ADAUSDT: 'text-purple-400',
      XRPUSDT: 'text-gray-300',
    }
    return colors[symbol] || 'text-gray-400'
  }

  // Coin ismini al (BTCUSDT -> BTC)
  const getCoinName = (symbol) => {
    return symbol.replace('USDT', '')
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-white text-lg font-bold flex items-center gap-2">
            <span className="text-xl">💰</span>
            Anlık Coin Fiyatları
          </h3>
          <p className="text-gray-400 text-xs mt-1">
            Binance TR - Canlı veriler
          </p>
        </div>

        {/* Refresh Butonu */}
        <button
          onClick={handleRefresh}
          disabled={isFetching}
          className="px-4 py-2 bg-bitcoin/20 border border-bitcoin/50 text-bitcoin rounded-lg hover:bg-bitcoin/30 hover:border-bitcoin transition-all duration-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <span className={isFetching ? 'animate-spin' : ''}>🔄</span>
          {isFetching ? 'Yenileniyor...' : 'Yenile'}
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="text-4xl mb-3 animate-pulse">⏳</div>
          <p className="text-gray-400">Fiyatlar yükleniyor...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400 text-sm">
            ❌ Fiyatlar yüklenemedi: {error?.data?.message || error.error || 'Bağlantı hatası'}
          </p>
        </div>
      )}

      {/* Coin Listesi */}
      {!isLoading && !error && coins && (
        <div className="space-y-3">
          {coins.map((coin) => {
            const price = parseFloat(coin.price)
            const coinName = getCoinName(coin.symbol)
            const icon = getCoinIcon(coin.symbol)
            const color = getCoinColor(coin.symbol)

            const isSelected = coin.symbol === selectedSymbol

            return (
              <div
                key={coin.symbol}
                onClick={() => handleCoinClick(coin.symbol)}
                className={`bg-black/20 rounded-lg p-4 hover:bg-black/30 transition-all duration-200 border cursor-pointer ${
                  isSelected
                    ? 'border-bitcoin bg-bitcoin/10 ring-2 ring-bitcoin/50'
                    : 'border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  {/* Sol: Coin Bilgisi */}
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full bg-white/5 flex items-center justify-center ${color} text-2xl font-bold`}>
                      {icon}
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-lg">{coinName}</h4>
                      <p className="text-gray-400 text-xs">{coin.symbol}</p>
                    </div>
                  </div>

                  {/* Sağ: Fiyat */}
                  <div className="text-right">
                    <p className="text-white font-bold text-xl">
                      ${price.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: coinName === 'XRP' || coinName === 'ADA' ? 4 : 2,
                      })}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">USDT</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Footer - Otomatik Yenileme Bilgisi */}
      <div className="mt-4 pt-4 border-t border-white/5">
        <p className="text-gray-500 text-xs flex items-center justify-center gap-2">
          <span className="text-green-400 animate-pulse">●</span>
          Otomatik yenileme: Her 10 saniye
        </p>
        <p className="text-gray-600 text-xs mt-2 text-center">
          💡 Grafiği görmek için bir coin'e tıklayın
        </p>
      </div>
    </div>
  )
}

export default CoinList
