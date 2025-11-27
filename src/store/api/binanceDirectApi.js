import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

/**
 * Binance TR Direct API (Frontend'den direkt Binance'a)
 *
 * Backend DNS sorunu olduğu için, public endpoint'ler için
 * doğrudan Binance API'ye istek atıyoruz.
 *
 * NOT: Bu sadece API key gerektirmeyen public endpoint'ler için!
 * Balance gibi authenticated endpoint'ler için backend gerekli.
 */
export const binanceDirectApi = createApi({
  reducerPath: 'binanceDirectApi',
  baseQuery: fetchBaseQuery({
    // Binance Global API kullan (api.binance.tr DNS sorunu var)
    baseUrl: 'https://api.binance.com/api/v3',
    // CORS için gerekli headers
    prepareHeaders: (headers) => {
      headers.set('Accept', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['TickerPrice', 'TickerPrices'],
  endpoints: (builder) => ({
    // Tek coin fiyatı
    getDirectTickerPrice: builder.query({
      query: (symbol = 'BTCUSDT') => `/ticker/price?symbol=${symbol.toUpperCase()}`,
      transformResponse: (response) => {
        // Binance direkt response: { "symbol": "BTCUSDT", "price": "50000.00" }
        return response;
      },
      providesTags: (result, error, symbol) => [{ type: 'TickerPrice', id: symbol }],
      // Her 3 saniyede bir otomatik yenile
      pollingInterval: 3000,
    }),

    // Birden fazla coin fiyatı
    getDirectMultipleTickerPrices: builder.query({
      query: (symbols = ['BTCUSDT', 'ETHUSDT']) => {
        // Binance symbols parametresi array olarak gönderilir
        const params = new URLSearchParams();
        params.append('symbols', JSON.stringify(symbols.map(s => s.toUpperCase())));
        return `/ticker/price?${params.toString()}`;
      },
      transformResponse: (response) => {
        // Response: [{ "symbol": "BTCUSDT", "price": "50000" }, ...]
        return response;
      },
      providesTags: ['TickerPrices'],
      pollingInterval: 3000,
    }),

    // Tüm ticker fiyatları (Binance TR'de mevcut tüm çiftler)
    getAllTickerPrices: builder.query({
      query: () => '/ticker/price',
      transformResponse: (response) => {
        // Response: [{ symbol, price }, ...]
        return response;
      },
      providesTags: ['TickerPrices'],
      pollingInterval: 5000,
    }),

    // 24 saatlik ticker istatistikleri
    get24hrTicker: builder.query({
      query: (symbol = 'BTCUSDT') => `/ticker/24hr?symbol=${symbol.toUpperCase()}`,
      transformResponse: (response) => {
        // Response: { symbol, priceChange, priceChangePercent, lastPrice, volume, ... }
        return response;
      },
      providesTags: (result, error, symbol) => [{ type: 'TickerPrice', id: `${symbol}_24hr` }],
      pollingInterval: 10000,
    }),

    // Server time (connection test için)
    getServerTime: builder.query({
      query: () => '/time',
      transformResponse: (response) => {
        // Response: { serverTime: 1234567890123 }
        return {
          serverTime: response.serverTime,
          localTime: Date.now(),
          diff: Date.now() - response.serverTime,
        };
      },
    }),

    // Exchange bilgileri (hangi çiftler mevcut)
    getExchangeInfo: builder.query({
      query: () => '/exchangeInfo',
      transformResponse: (response) => {
        // Sadece trading çiftlerini döndür
        const symbols = response.symbols
          .filter(s => s.status === 'TRADING')
          .map(s => ({
            symbol: s.symbol,
            baseAsset: s.baseAsset,
            quoteAsset: s.quoteAsset,
            status: s.status,
          }));
        return { symbols, timezone: response.timezone, serverTime: response.serverTime };
      },
      // Bu endpoint nadiren değişir, cache'le
      keepUnusedDataFor: 3600, // 1 saat
    }),

    // Kline/Candlestick verisi (geçmiş fiyat verisi)
    getKlines: builder.query({
      query: ({ symbol = 'BTCUSDT', interval = '1m', limit = 100 }) => {
        // interval: 1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w, 1M
        // limit: max 1000
        return `/klines?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${limit}`;
      },
      transformResponse: (response) => {
        // Binance klines response:
        // [
        //   [openTime, open, high, low, close, volume, closeTime, quoteVolume, trades, takerBuyBase, takerBuyQuote, ignore],
        //   ...
        // ]
        return response.map(candle => ({
          openTime: candle[0],
          open: parseFloat(candle[1]),
          high: parseFloat(candle[2]),
          low: parseFloat(candle[3]),
          close: parseFloat(candle[4]),
          volume: parseFloat(candle[5]),
          closeTime: candle[6],
          quoteVolume: parseFloat(candle[7]),
          trades: candle[8],
        }));
      },
      pollingInterval: 60000, // 1 dakikada bir güncelle
    }),
  }),
});

// Export hooks
export const {
  useGetDirectTickerPriceQuery,
  useGetDirectMultipleTickerPricesQuery,
  useGetAllTickerPricesQuery,
  useGet24hrTickerQuery,
  useGetServerTimeQuery,
  useGetExchangeInfoQuery,
  useGetKlinesQuery,
} = binanceDirectApi;

// Export reducer
export const { reducerPath: binanceDirectApiReducerPath, reducer: binanceDirectApiReducer } =
  binanceDirectApi;
