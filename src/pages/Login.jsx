import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useLoginMutation } from '../store/api/authApi'
import { setCredentials } from '../store/slices/authSlice'

function Login() {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // RTK Query Mutation Hook
  const [login, { isLoading }] = useLoginMutation()

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      // API'ye login isteği gönder
      const result = await login({
        kullaniciadi: email,
        sifre: password,
      }).unwrap()

      // Access token'ı Redux store'a kaydet (memory'de)
      // Refresh token HTTP-Only cookie'de, frontend görmez
      dispatch(setCredentials({ accessToken: result.accessToken }))

      // Home sayfasına yönlendir
      navigate('/home')
    } catch (err) {
      // Hata detaylarını console'a yazdır
      console.error('Login Hatası Detayı:', err)
      console.error('Hata Status:', err?.status)
      console.error('Hata Data:', err?.data)
      console.error('Hata Message:', err?.data?.message || err?.error || err?.message)

      // Kullanıcıya göster
      alert('Giriş Hatası: ' + (err?.data?.message || err?.error || err?.message || 'Sunucu hatası'))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden">
      {/* Animasyonlu Arka Plan Elementleri */}
      <div className="absolute top-[-200px] right-[-200px] w-[500px] h-[500px] rounded-full bg-gradient-radial from-bitcoin/10 to-transparent animate-pulse-slow"></div>
      <div className="absolute bottom-[-150px] left-[-150px] w-[400px] h-[400px] rounded-full bg-gradient-radial from-bitcoin/8 to-transparent animate-pulse-slow" style={{ animationDelay: '1s' }}></div>

      {/* Giriş Kutusu */}
      <div className="glass-effect w-full max-w-md mx-4 p-12 rounded-3xl border border-bitcoin/20 shadow-2xl relative z-10">
        {/* Bitcoin Logo */}
        <div className="text-center text-6xl mb-5 glow-bitcoin-strong">
          ₿
        </div>

        {/* Başlık */}
        <h1 className="text-white text-center text-4xl font-bold uppercase tracking-wider mb-2">
          Safe Dream
        </h1>
        <p className="text-bitcoin text-center text-sm font-medium uppercase tracking-widest mb-8">
          Güvenli Giriş Portalı
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Alanı */}
          <div>
            <label
              htmlFor="email"
              className="block text-gray-300 text-xs font-medium uppercase tracking-wider mb-2"
            >
              E-Posta Adresi
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@email.com"
              required
              disabled={isLoading}
              className="w-full px-5 py-4 bg-white/5 border-2 border-bitcoin/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-bitcoin focus:bg-white/10 glow-bitcoin transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Şifre Alanı */}
          <div>
            <label
              htmlFor="password"
              className="block text-gray-300 text-xs font-medium uppercase tracking-wider mb-2"
            >
              Şifre
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifrenizi girin"
              required
              disabled={isLoading}
              className="w-full px-5 py-4 bg-white/5 border-2 border-bitcoin/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-bitcoin focus:bg-white/10 glow-bitcoin transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Giriş Butonu */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 mt-4 bg-gradient-to-r from-bitcoin to-bitcoin-dark text-white font-bold text-base uppercase tracking-wider rounded-xl hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(247,147,26,0.5)] active:translate-y-0 transition-all duration-300 glow-bitcoin disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {isLoading ? 'Giriş Yapılıyor...' : 'Platforma Giriş Yap'}
          </button>
        </form>

        {/* Güvenlik Rozeti */}
        <div className="mt-6 pt-5 border-t border-bitcoin/10 text-center text-gray-500 text-xs flex items-center justify-center gap-2">
          <span className="text-sm">🔒</span>
          256-bit Şifreli Bağlantı
        </div>
      </div>
    </div>
  )
}

export default Login
