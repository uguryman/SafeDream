import { useState } from 'react'
import { useCreateTestOrderMutation, useGetTickerPriceQuery, useGetExchangeInfoQuery } from '../../store/api/binanceTestnetApi'
import { useToast } from '../../components/Toast'
import { getCoinOptions } from '../../config/coins'

/**
 * Test İşlem Kartı Komponenti
 * Binance Testnet'te alım/satım işlemleri
 */
function TestTransactionCard() {
  const [orderType, setOrderType] = useState('buy') // 'buy' veya 'sell'
  const [selectedCoin, setSelectedCoin] = useState('BTCUSDT')
  const [quantity, setQuantity] = useState('')
  const [usdtAmount, setUsdtAmount] = useState('') // USDT tutarı
  const [price, setPrice] = useState('')
  const [tradeType, setTradeType] = useState('MARKET') // 'MARKET' veya 'LIMIT'
  const [inputMode, setInputMode] = useState('quantity') // 'quantity' veya 'amount'

  // Toast hook
  const { success, error: showError, warning } = useToast()

  // Emir oluşturma mutation
  const [createOrder, { isLoading: isCreatingOrder }] = useCreateTestOrderMutation()

  // Seçilen coin'in güncel fiyatı (Backend üzerinden)
  const { data: currentPrice } = useGetTickerPriceQuery(selectedCoin)

  // Seçilen coin'in min/max kuralları
  const { data: exchangeInfo } = useGetExchangeInfoQuery(selectedCoin)

  // USDT tutarından coin miktarını hesapla
  const calculateQuantityFromUsdt = (usdtValue) => {
    if (!usdtValue || !currentPrice) return ''

    const priceToUse = tradeType === 'MARKET' ? parseFloat(currentPrice.price) : parseFloat(price)
    if (priceToUse > 0) {
      return (parseFloat(usdtValue) / priceToUse).toString()
    }
    return ''
  }

  // Coin miktarından USDT tutarını hesapla
  const calculateUsdtFromQuantity = (quantityValue) => {
    if (!quantityValue || !currentPrice) return ''

    const priceToUse = tradeType === 'MARKET' ? parseFloat(currentPrice.price) : parseFloat(price)
    if (priceToUse > 0) {
      return (parseFloat(quantityValue) * priceToUse).toString()
    }
    return ''
  }

  // Input değiştiğinde
  const handleInputChange = (value) => {
    if (inputMode === 'amount') {
      // USDT tutarı girildi
      setUsdtAmount(value)
      setQuantity(calculateQuantityFromUsdt(value))
    } else {
      // Coin miktarı girildi
      setQuantity(value)
      setUsdtAmount(calculateUsdtFromQuantity(value))
    }
  }

  // Input mode değiştiğinde
  const toggleInputMode = () => {
    setInputMode(inputMode === 'quantity' ? 'amount' : 'quantity')
  }

  // İşlemi onayla
  const handleSubmit = async () => {
    if (!quantity || quantity <= 0) {
      warning('Lütfen geçerli bir miktar giriniz')
      return
    }

    // Min/Max validasyonu
    if (exchangeInfo) {
      const minQty = parseFloat(exchangeInfo.filters.minQty)
      const minNotional = parseFloat(exchangeInfo.filters.minNotional)
      const qty = parseFloat(quantity)

      // Min miktar kontrolü
      if (qty < minQty) {
        showError(`Miktar çok düşük!\n\nMinimum miktar: ${minQty} ${exchangeInfo.baseAsset}`)
        return
      }

      // Min tutar kontrolü (USDT cinsinden)
      const estimatedAmount = parseFloat(usdtAmount)
      if (estimatedAmount < minNotional) {
        showError(`İşlem tutarı çok düşük!\n\nMinimum tutar: $${minNotional} USDT\nSizin tutarınız: $${estimatedAmount.toFixed(2)} USDT`)
        return
      }
    }

    if (tradeType === 'LIMIT' && (!price || price <= 0)) {
      warning('Limit emri için fiyat belirtmelisiniz')
      return
    }

    try {
      const orderData = {
        symbol: selectedCoin,
        side: orderType.toUpperCase(), // BUY or SELL
        type: tradeType,
        quantity: parseFloat(quantity),
      }

      if (tradeType === 'LIMIT') {
        orderData.price = parseFloat(price)
        orderData.timeInForce = 'GTC'
      }

      const result = await createOrder(orderData).unwrap()
      success(`Emir oluşturuldu!\nEmir ID: ${result.orderId}`)

      // Formu temizle
      setQuantity('')
      setUsdtAmount('')
      setPrice('')
    } catch (error) {
      console.error('Order creation error:', error)
      const errorMessage = error?.data?.message || error?.data?.msg || error?.error || error?.message || 'Emir oluşturulamadı'
      showError(`Hata: ${errorMessage}`)
    }
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-6 hover:border-bitcoin/30 transition-all duration-300">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h3 className="text-white text-lg sm:text-xl font-bold flex items-center gap-2">
          <span className="text-xl sm:text-2xl">💳</span>
          Test İşlem
        </h3>
      </div>

      {/* İşlem Türü Seçimi (Al/Sat) */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
        <button
          onClick={() => setOrderType('buy')}
          className={`rounded-lg p-3 sm:p-4 transition-all duration-300 ${
            orderType === 'buy'
              ? 'bg-green-500/30 border-2 border-green-500'
              : 'bg-green-500/10 border border-green-500/30 hover:bg-green-500/20'
          }`}
        >
          <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">📥</div>
          <p className="text-green-400 font-medium text-sm sm:text-base">Al</p>
        </button>
        <button
          onClick={() => setOrderType('sell')}
          className={`rounded-lg p-3 sm:p-4 transition-all duration-300 ${
            orderType === 'sell'
              ? 'bg-red-500/30 border-2 border-red-500'
              : 'bg-red-500/10 border border-red-500/30 hover:bg-red-500/20'
          }`}
        >
          <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">📤</div>
          <p className="text-red-400 font-medium text-sm sm:text-base">Sat</p>
        </button>
      </div>

      {/* Emir Tipi (Market/Limit) */}
      <div className="mb-3 sm:mb-4">
        <label className="text-gray-400 text-xs sm:text-sm mb-2 block">Emir Tipi</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setTradeType('MARKET')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              tradeType === 'MARKET'
                ? 'bg-bitcoin/30 border border-bitcoin text-bitcoin'
                : 'bg-black/30 border border-white/10 text-gray-400 hover:border-white/20'
            }`}
          >
            Market
          </button>
          <button
            onClick={() => setTradeType('LIMIT')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              tradeType === 'LIMIT'
                ? 'bg-bitcoin/30 border border-bitcoin text-bitcoin'
                : 'bg-black/30 border border-white/10 text-gray-400 hover:border-white/20'
            }`}
          >
            Limit
          </button>
        </div>
      </div>

      {/* İşlem Formu */}
      <div className="space-y-4">
        <div>
          <label className="text-gray-400 text-sm mb-2 block">Coin Çifti</label>
          <select
            value={selectedCoin}
            onChange={(e) => setSelectedCoin(e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-bitcoin focus:outline-none"
          >
            {getCoinOptions().map(option => (
              <option key={option.value} value={option.value}>
                {option.icon} {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Güncel Fiyat */}
        {currentPrice && (
          <div className="bg-black/30 border border-white/10 rounded-lg px-4 py-3">
            <p className="text-gray-400 text-xs mb-1">Güncel Fiyat</p>
            <p className="text-white font-bold text-lg">
              ${parseFloat(currentPrice.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        )}

        {/* Limit fiyatı (sadece LIMIT emirler için) */}
        {tradeType === 'LIMIT' && (
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Fiyat (USDT)</label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-bitcoin focus:outline-none"
            />
          </div>
        )}

        {/* Miktar / Tutar Girişi */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-gray-400 text-sm">
              {inputMode === 'quantity' ? 'Coin Miktarı' : 'USDT Tutarı'}
            </label>
            <button
              type="button"
              onClick={toggleInputMode}
              className="px-3 py-1 bg-purple-500/20 border border-purple-500/50 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-all text-xs font-medium"
            >
              {inputMode === 'quantity' ? '💵 Tutar Gir' : '🔢 Miktar Gir'}
            </button>
          </div>
          <input
            type="number"
            step={inputMode === 'quantity' ? '0.00000001' : '0.01'}
            placeholder={inputMode === 'quantity' ? '0.00000000' : '0.00'}
            value={inputMode === 'quantity' ? quantity : usdtAmount}
            onChange={(e) => handleInputChange(e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-bitcoin focus:outline-none"
          />
          <p className="text-gray-500 text-xs mt-1">
            {inputMode === 'quantity'
              ? `Coin miktarı: ${quantity || '0'} | USDT tutarı: ${usdtAmount ? parseFloat(usdtAmount).toFixed(2) : '0.00'}`
              : `USDT tutarı: ${usdtAmount || '0'} | Coin miktarı: ${quantity ? parseFloat(quantity).toFixed(8) : '0.00000000'}`
            }
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isCreatingOrder}
          className={`w-full rounded-lg py-3 font-medium transition-all duration-300 ${
            orderType === 'buy'
              ? 'bg-green-500/20 border border-green-500/50 text-green-400 hover:bg-green-500/30'
              : 'bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isCreatingOrder ? '🔄 İşlem Yapılıyor...' : `${orderType === 'buy' ? '📥 Al' : '📤 Sat'} (Testnet)`}
        </button>
      </div>
    </div>
  )
}

export default TestTransactionCard
