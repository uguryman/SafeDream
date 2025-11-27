import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { setAccessToken, logout } from '../slices/authSlice';

// Mutex to prevent multiple token refresh requests
let isRefreshing = false;
let refreshPromise = null;

// Base Query - Access token'ı otomatik header'a ekler
const baseQuery = fetchBaseQuery({
  // Localhost development: /safe -> Vite proxy -> https://livecarwash.com/safe
  // Production: /safe -> Same domain
  baseUrl: '/safe',
  prepareHeaders: (headers, { getState }) => {
    // Access token'ı state'ten al
    const accessToken = getState().auth.accessToken;

    // Access token varsa Authorization header'ına ekle
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }

    return headers;
  },
  credentials: 'include', // HTTP-Only cookie için gerekli
});

/**
 * Base Query Wrapper - Token Refresh Interceptor
 *
 * 401 hatası alındığında:
 * 1. Refresh token endpoint'ine istek atar (cookie otomatik gönderilir)
 * 2. Yeni access token alır ve Redux'a kaydeder
 * 3. Başarısız olan isteği tekrar dener
 * 4. Refresh başarısız olursa logout yapar
 */
const baseQueryWithReauth = async (args, api, extraOptions) => {
  // İlk isteği yap
  let result = await baseQuery(args, api, extraOptions);

  // 401 Unauthorized - Access token süresi dolmuş olabilir
  if (result.error && result.error.status === 401) {
    // Refresh token endpoint'i hariç (sonsuz döngü olmasın)
    if (!args.url?.includes('refresh-token') && !args.url?.includes('login')) {

      // Birden fazla istek aynı anda refresh yapmaya çalışmasın
      if (!isRefreshing) {
        isRefreshing = true;

        try {
          // Refresh token ile yeni access token al
          refreshPromise = baseQuery(
            {
              url: '/refresh-token.php',
              method: 'POST',
            },
            api,
            extraOptions
          );

          const refreshResult = await refreshPromise;

          if (refreshResult.data?.success && refreshResult.data?.data?.accessToken) {
            // Yeni access token'ı Redux'a kaydet
            api.dispatch(setAccessToken(refreshResult.data.data.accessToken));

            // Başarısız olan isteği yeni token ile tekrar dene
            result = await baseQuery(args, api, extraOptions);
          } else {
            // Refresh başarısız - Logout yap
            api.dispatch(logout());
          }
        } catch (error) {
          // Refresh hatası - Logout yap
          api.dispatch(logout());
        } finally {
          isRefreshing = false;
          refreshPromise = null;
        }
      } else {
        // Başka bir istek zaten refresh yapıyor, bekle
        await refreshPromise;
        // Refresh tamamlandı, isteği tekrar dene
        result = await baseQuery(args, api, extraOptions);
      }
    } else {
      // Login veya refresh-token endpoint'inden 401 - Logout yap
      api.dispatch(logout());
    }
  }

  return result;
};

// API Slice - Tüm API endpoint'leri buradan
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Profile'], // Cache tag'leri
  endpoints: () => ({}), // Endpoints başka dosyalarda inject edilecek
});
