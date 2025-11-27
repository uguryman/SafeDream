import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { apiSlice } from './api/apiSlice';
import { binanceDirectApi } from './api/binanceDirectApi';
import authReducer from './slices/authSlice';
import { errorMiddleware } from './middleware/errorMiddleware';

// Redux Store Konfigürasyonu
export const store = configureStore({
  reducer: {
    // API Reducer - RTK Query (Backend API)
    [apiSlice.reducerPath]: apiSlice.reducer,

    // Binance Direct API Reducer (Frontend -> Binance TR direkt)
    [binanceDirectApi.reducerPath]: binanceDirectApi.reducer,

    // Auth Reducer - Token yönetimi
    auth: authReducer,
  },

  // Middleware - RTK Query + Ortak Hata Yönetimi
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      apiSlice.middleware,
      binanceDirectApi.middleware,
      errorMiddleware, // Ortak hata yönetimi
    ),

  // DevTools
  devTools: process.env.NODE_ENV !== 'production',
});

// RTK Query için gerekli - refetchOnFocus, refetchOnReconnect
setupListeners(store.dispatch);

export default store;
