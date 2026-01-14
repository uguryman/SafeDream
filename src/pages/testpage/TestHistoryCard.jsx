import { useState } from 'react'
import { useGetTestAllOrdersQuery, useGetTestOpenOrdersQuery, useCancelTestOrderMutation } from '../../store/api/binanceTestnetApi'

/**
 * Test İşlem Geçmişi Kartı Komponenti
 * Binance Testnet emir geçmişi ve açık emirler
 */
function TestHistoryCard() {
  const [view, setView] = useState('open') // 'all' veya 'open'
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT')
  const [limit, setLimit] = useState(50) // Gösterilecek emir sayısı

  // Tüm emirler (sadece seçili symbol için)
  const { data: allOrders, isLoading: isLoadingAll, refetch: refetchAll } = useGetTestAllOrdersQuery(
    { symbol: selectedSymbol, limit: limit },
    { skip: view !== 'all' } // Sadece 'all' görünümünde çek
  )

  // Açık emirler (tüm coinler için - symbol parametresi null)
  const { data: openOrders, isLoading: isLoadingOpen, refetch: refetchOpen } = useGetTestOpenOrdersQuery(
    null // null gönderince tüm coinlerin açık emirlerini getirir
  )

  // Emir iptal etme
  const [cancelOrder, { isLoading: isCancelling }] = useCancelTestOrderMutation()

  // Emir iptal et
  const handleCancelOrder = async (symbol, orderId) => {
    if (!confirm('Bu emri iptal etmek istediğinize emin misiniz?')) return

    try {
      await cancelOrder({ symbol, orderId }).unwrap()
      alert('✅ Emir iptal edildi')
      refetchOpen()
      if (view === 'all') refetchAll()
    } catch (error) {
      alert(`❌ Hata: ${error?.data?.message || error?.data?.msg || error?.error || 'Emir iptal edilemedi'}`)
    }
  }

  // Emir durumu badge'i
  const getStatusBadge = (status) => {
    const statusMap = {
      NEW: { text: '🆕 Yeni', color: 'bg-blue-500/20 text-blue-400' },
      PARTIALLY_FILLED: { text: '⏳ Kısmi', color: 'bg-yellow-500/20 text-yellow-400' },
      FILLED: { text: '✅ Tamamlandı', color: 'bg-green-500/20 text-green-400' },
      CANCELED: { text: '❌ İptal', color: 'bg-red-500/20 text-red-400' },
      REJECTED: { text: '⛔ Reddedildi', color: 'bg-red-600/20 text-red-500' },
      EXPIRED: { text: '⏰ Süresi Doldu', color: 'bg-gray-500/20 text-gray-400' },
    }
    return statusMap[status] || { text: status, color: 'bg-gray-500/20 text-gray-400' }
  }

  // Tarih formatla
  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Emirleri en yeniden en eskiye sırala
  const sortedOpenOrders = openOrders ? [...openOrders].sort((a, b) => b.time - a.time) : []
  const sortedAllOrders = allOrders ? [...allOrders].sort((a, b) => b.time - a.time) : []

  const displayOrders = view === 'open' ? sortedOpenOrders : sortedAllOrders
  const isLoading = view === 'open' ? isLoadingOpen : isLoadingAll

  // Daha fazla yükle
  const loadMore = () => {
    setLimit(prevLimit => prevLimit + 50)
  }

  // Coin değiştiğinde limit'i sıfırla
  const handleSymbolChange = (newSymbol) => {
    setSelectedSymbol(newSymbol)
    setLimit(50)
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-6 hover:border-bitcoin/30 transition-all duration-300">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h3 className="text-white text-lg sm:text-xl font-bold flex items-center gap-2">
          <span className="text-xl sm:text-2xl">📊</span>
          Test Geçmişi
        </h3>
        <button
          onClick={() => (view === 'open' ? refetchOpen() : refetchAll())}
          className="text-bitcoin text-xs sm:text-sm hover:text-bitcoin/80 transition-colors"
        >
          🔄 <span className="hidden sm:inline">Yenile</span>
        </button>
      </div>

      {/* View Toggle */}
      <div className="mb-4">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setView('open')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              view === 'open'
                ? 'bg-bitcoin/30 border border-bitcoin text-bitcoin'
                : 'bg-black/30 border border-white/10 text-gray-400 hover:border-white/20'
            }`}
          >
            Açık Emirler {openOrders && openOrders.length > 0 && `(${openOrders.length})`}
          </button>
          <button
            onClick={() => setView('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              view === 'all'
                ? 'bg-bitcoin/30 border border-bitcoin text-bitcoin'
                : 'bg-black/30 border border-white/10 text-gray-400 hover:border-white/20'
            }`}
          >
            Geçmiş
          </button>
        </div>

        {/* Coin Seçimi - Sadece 'all' görünümünde */}
        {view === 'all' && (
          <select
            value={selectedSymbol}
            onChange={(e) => handleSymbolChange(e.target.value)}
            className="w-full mt-2 bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-bitcoin focus:outline-none"
          >
            <option value="BTCUSDT">Bitcoin (BTC/USDT)</option>
            <option value="ETHUSDT">Ethereum (ETH/USDT)</option>
            <option value="BNBUSDT">Binance Coin (BNB/USDT)</option>
            <option value="ADAUSDT">Cardano (ADA/USDT)</option>
            <option value="XRPUSDT">Ripple (XRP/USDT)</option>
          </select>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="text-4xl mb-3 animate-pulse">⏳</div>
          <p className="text-gray-400">Yükleniyor...</p>
        </div>
      )}

      {/* Emirler Listesi */}
      {!isLoading && (
        <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
          {displayOrders && displayOrders.length > 0 ? (
            displayOrders.map((order) => {
              const status = getStatusBadge(order.status)
              return (
                <div
                  key={order.orderId}
                  className="bg-black/20 rounded-lg p-4 border border-white/5 hover:border-white/10 transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold ${
                          order.side === 'BUY'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {order.side === 'BUY' ? '↓' : '↑'}
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {order.side === 'BUY' ? 'Alış' : 'Satış'} - {order.symbol}
                        </p>
                        <p className="text-gray-400 text-xs">{formatDate(order.time)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold text-sm">{order.type}</p>
                      <p className="text-gray-400 text-xs">#{order.orderId}</p>
                    </div>
                  </div>

                  {/* Emir Detayları */}
                  <div className="grid grid-cols-2 gap-2 mt-3 mb-3">
                    <div className="bg-black/30 rounded p-2">
                      <p className="text-gray-400 text-xs">Miktar</p>
                      <p className="text-white text-sm font-medium">
                        {parseFloat(order.origQty).toFixed(8)}
                      </p>
                    </div>
                    <div className="bg-black/30 rounded p-2">
                      <p className="text-gray-400 text-xs">Fiyat</p>
                      <p className="text-white text-sm font-medium">
                        ${parseFloat(order.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  {/* Durum ve İptal Butonu */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <span className={`text-xs px-2 py-1 rounded ${status.color}`}>
                      {status.text}
                    </span>
                    {order.status === 'NEW' && view === 'open' && (
                      <button
                        onClick={() => handleCancelOrder(order.symbol, order.orderId)}
                        disabled={isCancelling}
                        className="text-xs px-3 py-1 bg-red-500/20 border border-red-500/50 text-red-400 rounded hover:bg-red-500/30 transition-all disabled:opacity-50"
                      >
                        İptal Et
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-gray-400">
                {view === 'open' ? 'Açık emir bulunmuyor' : 'Henüz işlem geçmişiniz yok'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Daha Fazla Yükle Butonu - Sadece 'all' görünümünde */}
      {!isLoading && view === 'all' && displayOrders && displayOrders.length >= limit && (
        <div className="mt-4">
          <button
            onClick={loadMore}
            className="w-full px-4 py-3 bg-bitcoin/10 border border-bitcoin/30 text-bitcoin rounded-lg hover:bg-bitcoin/20 transition-all font-medium text-sm flex items-center justify-center gap-2"
          >
            <span>⬇️</span>
            Daha Eski Emirler (50 daha)
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-white/5">
        <p className="text-gray-500 text-xs flex items-center justify-center gap-2">
          <span className="text-blue-400">ℹ️</span>
          {view === 'all'
            ? `${displayOrders?.length || 0} emir gösteriliyor`
            : 'Manuel yenileme - Yenile butonuna tıklayın'
          }
        </p>
      </div>
    </div>
  )
}

export default TestHistoryCard
