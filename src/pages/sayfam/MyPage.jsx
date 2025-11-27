import Navbar from '../../components/Navbar'
import WalletCard from './WalletCard'
import TransactionCard from './TransactionCard'
import HistoryCard from './HistoryCard'

/**
 * Sayfam Komponenti
 * Kullanıcının kişisel işlem sayfası
 */
function MyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
      <Navbar />

      <main className="container mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="text-white text-3xl font-bold mb-2 flex items-center gap-3">
            <span className="text-2xl">👤</span>
            Sayfam
          </h2>
          <p className="text-gray-400">Cüzdan, işlemler ve geçmiş</p>
        </div>

        {/* Kartlar Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cüzdanım */}
          <WalletCard />

          {/* İşlem Yap */}
          <TransactionCard />

          {/* Geçmiş */}
          <HistoryCard />
        </div>
      </main>
    </div>
  )
}

export default MyPage
