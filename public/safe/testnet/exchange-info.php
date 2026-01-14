<?php
/**
 * Binance Testnet Exchange Info Endpoint
 * GET /testnet/exchange-info.php?symbol=BTCUSDT
 *
 * Coin çiftinin min/max işlem kurallarını getirir
 */

require_once __DIR__ . '/../core/bootstrap.php';
require_once __DIR__ . '/helper.php';

// Sadece GET metodu
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    error('Sadece GET metodu desteklenir', 405);
}

try {
    $symbol = $_GET['symbol'] ?? null;

    if (!$symbol) {
        error('symbol parametresi gerekli', 400);
    }

    // Exchange info'yu al
    $exchangeInfo = binanceTestnetRequest('/api/v3/exchangeInfo', ['symbol' => $symbol], 'GET', false);

    if (!isset($exchangeInfo['symbols']) || count($exchangeInfo['symbols']) === 0) {
        error('Coin çifti bulunamadı', 404);
    }

    $symbolInfo = $exchangeInfo['symbols'][0];

    // Filtreleri parse et
    $filters = [];
    foreach ($symbolInfo['filters'] as $filter) {
        $filters[$filter['filterType']] = $filter;
    }

    // Min/Max bilgilerini çıkar
    $result = [
        'symbol' => $symbolInfo['symbol'],
        'status' => $symbolInfo['status'],
        'baseAsset' => $symbolInfo['baseAsset'],
        'quoteAsset' => $symbolInfo['quoteAsset'],
        'filters' => [
            'minPrice' => $filters['PRICE_FILTER']['minPrice'] ?? null,
            'maxPrice' => $filters['PRICE_FILTER']['maxPrice'] ?? null,
            'tickSize' => $filters['PRICE_FILTER']['tickSize'] ?? null,
            'minQty' => $filters['LOT_SIZE']['minQty'] ?? null,
            'maxQty' => $filters['LOT_SIZE']['maxQty'] ?? null,
            'stepSize' => $filters['LOT_SIZE']['stepSize'] ?? null,
            'minNotional' => $filters['MIN_NOTIONAL']['minNotional'] ?? ($filters['NOTIONAL']['minNotional'] ?? null),
        ]
    ];

    success($result);

} catch (Exception $e) {
    error($e->getMessage(), 500);
}
