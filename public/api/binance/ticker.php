<?php
/**
 * Binance TR Ticker Price Endpoint
 *
 * Coin çiftlerinin anlık fiyatlarını getirir (API key gerektirmez)
 *
 * Method: GET
 * Query params:
 *   - symbol: Coin çifti (örn: BTCUSDT) - Opsiyonel
 *   - symbols: Birden fazla coin çifti (örn: BTCUSDT,ETHUSDT) - Opsiyonel
 *
 * Response: {
 *   "success": true,
 *   "data": {
 *     "symbol": "BTCUSDT",
 *     "price": "50000.00"
 *   }
 * }
 */

// CORS ayarları
$allowedOrigins = [
    'https://livecarwash.com',
    'https://www.livecarwash.com',
    'http://localhost:5173', // Vite dev server
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    header('Access-Control-Allow-Origin: https://livecarwash.com');
}

header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// OPTIONS request için
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../core/response.php';
require_once __DIR__ . '/../core/binance.php';

// Sadece GET metodunu kabul et
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    error('Sadece GET metodu kabul edilir', 405);
}

try {
    // Query parametrelerini al
    $symbol = $_GET['symbol'] ?? null;
    $symbols = $_GET['symbols'] ?? null;

    // Tek symbol sorgusu
    if ($symbol) {
        $priceData = getBinanceTickerPrice($symbol);
        success($priceData, 200);
        exit;
    }

    // Birden fazla symbol sorgusu
    if ($symbols) {
        $symbolsArray = explode(',', $symbols);
        $pricesData = getBinanceMultipleTickerPrices($symbolsArray);
        success(['prices' => $pricesData], 200);
        exit;
    }

    // Parametre verilmemişse BTC/USDT döndür (varsayılan)
    $defaultPrice = getBinanceTickerPrice('BTCUSDT');
    success($defaultPrice, 200);

} catch (Exception $e) {
    error('Fiyat bilgisi alınamadı: ' . $e->getMessage(), 500);
}
