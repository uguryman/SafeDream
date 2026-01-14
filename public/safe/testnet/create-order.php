<?php
/**
 * Binance Testnet Emir Oluşturma Endpoint
 * POST /api/testnet-create-order.php
 *
 * Body (JSON):
 * {
 *   "symbol": "BTCUSDT",
 *   "side": "BUY",
 *   "type": "MARKET",
 *   "quantity": 0.001
 * }
 *
 * LIMIT için:
 * {
 *   "symbol": "BTCUSDT",
 *   "side": "BUY",
 *   "type": "LIMIT",
 *   "quantity": 0.001,
 *   "price": 50000,
 *   "timeInForce": "GTC"
 * }
 */

require_once __DIR__ . '/../core/bootstrap.php';
require_once __DIR__ . '/helper.php';

// JWT token kontrolü
requireAuth();

// Sadece POST metodu
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error('Sadece POST metodu desteklenir', 405);
}

try {
    // JSON body'yi al
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        error('Geçersiz JSON', 400);
    }

    // Zorunlu alanları kontrol et
    $symbol = $input['symbol'] ?? null;
    $side = $input['side'] ?? null;
    $type = $input['type'] ?? null;
    $quantity = $input['quantity'] ?? null;

    if (!$symbol || !$side || !$type || !$quantity) {
        error('Eksik parametreler. Gerekli: symbol, side, type, quantity', 400);
    }

    // LIMIT emri için fiyat kontrolü
    $price = $input['price'] ?? null;
    $timeInForce = $input['timeInForce'] ?? 'GTC';

    if (strtoupper($type) === 'LIMIT' && !$price) {
        error('LIMIT emri için price parametresi gerekli', 400);
    }

    // Emri oluştur
    $result = createTestnetOrder($symbol, $side, $type, floatval($quantity), $price ? floatval($price) : null, $timeInForce);

    success($result);

} catch (Exception $e) {
    // Daha detaylı hata mesajı
    $errorMsg = $e->getMessage();

    // Binance API hatalarını daha anlaşılır hale getir
    if (strpos($errorMsg, 'Invalid symbol') !== false) {
        $errorMsg = "Geçersiz coin çifti: $symbol. Bu çift Testnet'te desteklenmiyor olabilir.";
    } elseif (strpos($errorMsg, 'MIN_NOTIONAL') !== false) {
        $errorMsg = "Minimum işlem tutarı yetersiz. Daha fazla miktar deneyin.";
    } elseif (strpos($errorMsg, 'LOT_SIZE') !== false) {
        $errorMsg = "Geçersiz miktar. Coin'in minimum/maksimum miktar kurallarına uymuyor.";
    } elseif (strpos($errorMsg, 'PRICE_FILTER') !== false) {
        $errorMsg = "Geçersiz fiyat. Coin'in fiyat kurallarına uymuyor.";
    } elseif (strpos($errorMsg, 'Account has insufficient balance') !== false) {
        $errorMsg = "Yetersiz bakiye. Testnet hesabınızda yeterli bakiye yok.";
    }

    error($errorMsg, 500);
}
