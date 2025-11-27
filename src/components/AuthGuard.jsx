import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'
import { setAccessToken } from '../store/slices/authSlice'
import { useRefreshTokenMutation } from '../store/api/authApi'

/**
 * AuthGuard - Korumalı sayfalarda token restore eder
 *
 * Akış:
 * 1. Korumalı sayfa açıldığında çalışır
 * 2. Redux store'da access token var mı kontrol eder
 * 3. Yoksa → refresh-token endpoint'ine istek atar
 * 4. Cookie'deki refresh token ile yeni access token alır
 * 5. Başarılıysa → Sayfa gösterilir
 * 6. Başarısızsa → Login'e yönlendirir
 */
export function AuthGuard({ children }) {
  const dispatch = useDispatch()
  const { accessToken, isAuthenticated } = useSelector((state) => state.auth)
  const [refreshToken] = useRefreshTokenMutation()
  const [isChecking, setIsChecking] = useState(true)
  const [shouldRedirect, setShouldRedirect] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      // Zaten access token varsa, kontrol etme
      if (accessToken) {
        setIsChecking(false)
        return
      }

      // Access token yok - Cookie'deki refresh token ile yeni token al
      try {
        const result = await refreshToken().unwrap()

        if (result.accessToken) {
          // Başarılı! Yeni access token'ı Redux'a kaydet
          dispatch(setAccessToken(result.accessToken))
        }
      } catch (error) {
        // Refresh token başarısız - Ama sadece ilk yüklemede redirect et
        // Cookie yoksa veya expire olduysa login'e git
        setShouldRedirect(true)
      } finally {
        setIsChecking(false)
      }
    }

    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Sadece ilk mount'ta çalış

  // Token kontrolü yapılırken loading göster
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
        <div className="text-center">
          <div className="text-6xl mb-4 glow-bitcoin-strong animate-pulse">₿</div>
          <p className="text-white text-lg">Oturum kontrol ediliyor...</p>
        </div>
      </div>
    )
  }

  // Sadece shouldRedirect true ise yönlendir
  // isAuthenticated kontrolünü kaldır çünkü access token memory'de kalıyor (dev mode)
  if (shouldRedirect) {
    return <Navigate to="/login" replace />
  }

  // Access token varsa sayfa göster
  if (accessToken) {
    return children
  }

  // Token yok ve refresh de başarısız - Login'e git
  return <Navigate to="/login" replace />
}
