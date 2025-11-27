import { Link, useLocation } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { logout } from '../store/slices/authSlice'
import { useLogoutMutation } from '../store/api/authApi'

/**
 * Navbar Komponenti
 * Üst menü navigasyonu
 */
function Navbar() {
  const location = useLocation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [logoutApi] = useLogoutMutation()

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
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <span className="text-4xl glow-bitcoin-strong">₿</span>
            <h1 className="text-white text-2xl font-bold uppercase tracking-wider">
              Safe Dream
            </h1>
          </div>

          {/* Menü */}
          <nav className="flex items-center gap-2">
            <Link
              to="/home"
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 ${
                isActive('/home')
                  ? 'bg-bitcoin/20 border border-bitcoin/50 text-bitcoin'
                  : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              🏠 Ana Sayfa
            </Link>
            <Link
              to="/mypage"
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 ${
                isActive('/mypage')
                  ? 'bg-bitcoin/20 border border-bitcoin/50 text-bitcoin'
                  : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              👤 Sayfam
            </Link>
            <button
              onClick={handleLogout}
              className="ml-4 px-6 py-2 bg-red-500/20 border border-red-500/50 text-red-300 rounded-lg hover:bg-red-500/30 hover:border-red-500 transition-all duration-300 font-medium"
            >
              🚪 Çıkış
            </button>
          </nav>
        </div>
      </div>
    </header>
  )
}

export default Navbar
