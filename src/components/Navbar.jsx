import { Link, useLocation } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { logout } from '../store/slices/authSlice'
import { useLogoutMutation } from '../store/api/authApi'
import { useState } from 'react'

/**
 * Navbar Komponenti
 * Üst menü navigasyonu
 */
function Navbar() {
  const location = useLocation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [logoutApi] = useLogoutMutation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap()
    } catch (error) {
    } finally {
      dispatch(logout())
      navigate('/login')
    }
  }

  const isActive = (path) => {
    return location.pathname === path
  }

  return (
    <header className="glass-effect border-b border-bitcoin/20 sticky top-0 z-50">
      <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-2xl sm:text-4xl glow-bitcoin-strong">₿</span>
            <h1 className="text-white text-lg sm:text-2xl font-bold uppercase tracking-wider">
              Safe Dream
            </h1>
          </div>

          {/* Desktop Menü - lg+ ekranlarda görünür */}
          <nav className="hidden lg:flex items-center gap-2">
            <Link
              to="/home"
              className={`px-4 xl:px-6 py-2 rounded-lg font-medium transition-all duration-300 text-sm xl:text-base ${
                isActive('/home')
                  ? 'bg-bitcoin/20 border border-bitcoin/50 text-bitcoin'
                  : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              🏠 Ana Sayfa
            </Link>
            <Link
              to="/mypage"
              className={`px-4 xl:px-6 py-2 rounded-lg font-medium transition-all duration-300 text-sm xl:text-base ${
                isActive('/mypage')
                  ? 'bg-bitcoin/20 border border-bitcoin/50 text-bitcoin'
                  : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              👤 Sayfam
            </Link>
            <Link
              to="/testpage"
              className={`px-4 xl:px-6 py-2 rounded-lg font-medium transition-all duration-300 text-sm xl:text-base ${
                isActive('/testpage')
                  ? 'bg-bitcoin/20 border border-bitcoin/50 text-bitcoin'
                  : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              🧪 Test Sayfası
            </Link>
            <button
              onClick={handleLogout}
              className="ml-2 xl:ml-4 px-4 xl:px-6 py-2 bg-red-500/20 border border-red-500/50 text-red-300 rounded-lg hover:bg-red-500/30 hover:border-red-500 transition-all duration-300 font-medium text-sm xl:text-base"
            >
              🚪 Çıkış
            </button>
          </nav>

          {/* Mobil Hamburger Butonu - lg altı ekranlarda görünür */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobil Menü - lg altı ekranlarda görünür */}
        {mobileMenuOpen && (
          <nav className="lg:hidden mt-4 flex flex-col gap-2 pb-2">
            <Link
              to="/home"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                isActive('/home')
                  ? 'bg-bitcoin/20 border border-bitcoin/50 text-bitcoin'
                  : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              🏠 Ana Sayfa
            </Link>
            <Link
              to="/mypage"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                isActive('/mypage')
                  ? 'bg-bitcoin/20 border border-bitcoin/50 text-bitcoin'
                  : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              👤 Sayfam
            </Link>
            <Link
              to="/testpage"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                isActive('/testpage')
                  ? 'bg-bitcoin/20 border border-bitcoin/50 text-bitcoin'
                  : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              🧪 Test Sayfası
            </Link>
            <button
              onClick={() => {
                setMobileMenuOpen(false)
                handleLogout()
              }}
              className="px-4 py-3 bg-red-500/20 border border-red-500/50 text-red-300 rounded-lg hover:bg-red-500/30 hover:border-red-500 transition-all duration-300 font-medium text-left"
            >
              🚪 Çıkış
            </button>
          </nav>
        )}
      </div>
    </header>
  )
}

export default Navbar
