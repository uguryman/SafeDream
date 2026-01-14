import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useGetDirectTickerPriceQuery } from '../store/api/binanceDirectApi'
import Navbar from '../components/Navbar'
import PriceChart from '../components/PriceChart'
import CoinList from '../components/CoinList'

function Home() {
  // Seçili coin state'i (default: BTC)
  const [selectedCoin, setSelectedCoin] = useState({ symbol: 'BTCUSDT', name: 'BTC' })

  // Seçili coin'in fiyatı
  const { data: selectedCoinPrice } = useGetDirectTickerPriceQuery(selectedCoin.symbol)

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
      <Navbar />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="glass-effect rounded-3xl p-12 border border-bitcoin/20 shadow-2xl">
          <h2 className="text-white text-3xl font-bold mb-6 flex items-center gap-3">
            <span className="text-2xl">🏠</span>
            Ana Sayfa
          </h2>

          <div className="space-y-6">
            {/* Hoş Geldin Mesajı */}
            <div className="bg-bitcoin/10 border border-bitcoin/30 rounded-xl p-6">
              <p className="text-bitcoin text-lg font-medium mb-2">
                Hoş Geldiniz!
              </p>
              <p className="text-gray-300 text-sm">
                Güvenli giriş portalına başarıyla giriş yaptınız.
              </p>
            </div>

            {/* Hızlı Erişim Butonları */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                to="/mypage"
                className="group bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/30 rounded-xl p-6 hover:border-purple-500/50 transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                    👤
                  </div>
                  <div>
                    <h3 className="text-white text-xl font-bold mb-1">Sayfam</h3>
                    <p className="text-gray-400 text-sm">Cüzdan ve gerçek işlemler</p>
                  </div>
                </div>
              </Link>

              <Link
                to="/testpage"
                className="group bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/30 rounded-xl p-6 hover:border-green-500/50 transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                    🧪
                  </div>
                  <div>
                    <h3 className="text-white text-xl font-bold mb-1">Test Sayfası</h3>
                    <p className="text-gray-400 text-sm">Testnet ile deneme yapın</p>
                  </div>
                </div>
              </Link>
            </div>

            {/* Anlık Coin Fiyatları */}
            <CoinList onCoinSelect={setSelectedCoin} selectedSymbol={selectedCoin.symbol} />

            {/* Canlı Fiyat Grafiği */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <PriceChart
                currentPrice={selectedCoinPrice?.price}
                symbol={`${selectedCoin.name}/USDT`}
              />
            </div>

            {/* İstatistikler */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-bitcoin/20 to-bitcoin/5 border border-bitcoin/30 rounded-xl p-6 text-center">
                <div className="text-3xl mb-2">🔒</div>
                <div className="text-bitcoin text-2xl font-bold mb-1">100%</div>
                <div className="text-gray-400 text-sm">Güvenlik Seviyesi</div>
              </div>

              <div className="bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/30 rounded-xl p-6 text-center">
                <div className="text-3xl mb-2">✓</div>
                <div className="text-green-400 text-2xl font-bold mb-1">Aktif</div>
                <div className="text-gray-400 text-sm">Oturum Durumu</div>
              </div>

              <div className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/30 rounded-xl p-6 text-center">
                <div className="text-3xl mb-2">⏱</div>
                <div className="text-blue-400 text-2xl font-bold mb-1">30 gün</div>
                <div className="text-gray-400 text-sm">Oturum Süresi</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Home
