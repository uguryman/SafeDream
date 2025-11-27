import { useGetBalanceQuery } from '../../store/api/binanceApi'
import { useGetDirectMultipleTickerPricesQuery } from '../../store/api/binanceDirectApi'

/**
 * Cüzdanım Kartı Komponenti
 * Binance Global hesap bakiyelerini gerçek zamanlı gösterir
 */
function WalletCard() {
  // Backend'den gerçek bakiye verisi (30sn otomatik yenileme)
  const { data: balanceData, isLoading, error, refetch, isFetching } = useGetBalanceQuery(undefined, {
    pollingInterval: 30000,
  })

  // Bakiyedeki coin'lerin güncel fiyatları için semboller
  const symbols = balanceData?.balances?.map(b => `${b.asset}USDT`) || []

  // Fiyat bilgileri (10sn otomatik yenileme)
  const { data: prices } = useGetDirectMultipleTickerPricesQuery(symbols, {
    skip: !balanceData || symbols.length === 0, // Bakiye gelene kadar çalıştırma
    pollingInterval: 10000,
  })

  // Toplam bakiye hesaplama (USD)
  const calculateTotalBalance = () => {
    if (!balanceData?.balances || !prices) return 0

    let total = 0
    balanceData.balances.forEach(balance => {
      const price = prices.find(p => p.symbol === `${balance.asset}USDT`)
      if (price) {
        total += balance.total * parseFloat(price.price)
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
          <div className="text-4xl mb-3 animate-pulse">💼</div>
          <p className="text-gray-400">Cüzdan bakiyesi yükleniyor...</p>
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
            <span className="text-2xl">💼</span>
            Cüzdanım
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
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-bitcoin/30 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white text-xl font-bold flex items-center gap-2">
          <span className="text-2xl">💼</span>
          Cüzdanım
        </h3>

        {/* Yenile Butonu */}
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="px-3 py-1.5 bg-bitcoin/20 border border-bitcoin/50 text-bitcoin rounded-lg hover:bg-bitcoin/30 transition-all text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <span className={isFetching ? 'animate-spin' : ''}>🔄</span>
          {isFetching ? 'Yenileniyor...' : 'Yenile'}
        </button>
      </div>

      {/* Toplam Bakiye Kartı */}
      <div className="bg-gradient-to-br from-bitcoin/20 to-bitcoin/5 border border-bitcoin/30 rounded-xl p-6 mb-4">
        <p className="text-gray-300 text-sm mb-2">Toplam Bakiye</p>
        <p className="text-white text-4xl font-bold mb-1">
          ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className="text-gray-400 text-xs mt-2 flex items-center gap-2">
          <span>💎</span>
          {balanceData?.totalAssets || 0} farklı varlık
        </p>
      </div>

      {/* Coin Bakiyeleri */}
      <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
        {balanceData?.balances && balanceData.balances.length > 0 ? (
          balanceData.balances.map((balance) => {
            const price = prices?.find(p => p.symbol === `${balance.asset}USDT`)
            const usdValue = price ? balance.total * parseFloat(price.price) : 0

            return (
              <div
                key={balance.asset}
                className="bg-black/20 rounded-lg p-4 flex items-center justify-between hover:bg-black/30 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold ${getCoinColor(balance.asset)}`}>
                    {getCoinIcon(balance.asset)}
                  </div>
                  <div>
                    <p className="text-white font-medium">{balance.asset}</p>
                    <p className="text-gray-400 text-xs">
                      {balance.locked > 0 ? `${balance.free.toFixed(8)} kullanılabilir` : 'Kullanılabilir'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold">
                    {balance.total.toFixed(8)} {balance.asset}
                  </p>
                  <p className="text-gray-400 text-sm">
                    ${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            )
          })
        ) : (
          <div className="bg-black/20 rounded-lg p-6 text-center">
            <p className="text-gray-400 text-sm">Henüz bakiye bulunmuyor</p>
          </div>
        )}
      </div>

      {/* Footer - Otomatik Yenileme */}
      <div className="mt-4 pt-4 border-t border-white/5">
        <p className="text-gray-500 text-xs flex items-center justify-center gap-2">
          <span className="text-green-400 animate-pulse">●</span>
          Otomatik yenileme: Her 30 saniye
        </p>
      </div>
    </div>
  )
}

export default WalletCard
