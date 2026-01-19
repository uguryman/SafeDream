import { apiSlice } from './apiSlice';

/**
 * Binance Testnet API Endpoints
 *
 * Backend PHP üzerinden Binance Testnet API'ye istek atar
 * Test ortamında işlem yapmak için kullanılır
 * Gerçek para kullanılmaz, sadece test amaçlıdır.
 */
export const binanceTestnetApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Testnet hesap bakiyesi
    getTestBalance: builder.query({
      query: () => '/testnet/balance.php',
      transformResponse: (response) => {
        if (response.success) {
          return response.data;
        }
        throw new Error(response.message || 'Test bakiyesi alınamadı');
      },
      providesTags: ['TestBalance'],
      pollingInterval: 5000,
    }),

    // Testnet açık emirleri
    getTestOpenOrders: builder.query({
      query: (symbol) => {
        const params = new URLSearchParams({ type: 'open' });
        if (symbol) {
          params.append('symbol', symbol.toUpperCase());
        }
        return `/testnet/orders.php?${params.toString()}`;
      },
      transformResponse: (response) => {
        if (response.success) {
          return response.data;
        }
        throw new Error(response.message || 'Açık emirler alınamadı');
      },
      providesTags: ['TestOrders'],
      pollingInterval: 5000,
    }),

    // Testnet tüm emirler
    getTestAllOrders: builder.query({
      query: ({ symbol = 'BTCUSDT', limit = 500 }) => {
        const params = new URLSearchParams({
          type: 'all',
          symbol: symbol.toUpperCase(),
          limit: limit.toString()
        });
        return `/testnet/orders.php?${params.toString()}`;
      },
      transformResponse: (response) => {
        if (response.success) {
          return response.data;
        }
        throw new Error(response.message || 'Emirler alınamadı');
      },
      providesTags: ['TestOrders'],
      pollingInterval: 10000,
    }),

    // Testnet yeni emir oluştur
    createTestOrder: builder.mutation({
      query: ({ symbol, side, type, quantity, price, timeInForce = 'GTC' }) => {
        const body = {
          symbol: symbol.toUpperCase(),
          side: side.toUpperCase(),
          type: type.toUpperCase(),
          quantity: parseFloat(quantity),
        };

        if (type.toUpperCase() === 'LIMIT') {
          body.price = parseFloat(price);
          body.timeInForce = timeInForce;
        }

        return {
          url: '/testnet/create-order.php',
          method: 'POST',
          body: body,
        };
      },
      transformResponse: (response) => {
        if (response.success) {
          return response.data;
        }
        throw new Error(response.message || 'Emir oluşturulamadı');
      },
      invalidatesTags: ['TestBalance', 'TestOrders', 'TestTrades'],
    }),

    // Testnet emir iptal et
    cancelTestOrder: builder.mutation({
      query: ({ symbol, orderId }) => ({
        url: `/testnet/cancel-order.php?symbol=${symbol.toUpperCase()}&orderId=${orderId}`,
        method: 'DELETE',
      }),
      transformResponse: (response) => {
        if (response.success) {
          return response.data;
        }
        throw new Error(response.message || 'Emir iptal edilemedi');
      },
      invalidatesTags: ['TestOrders'],
    }),

    // Ticker fiyat endpoint'leri (backend üzerinden)
    // Tek coin fiyatı
    getTickerPrice: builder.query({
      query: (symbol = 'BTCUSDT') => `/binance/ticker.php?symbol=${symbol.toUpperCase()}`,
      transformResponse: (response) => {
        if (response.success) {
          return response.data;
        }
        throw new Error(response.message || 'Fiyat bilgisi alınamadı');
      },
      providesTags: (result, error, symbol) => [{ type: 'TickerPrice', id: symbol }],
    }),

    // Birden fazla coin fiyatı
    getMultipleTickerPrices: builder.query({
      query: (symbols = []) => {
        if (!symbols || symbols.length === 0) {
          throw new Error('En az bir symbol gerekli');
        }
        const symbolsStr = symbols.join(',');
        return `/binance/ticker.php?symbols=${symbolsStr}`;
      },
      transformResponse: (response) => {
        if (response.success && response.data) {
          // Backend'den gelen format: { success: true, data: { prices: [...] } }
          const prices = response.data.prices || [];
          return Array.isArray(prices) ? prices : [];
        }
        throw new Error(response.message || 'Fiyat bilgileri alınamadı');
      },
      providesTags: ['TickerPrices'],
    }),

    // Exchange Info - Min/Max kuralları
    getExchangeInfo: builder.query({
      query: (symbol) => `/testnet/exchange-info.php?symbol=${symbol.toUpperCase()}`,
      transformResponse: (response) => {
        if (response.success) {
          return response.data;
        }
        throw new Error(response.message || 'Exchange bilgisi alınamadı');
      },
      providesTags: (result, error, symbol) => [{ type: 'ExchangeInfo', id: symbol }],
    }),

    // Klines - Historical Candlestick Data
    getKlines: builder.query({
      query: ({ symbol, interval = '1m', limit = 100 }) => {
        const params = new URLSearchParams({
          symbol: symbol.toUpperCase(),
          interval: interval,
          limit: limit.toString()
        });
        return `/binance/klines.php?${params.toString()}`;
      },
      transformResponse: (response) => {
        if (response.success && response.data) {
          // Binance klines format: [timestamp, open, high, low, close, volume, ...]
          return response.data.map(candle => ({
            time: candle[0] / 1000, // Lightweight Charts saniye cinsinden ister
            open: parseFloat(candle[1]),
            high: parseFloat(candle[2]),
            low: parseFloat(candle[3]),
            close: parseFloat(candle[4]),
            volume: parseFloat(candle[5])
          }));
        }
        throw new Error(response.message || 'Klines verisi alınamadı');
      },
      providesTags: (result, error, { symbol, interval }) => [
        { type: 'Klines', id: `${symbol}_${interval}` }
      ],
    }),
  }),
});

// Export hooks
export const {
  useGetTestBalanceQuery,
  useGetTestOpenOrdersQuery,
  useGetTestAllOrdersQuery,
  useCreateTestOrderMutation,
  useCancelTestOrderMutation,
  useGetTickerPriceQuery,
  useGetMultipleTickerPricesQuery,
  useGetExchangeInfoQuery,
  useGetKlinesQuery,
} = binanceTestnetApi;
