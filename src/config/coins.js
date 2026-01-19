/**
 * Merkezi Coin Konfigürasyonu
 * Tüm coin bilgileri bu dosyadan yönetilir
 *
 * Kullanım:
 * import { COINS, getCoinIcon, getCoinColor, getCoinName } from '../config/coins'
 */

export const COINS = [
  {
    symbol: 'BTCUSDT',
    name: 'Bitcoin',
    shortName: 'BTC',
    icon: '₿',
    color: 'text-bitcoin',
    bgColor: 'bg-bitcoin',
    description: 'Kripto paranın öncüsü',
    category: 'Layer 1',
    rank: 1
  },
  {
    symbol: 'ETHUSDT',
    name: 'Ethereum',
    shortName: 'ETH',
    icon: 'Ξ',
    color: 'text-blue-400',
    bgColor: 'bg-blue-400',
    description: 'Akıllı kontrat platformu',
    category: 'Layer 1',
    rank: 2
  },
  {
    symbol: 'BNBUSDT',
    name: 'Binance Coin',
    shortName: 'BNB',
    icon: '◆',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-400',
    description: 'Binance ekosistem tokeni',
    category: 'Exchange',
    rank: 3
  },
  {
    symbol: 'ADAUSDT',
    name: 'Cardano',
    shortName: 'ADA',
    icon: '₳',
    color: 'text-purple-400',
    bgColor: 'bg-purple-400',
    description: 'Bilimsel blockchain',
    category: 'Layer 1',
    rank: 4
  },
  {
    symbol: 'XRPUSDT',
    name: 'Ripple',
    shortName: 'XRP',
    icon: '✕',
    color: 'text-gray-300',
    bgColor: 'bg-gray-300',
    description: 'Ödeme ağı tokeni',
    category: 'Payment',
    rank: 5
  },
  {
    symbol: 'LINKUSDT',
    name: 'Chainlink',
    shortName: 'LINK',
    icon: '🔗',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500',
    description: 'Merkeziyetsiz oracle ağı',
    category: 'Oracle',
    rank: 6
  },
  {
    symbol: 'DOGEUSDT',
    name: 'Dogecoin',
    shortName: 'DOGE',
    icon: '🐕',
    color: 'text-yellow-300',
    bgColor: 'bg-yellow-300',
    description: 'Meme coin',
    category: 'Meme',
    rank: 7
  },
  {
    symbol: 'SOLUSDT',
    name: 'Solana',
    shortName: 'SOL',
    icon: '◎',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500',
    description: 'Yüksek hızlı blockchain',
    category: 'Layer 1',
    rank: 8
  },
  {
    symbol: 'MATICUSDT',
    name: 'Polygon',
    shortName: 'MATIC',
    icon: '⬡',
    color: 'text-purple-600',
    bgColor: 'bg-purple-600',
    description: 'Ethereum Layer 2',
    category: 'Layer 2',
    rank: 9
  },
  {
    symbol: 'DOTUSDT',
    name: 'Polkadot',
    shortName: 'DOT',
    icon: '●',
    color: 'text-pink-500',
    bgColor: 'bg-pink-500',
    description: 'Multi-chain platform',
    category: 'Layer 0',
    rank: 10
  },
  {
    symbol: 'AVAXUSDT',
    name: 'Avalanche',
    shortName: 'AVAX',
    icon: '▲',
    color: 'text-red-500',
    bgColor: 'bg-red-500',
    description: 'Hızlı akıllı kontrat platformu',
    category: 'Layer 1',
    rank: 11
  },
  {
    symbol: 'TRXUSDT',
    name: 'TRON',
    shortName: 'TRX',
    icon: '⚡',
    color: 'text-red-400',
    bgColor: 'bg-red-400',
    description: 'Merkeziyetsiz içerik platformu',
    category: 'Layer 1',
    rank: 12
  },
  {
    symbol: 'UNIUSDT',
    name: 'Uniswap',
    shortName: 'UNI',
    icon: '🦄',
    color: 'text-pink-400',
    bgColor: 'bg-pink-400',
    description: 'DEX protokolü',
    category: 'DeFi',
    rank: 13
  },
  {
    symbol: 'ATOMUSDT',
    name: 'Cosmos',
    shortName: 'ATOM',
    icon: '⚛',
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-400',
    description: 'Blockchain iletişim protokolü',
    category: 'Layer 0',
    rank: 14
  },
  {
    symbol: 'LTCUSDT',
    name: 'Litecoin',
    shortName: 'LTC',
    icon: 'Ł',
    color: 'text-gray-400',
    bgColor: 'bg-gray-400',
    description: 'Bitcoin alternatifi',
    category: 'Payment',
    rank: 15
  }
]

// Helper Functions

/**
 * Coin symbol'üne göre coin objesini döndürür
 * @param {string} symbol - Coin symbol (örn: 'BTCUSDT')
 * @returns {Object|undefined} Coin objesi
 */
export const getCoin = (symbol) => {
  return COINS.find(coin => coin.symbol === symbol)
}

/**
 * Coin icon'unu döndürür
 * @param {string} symbol - Coin symbol
 * @returns {string} Icon karakteri
 */
export const getCoinIcon = (symbol) => {
  const coin = getCoin(symbol)
  return coin?.icon || '●'
}

/**
 * Coin rengini döndürür (Tailwind class)
 * @param {string} symbol - Coin symbol
 * @returns {string} Tailwind color class
 */
export const getCoinColor = (symbol) => {
  const coin = getCoin(symbol)
  return coin?.color || 'text-gray-400'
}

/**
 * Coin background rengini döndürür (Tailwind class)
 * @param {string} symbol - Coin symbol
 * @returns {string} Tailwind bg color class
 */
export const getCoinBgColor = (symbol) => {
  const coin = getCoin(symbol)
  return coin?.bgColor || 'bg-gray-400'
}

/**
 * Coin kısa ismini döndürür (BTC, ETH, vb.)
 * @param {string} symbol - Coin symbol
 * @returns {string} Kısa isim
 */
export const getCoinName = (symbol) => {
  const coin = getCoin(symbol)
  return coin?.shortName || symbol.replace('USDT', '')
}

/**
 * Coin tam ismini döndürür (Bitcoin, Ethereum, vb.)
 * @param {string} symbol - Coin symbol
 * @returns {string} Tam isim
 */
export const getCoinFullName = (symbol) => {
  const coin = getCoin(symbol)
  return coin?.name || getCoinName(symbol)
}

/**
 * Tüm coin symbol'lerini döndürür (API için)
 * @returns {Array<string>} Symbol dizisi
 */
export const getAllSymbols = () => {
  return COINS.map(coin => coin.symbol)
}

/**
 * Kategoriye göre coin'leri filtreler
 * @param {string} category - Kategori adı
 * @returns {Array<Object>} Filtrelenmiş coin dizisi
 */
export const getCoinsByCategory = (category) => {
  return COINS.filter(coin => coin.category === category)
}

/**
 * Coin'leri rank'e göre sıralar
 * @returns {Array<Object>} Sıralanmış coin dizisi
 */
export const getCoinsByRank = () => {
  return [...COINS].sort((a, b) => a.rank - b.rank)
}

// Select için hazır option'lar
export const getCoinOptions = () => {
  return COINS.map(coin => ({
    value: coin.symbol,
    label: `${coin.name} (${coin.shortName}/USDT)`,
    icon: coin.icon
  }))
}
