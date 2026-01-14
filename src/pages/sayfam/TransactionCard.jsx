/**
 * İşlem Yap Kartı Komponenti
 */
function TransactionCard() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-bitcoin/30 transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white text-xl font-bold flex items-center gap-2">
          <span className="text-2xl">💳</span>
          İşlem Yap
        </h3>
      </div>

      {/* İşlem Türü Seçimi */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 hover:bg-green-500/30 transition-all duration-300">
          <div className="text-3xl mb-2">📥</div>
          <p className="text-green-400 font-medium">Al</p>
        </button>
        <button className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 hover:bg-red-500/30 transition-all duration-300">
          <div className="text-3xl mb-2">📤</div>
          <p className="text-red-400 font-medium">Sat</p>
        </button>
      </div>

      {/* İşlem Formu */}
      <div className="space-y-4">
        <div>
          <label className="text-gray-400 text-sm mb-2 block">Coin Seç</label>
          <select className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-bitcoin focus:outline-none">
            <option value="BTC">Bitcoin (BTC)</option>
            <option value="ETH">Ethereum (ETH)</option>
            <option value="BNB">Binance Coin (BNB)</option>
            <option value="ADA">Cardano (ADA)</option>
            <option value="XRP">Ripple (XRP)</option>
            <option value="LINK">Chainlink (LINK)</option>
          </select>
        </div>

        <div>
          <label className="text-gray-400 text-sm mb-2 block">Miktar</label>
          <input
            type="number"
            placeholder="0.00"
            className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-bitcoin focus:outline-none"
          />
        </div>

        <button className="w-full bg-bitcoin/20 border border-bitcoin/50 text-bitcoin rounded-lg py-3 font-medium hover:bg-bitcoin/30 hover:border-bitcoin transition-all duration-300">
          İşlemi Onayla
        </button>
      </div>
    </div>
  )
}

export default TransactionCard
