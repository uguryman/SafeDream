import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setAccessToken, logout } from '../store/slices/authSlice'
import { useRefreshTokenMutation } from '../store/api/authApi'

/**
 * TokenRefreshManager - Access token'ı otomatik yeniler
 *
 * Özellikler:
 * - Access token süresi dolmadan 2 dakika önce otomatik yeniler
 * - Kullanıcı 30 gün boyunca login kalır
 * - Refresh token süresi dolduğunda logout yapar
 * - Arka planda sessizce çalışır
 */
export function TokenRefreshManager() {
  const dispatch = useDispatch()
  const { accessToken, isAuthenticated } = useSelector((state) => state.auth)
  const [refreshToken] = useRefreshTokenMutation()
  const refreshTimerRef = useRef(null)

  // JWT token'dan expiration time'ı al
  const getTokenExpiration = (token) => {
    if (!token) return null

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.exp * 1000 // Milisaniye cinsinden
    } catch (error) {
      return null
    }
  }

  // Access token'ı yenile
  const handleRefreshToken = async () => {
    try {
      const result = await refreshToken().unwrap()

      if (result.accessToken) {
        dispatch(setAccessToken(result.accessToken))

        // Yeni token için zamanlayıcı kur
        scheduleRefresh(result.accessToken)
      }
    } catch (error) {
      // Refresh token geçersiz veya süresi dolmuş - Logout yap
      dispatch(logout())
    }
  }

  // Token yenileme zamanlayıcısını kur
  const scheduleRefresh = (token) => {
    // Önceki zamanlayıcıyı temizle
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current)
    }

    const expirationTime = getTokenExpiration(token)
    if (!expirationTime) return

    const now = Date.now()
    const timeUntilExpiry = expirationTime - now

    // Token süresi dolmadan 2 dakika (120 saniye) önce yenile
    const refreshTime = timeUntilExpiry - (2 * 60 * 1000)

    // Eğer token zaten dolmak üzereyse hemen yenile
    if (refreshTime <= 0) {
      handleRefreshToken()
      return
    }


    // Zamanlayıcıyı kur
    refreshTimerRef.current = setTimeout(() => {
      handleRefreshToken()
    }, refreshTime)
  }

  useEffect(() => {
    // Sadece login olmuş kullanıcılar için çalış
    if (!isAuthenticated || !accessToken) {
      return
    }

    // İlk zamanlayıcıyı kur
    scheduleRefresh(accessToken)

    // Cleanup: Component unmount olduğunda zamanlayıcıyı temizle
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current)
      }
    }
  }, [accessToken, isAuthenticated])

  // Bu component UI render etmez, sadece arka planda çalışır
  return null
}
