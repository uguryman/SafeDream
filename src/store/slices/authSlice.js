import { createSlice } from '@reduxjs/toolkit';

/**
 * Auth Slice - Güvenli Token Yönetimi
 *
 * Access Token: Sadece memory'de tutulur (localStorage YOK!)
 * Refresh Token: HTTP-Only cookie'de (backend tarafından yönetilir)
 *
 * Sayfa yenilendiğinde:
 * - Access token kaybolur
 * - Refresh token cookie'de kaldığı için otomatik yenilenir
 */

const initialState = {
  accessToken: null, // Sadece memory'de - sayfa yenilendiğinde kaybolur
  user: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Login başarılı - Access token'ı memory'e kaydet
    setCredentials: (state, action) => {
      const { accessToken, user } = action.payload;
      state.accessToken = accessToken;
      state.user = user || null;
      state.isAuthenticated = true;
      // localStorage kullanılmıyor - sadece memory!
    },

    // Access token'ı güncelle (refresh işleminden sonra)
    setAccessToken: (state, action) => {
      state.accessToken = action.payload;
      state.isAuthenticated = true;
    },

    // Logout - Token'ı sil
    logout: (state) => {
      state.accessToken = null;
      state.user = null;
      state.isAuthenticated = false;
      // localStorage temizleme yok çünkü hiç kullanmıyoruz
    },

    // User bilgilerini güncelle (profile'dan gelecek)
    setUser: (state, action) => {
      state.user = action.payload;
    },
  },
});

export const { setCredentials, setAccessToken, logout, setUser } = authSlice.actions;

// Selectors
export const selectAccessToken = (state) => state.auth.accessToken;
export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;

export default authSlice.reducer;
