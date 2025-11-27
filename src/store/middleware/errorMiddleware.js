import { isRejectedWithValue } from '@reduxjs/toolkit';

/**
 * Ortak Hata Yönetimi Middleware
 * Tüm RTK Query hatalarını yakalar ve işler
 */
export const errorMiddleware = (api) => (next) => (action) => {
  // RTK Query'den gelen rejected action'ı yakala
  if (isRejectedWithValue(action)) {
    const { payload, meta } = action;

    // Hata mesajını çıkar
    let errorMessage = 'Bir hata oluştu';
    let errorCode = null;

    if (payload) {
      // API'den gelen hata response'u
      if (payload.data?.message) {
        errorMessage = payload.data.message;
      } else if (payload.error) {
        errorMessage = payload.error;
      } else if (typeof payload === 'string') {
        errorMessage = payload;
      }

      errorCode = payload.status;
    }

    // Console'a log
    console.error('🚨 API Hatası:', {
      endpoint: meta?.arg?.endpointName,
      message: errorMessage,
      code: errorCode,
    });

    // Özel hata durumları
    switch (errorCode) {
      case 401:
        // Unauthorized - Token geçersiz
        console.warn('⚠️ Token geçersiz, logout yapılıyor...');
        // Logout action dispatch edilecek (API slice'ta)
        break;

      case 403:
        // Forbidden - Yetki yok
        console.warn('⚠️ Bu işlem için yetkiniz yok');
        alert('Bu işlem için yetkiniz yok');
        break;

      case 404:
        // Not Found
        console.warn('⚠️ İstenilen kaynak bulunamadı');
        break;

      case 500:
        // Server Error
        console.error('🔥 Sunucu hatası');
        alert('Sunucu hatası. Lütfen daha sonra tekrar deneyin.');
        break;

      case 'FETCH_ERROR':
        // Network Error
        console.error('🌐 Bağlantı hatası');
        alert('Bağlantı hatası. İnternet bağlantınızı kontrol edin.');
        break;

      default:
        // Diğer hatalar
        if (errorMessage && errorMessage !== 'Bir hata oluştu') {
          alert(errorMessage);
        }
    }
  }

  return next(action);
};
