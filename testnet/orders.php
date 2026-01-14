<?php
/**
 * Binance Testnet Emirler Endpoint
 * GET /safe/testnet/orders.php?type=open&symbol=BTCUSDT
 * GET /safe/testnet/orders.php?type=all&symbol=BTCUSDT&limit=50
 */

require_once __DIR__ . '/../public/api/core/bootstrap.php';
require_once __DIR__ . '/helper.php';

requireAuth();

try {
    $type = $_GET['type'] ?? 'open';
    $symbol = $_GET['symbol'] ?? null;
    $limit = intval($_GET['limit'] ?? 500);

    $orders = [];

    if ($type === 'open') {
        $orders = getTestnetOpenOrders($symbol);
    } elseif ($type === 'all') {
        if (!$symbol) {
            error('Symbol parametresi gerekli (örn: symbol=BTCUSDT)', 400);
            return;
        }
        $orders = getTestnetAllOrders($symbol, $limit);
    } else {
        error('Geçersiz type parametresi. Kullanım: type=open veya type=all', 400);
        return;
    }

    if (!is_array($orders)) {
        $orders = [];
    }

    success($orders);

} catch (Exception $e) {
    error($e->getMessage(), 500);
}
