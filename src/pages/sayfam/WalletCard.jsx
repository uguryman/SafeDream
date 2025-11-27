/**
 * Cüzdanım Kartı Komponenti
 */
function WalletCard() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-bitcoin/30 transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white text-xl font-bold flex items-center gap-2">
          <span className="text-2xl">💼</span>
          Cüzdanım
        </h3>
      </div>

      {/* Bakiye Kartı */}
      <div className="bg-gradient-to-br from-bitcoin/20 to-bitcoin/5 border border-bitcoin/30 rounded-xl p-6 mb-4">
        <p className="text-gray-300 text-sm mb-2">Toplam Bakiye</p>
        <p className="text-white text-4xl font-bold mb-1">$12,458.50</p>
        <p className="text-green-400 text-sm flex items-center gap-1">
          <span>↑</span>
          <span>+2.45% (24s)</span>
        </p>
      </div>

      {/* Coin Bakiyeleri */}
      <div className="space-y-3">
        <div className="bg-black/20 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-bitcoin/20 rounded-full flex items-center justify-center text-bitcoin text-xl font-bold">
              ₿
            </div>
            <div>
              <p className="text-white font-medium">Bitcoin</p>
              <p className="text-gray-400 text-xs">BTC</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white font-bold">0.245 BTC</p>
            <p className="text-gray-400 text-sm">$10,250.00</p>
          </div>
        </div>

        <div className="bg-black/20 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 text-xl font-bold">
              Ξ
            </div>
            <div>
              <p className="text-white font-medium">Ethereum</p>
              <p className="text-gray-400 text-xs">ETH</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white font-bold">1.85 ETH</p>
            <p className="text-gray-400 text-sm">$2,208.50</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WalletCard
