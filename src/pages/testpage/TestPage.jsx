import { useState } from 'react'
import Navbar from '../../components/Navbar'
import TestWalletCard from './TestWalletCard'
import TestTransactionCard from './TestTransactionCard'
import TestHistoryCard from './TestHistoryCard'
import CoinList from '../../components/CoinList'

/**
 * Test Sayfası Komponenti
 * Binance Testnet üzerinde işlem yapma sayfası
 */
function TestPage() {
  const [activeTab, setActiveTab] = useState('wallet') // 'market', 'wallet', 'trade', 'orders'

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] pb-20 desktop:pb-0 test-page-wrapper">
      <Navbar />

      <main className="container mx-auto px-3 sm:px-6 py-6 sm:py-12">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-white text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-2 sm:gap-3">
            <span className="text-xl sm:text-2xl">🧪</span>
            Test Sayfası
          </h2>
          <p className="text-gray-400 text-sm sm:text-base">Binance Testnet - Gerçek para kullanılmaz</p>
        </div>

        {/* Desktop Grid - Tablette ve üstü (portrait mode) */}
        <div className="hidden desktop:grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          <TestWalletCard />
          <TestTransactionCard />
          <TestHistoryCard />
        </div>

        {/* Mobil Tek Kart Görünümü */}
        <div className="desktop:hidden">
          {activeTab === 'market' && <CoinList />}
          {activeTab === 'wallet' && <TestWalletCard />}
          {activeTab === 'trade' && <TestTransactionCard />}
          {activeTab === 'orders' && <TestHistoryCard />}
        </div>
      </main>

      {/* Mobil Alt Navigasyon - Portrait: alt, Landscape: sağ */}
      <nav className="desktop:hidden fixed bottom-0 left-0 right-0 bg-[#1a1625]/95 backdrop-blur-md border-t border-white/10 z-50 mobile-nav-landscape">
        <div className="grid grid-cols-4 gap-1 px-2 py-2 mobile-nav-grid">
          <button
            onClick={() => setActiveTab('market')}
            className={`flex flex-col items-center justify-center py-3 rounded-lg transition-all ${
              activeTab === 'market'
                ? 'bg-bitcoin/20 border border-bitcoin/50 text-bitcoin'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <span className="text-2xl mb-1">📈</span>
            <span className="text-xs font-medium nav-text">Piyasa</span>
          </button>
          <button
            onClick={() => setActiveTab('wallet')}
            className={`flex flex-col items-center justify-center py-3 rounded-lg transition-all ${
              activeTab === 'wallet'
                ? 'bg-bitcoin/20 border border-bitcoin/50 text-bitcoin'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <span className="text-2xl mb-1">💼</span>
            <span className="text-xs font-medium nav-text">Cüzdan</span>
          </button>
          <button
            onClick={() => setActiveTab('trade')}
            className={`flex flex-col items-center justify-center py-3 rounded-lg transition-all ${
              activeTab === 'trade'
                ? 'bg-bitcoin/20 border border-bitcoin/50 text-bitcoin'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <span className="text-2xl mb-1">💳</span>
            <span className="text-xs font-medium nav-text">İşlem</span>
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex flex-col items-center justify-center py-3 rounded-lg transition-all ${
              activeTab === 'orders'
                ? 'bg-bitcoin/20 border border-bitcoin/50 text-bitcoin'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <span className="text-2xl mb-1">📊</span>
            <span className="text-xs font-medium nav-text">Emirler</span>
          </button>
        </div>
      </nav>
    </div>
  )
}

export default TestPage
