import { useGetTestBalanceQuery, useGetMultipleTickerPricesQuery } from '../../store/api/binanceTestnetApi'

/**
 * Test Cüzdanı Kartı Komponenti
 * Binance Testnet hesap bakiyelerini gerçek zamanlı gösterir
 */
function TestWalletCard() {
  // Backend'den testnet bakiye verisi (manuel yenileme)
  const { data: balanceData, isLoading, error, refetch, isFetching } = useGetTestBalanceQuery()

  // Sadece gösterilecek coin'ler
  const allowedCoins = ['ADA', 'BNB', 'BTC', 'ETH', 'LINK', 'USDC', 'USDT', 'XRP']

  // Bakiyeleri filtrele - sadece izin verilen coin'leri göster
  const filteredBalances = balanceData?.balances?.filter(b =>
    allowedCoins.includes(b.asset) && b.total > 0
  ) || []

  // Bakiyedeki coin'lerin güncel fiyatları için semboller (USDT ve USDC hariç)
  const symbols = filteredBalances
    .filter(b => b.asset !== 'USDT' && b.asset !== 'USDC')
    .map(b => `${b.asset}USDT`)

  // Fiyat bilgileri (manuel yenileme) - Backend üzerinden
  const { data: prices } = useGetMultipleTickerPricesQuery(symbols, {
    skip: !balanceData || symbols.length === 0,
  })

  // Toplam bakiye hesaplama (USD)
  const calculateTotalBalance = () => {
    if (!filteredBalances) return 0

    let total = 0
    filteredBalances.forEach(balance => {
      // USDT ve USDC için fiyat 1 USD
      if (balance.asset === 'USDT' || balance.asset === 'USDC') {
        total += balance.total
      } else if (prices && Array.isArray(prices)) {
        const price = prices.find(p => p.symbol === `${balance.asset}USDT`)
        if (price) {
          total += balance.total * parseFloat(price.price)
        }
      }
    })
    return total
  }

  const totalBalance = calculateTotalBalance()

  // Coin için icon
  const getCoinIcon = (asset) => {
    const icons = {
      BTC: '₿',
      ETH: 'Ξ',
      BNB: '🔶',
      USDT: '₮',
      USDC: '💵',
      ADA: '₳',
      XRP: '✕',
      LINK: '🔗',
      SOL: '◎',
      DOT: '●',
      DOGE: '🐕',
    }
    return icons[asset] || '●'
  }

  // Coin için renk
  const getCoinColor = (asset) => {
    const colors = {
      BTC: 'bg-bitcoin/20 text-bitcoin',
      ETH: 'bg-blue-500/20 text-blue-400',
      BNB: 'bg-yellow-500/20 text-yellow-400',
      USDT: 'bg-green-500/20 text-green-400',
      USDC: 'bg-blue-600/20 text-blue-300',
      ADA: 'bg-purple-500/20 text-purple-400',
      XRP: 'bg-gray-500/20 text-gray-300',
      LINK: 'bg-blue-500/20 text-blue-500',
      SOL: 'bg-purple-600/20 text-purple-300',
      DOT: 'bg-pink-500/20 text-pink-400',
      DOGE: 'bg-yellow-600/20 text-yellow-300',
    }
    return colors[asset] || 'bg-white/5 text-gray-400'
  }

  // Loading State
  if (isLoading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-bitcoin/30 transition-all duration-300">
        <div className="text-center py-12">
          <div className="text-4xl mb-3 animate-pulse">🧪</div>
          <p className="text-gray-400">Test cüzdanı yükleniyor...</p>
        </div>
      </div>
    )
  }

  // Error State
  if (error) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-bitcoin/30 transition-all duration-300">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white text-xl font-bold flex items-center gap-2">
            <span className="text-2xl">🧪</span>
            Test Cüzdanı
          </h3>
        </div>
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400 text-sm">
            ❌ Bakiye yüklenemedi: {error?.data?.message || error?.error || 'Bağlantı hatası'}
          </p>
          <button
            onClick={() => refetch()}
            className="mt-3 px-4 py-2 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/30 transition-all text-sm"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-6 hover:border-bitcoin/30 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h3 className="text-white text-lg sm:text-xl font-bold flex items-center gap-2">
          <span className="text-xl sm:text-2xl">🧪</span>
          Test Cüzdanı
        </h3>

        {/* Yenile Butonu */}
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="px-2 sm:px-3 py-1.5 bg-bitcoin/20 border border-bitcoin/50 text-bitcoin rounded-lg hover:bg-bitcoin/30 transition-all text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <span className={isFetching ? 'animate-spin' : ''}>🔄</span>
          <span className="hidden sm:inline">{isFetching ? 'Yenileniyor...' : 'Yenile'}</span>
        </button>
      </div>

      {/* Testnet Uyarısı */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4">
        <p className="text-yellow-400 text-xs flex items-center gap-2">
          <span>⚠️</span>
          Bu test cüzdanıdır. Gerçek para kullanılmaz.
        </p>
      </div>

      {/* Toplam Bakiye Kartı */}
      <div className="bg-gradient-to-br from-bitcoin/20 to-bitcoin/5 border border-bitcoin/30 rounded-xl p-4 sm:p-6 mb-3 sm:mb-4">
        <p className="text-gray-300 text-xs sm:text-sm mb-2">Toplam Bakiye (Testnet)</p>
        <p className="text-white text-2xl sm:text-4xl font-bold mb-1">
          ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className="text-gray-400 text-xs mt-2 flex items-center gap-2">
          <span>💎</span>
          {filteredBalances.length} farklı varlık
        </p>
      </div>

      {/* Coin Bakiyeleri */}
      <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
        {filteredBalances.length > 0 ? (
          filteredBalances.map((balance) => {
            // USDT ve USDC için fiyat direkt 1 USD
            let usdValue = 0
            if (balance.asset === 'USDT' || balance.asset === 'USDC') {
              usdValue = balance.total
            } else if (prices && Array.isArray(prices)) {
              const price = prices.find(p => p.symbol === `${balance.asset}USDT`)
              usdValue = price ? balance.total * parseFloat(price.price) : 0
            }

            return (
              <div
                key={balance.asset}
                className="bg-black/20 rounded-lg p-3 sm:p-4 flex items-center justify-between hover:bg-black/30 transition-all"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-lg sm:text-xl font-bold ${getCoinColor(balance.asset)}`}>
                    {getCoinIcon(balance.asset)}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm sm:text-base">{balance.asset}</p>
                    <p className="text-gray-400 text-xs hidden sm:block">
                      {balance.locked > 0 ? `${balance.free.toFixed(8)} kullanılabilir` : 'Kullanılabilir'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold text-xs sm:text-base">
                    {balance.total.toFixed(balance.total < 1 ? 4 : 2)} {balance.asset}
                  </p>
                  <p className="text-gray-400 text-xs sm:text-sm">
                    ${usdValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            )
          })
        ) : (
          <div className="bg-black/20 rounded-lg p-6 text-center">
            <p className="text-gray-400 text-sm">Henüz test bakiyesi bulunmuyor</p>
            <p className="text-gray-500 text-xs mt-2">Gösterilen coinler: ADA, BNB, BTC, ETH, USDC, USDT, XRP</p>
          </div>
        )}
      </div>

      {/* Footer - Manuel Yenileme */}
      <div className="mt-4 pt-4 border-t border-white/5">
        <p className="text-gray-500 text-xs flex items-center justify-center gap-2">
          <span className="text-blue-400">ℹ️</span>
          Manuel yenileme - Yenile butonuna tıklayın
        </p>
      </div>
    </div>
  )
}

export default TestWalletCard
