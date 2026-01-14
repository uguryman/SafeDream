<?php
/**
 * Binance Testnet Emirler Endpoint
 * GET /api/testnet/orders.php?type=open&symbol=BTCUSDT
 * GET /api/testnet/orders.php?type=all&symbol=BTCUSDT&limit=50
 *
 * Testnet emirlerini getirir
 */

require_once __DIR__ . '/../core/bootstrap.php';
require_once __DIR__ . '/helper.php';

// JWT token kontrolü
requireAuth();

try {
    $type = $_GET['type'] ?? 'open'; // 'open' veya 'all'
    $symbol = $_GET['symbol'] ?? null;
    $limit = intval($_GET['limit'] ?? 500);

    $orders = [];

    if ($type === 'open') {
        // Açık emirler
        $orders = getTestnetOpenOrders($symbol);
    } elseif ($type === 'all') {
        // Tüm emirler (symbol zorunlu)
        if (!$symbol) {
            error('Symbol parametresi gerekli (örn: symbol=BTCUSDT)', 400);
            return;
        }
        $orders = getTestnetAllOrders($symbol, $limit);
    } else {
        error('Geçersiz type parametresi. Kullanım: type=open veya type=all', 400);
        return;
    }

    // Eğer orders array değilse, boş array döndür
    if (!is_array($orders)) {
        $orders = [];
    }

    success($orders);

} catch (Exception $e) {
    error($e->getMessage(), 500);
}
