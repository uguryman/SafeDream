import { apiSlice } from './apiSlice';

/**
 * Binance API Endpoints
 *
 * Binance TR entegrasyonu için RTK Query endpoints
 */
export const binanceApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Bakiye Query - Binance TR hesap bakiyesi
    getBalance: builder.query({
      query: () => '/binance/balance.php',
      transformResponse: (response) => {
        if (response.success) {
          return response.data;
        }
        throw new Error(response.message || 'Bakiye alınamadı');
      },
      providesTags: ['Balance'], // Cache tag
      // Her 30 saniyede bir otomatik yenile
      pollingInterval: 30000,
    }),

    // Manuel bakiye yenileme
    refreshBalance: builder.mutation({
      query: () => ({
        url: '/binance/balance.php',
        method: 'GET',
      }),
      transformResponse: (response) => {
        if (response.success) {
          return response.data;
        }
        throw new Error(response.message || 'Bakiye yenilenemedi');
      },
      // Balance cache'ini invalidate et
      invalidatesTags: ['Balance'],
    }),

    // Ticker Price Query - Coin fiyatları (API key gerektirmez)
    getTickerPrice: builder.query({
      query: (symbol = 'BTCUSDT') => `/binance/ticker.php?symbol=${symbol}`,
      transformResponse: (response) => {
        if (response.success) {
          return response.data;
        }
        throw new Error(response.message || 'Fiyat alınamadı');
      },
      providesTags: ['TickerPrice'],
      // Her 5 saniyede bir otomatik yenile (fiyatlar hızlı değişir)
      pollingInterval: 5000,
    }),

    // Birden fazla coin fiyatı
    getMultipleTickerPrices: builder.query({
      query: (symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT']) => {
        const symbolsString = symbols.join(',');
        return `/binance/ticker.php?symbols=${symbolsString}`;
      },
      transformResponse: (response) => {
        if (response.success) {
          return response.data;
        }
        throw new Error(response.message || 'Fiyatlar alınamadı');
      },
      providesTags: ['TickerPrices'],
      // Her 5 saniyede bir otomatik yenile
      pollingInterval: 5000,
    }),
  }),
});

// Auto-generated hooks
export const {
  useGetBalanceQuery,
  useRefreshBalanceMutation,
  useGetTickerPriceQuery,
  useGetMultipleTickerPricesQuery,
} = binanceApi;
