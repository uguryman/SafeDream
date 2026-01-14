<?php
/**
 * Binance Testnet Emir İptal
 * DELETE /safe/testnet/cancel-order.php?symbol=BTCUSDT&orderId=123
 */

require_once __DIR__ . '/../public/api/core/bootstrap.php';
require_once __DIR__ . '/helper.php';

requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    error('Sadece DELETE metodu desteklenir', 405);
}

try {
    $symbol = $_GET['symbol'] ?? null;
    $orderId = $_GET['orderId'] ?? null;

    if (!$symbol || !$orderId) {
        error('Eksik parametreler. Gerekli: symbol, orderId', 400);
    }

    $result = cancelTestnetOrder($symbol, intval($orderId));

    success($result);

} catch (Exception $e) {
    error($e->getMessage(), 500);
}
