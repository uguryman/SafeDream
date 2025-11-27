/**
 * İşlem Geçmişi Kartı Komponenti
 */
function HistoryCard() {
  const transactions = [
    {
      id: 1,
      type: 'buy',
      coin: 'BTC',
      amount: '0.025',
      price: '$1,050.00',
      date: '2024-01-15 14:30',
      status: 'completed',
    },
    {
      id: 2,
      type: 'sell',
      coin: 'ETH',
      amount: '0.5',
      price: '$750.00',
      date: '2024-01-14 09:15',
      status: 'completed',
    },
    {
      id: 3,
      type: 'buy',
      coin: 'ADA',
      amount: '1000',
      price: '$450.00',
      date: '2024-01-13 16:45',
      status: 'pending',
    },
  ]

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-bitcoin/30 transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white text-xl font-bold flex items-center gap-2">
          <span className="text-2xl">📊</span>
          İşlem Geçmişi
        </h3>
        <button className="text-bitcoin text-sm hover:text-bitcoin/80 transition-colors">
          Tümünü Gör →
        </button>
      </div>

      {/* İşlem Listesi */}
      <div className="space-y-3">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="bg-black/20 rounded-lg p-4 border border-white/5 hover:border-white/10 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold ${
                    tx.type === 'buy'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {tx.type === 'buy' ? '↓' : '↑'}
                </div>
                <div>
                  <p className="text-white font-medium">
                    {tx.type === 'buy' ? 'Alış' : 'Satış'} - {tx.coin}
                  </p>
                  <p className="text-gray-400 text-xs">{tx.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-bold">{tx.amount} {tx.coin}</p>
                <p className="text-gray-400 text-sm">{tx.price}</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <span
                className={`text-xs px-2 py-1 rounded ${
                  tx.status === 'completed'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}
              >
                {tx.status === 'completed' ? '✓ Tamamlandı' : '⏳ Bekliyor'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Boş state göstermek için */}
      {transactions.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-gray-400">Henüz işlem geçmişiniz yok</p>
        </div>
      )}
    </div>
  )
}

export default HistoryCard
