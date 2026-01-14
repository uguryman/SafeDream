<?php
/**
 * Binance Testnet Emir İptal Endpoint
 * DELETE /api/testnet-cancel-order.php?symbol=BTCUSDT&orderId=123456
 *
 * Testnet emrini iptal eder
 */

require_once __DIR__ . '/../core/bootstrap.php';
require_once __DIR__ . '/helper.php';

// JWT token kontrolü
requireAuth();

// Sadece DELETE metodu
if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    error('Sadece DELETE metodu desteklenir', 405);
}

try {
    $symbol = $_GET['symbol'] ?? null;
    $orderId = $_GET['orderId'] ?? null;

    if (!$symbol || !$orderId) {
        error('Eksik parametreler. Gerekli: symbol, orderId', 400);
    }

    // Emri iptal et
    $result = cancelTestnetOrder($symbol, intval($orderId));

    success($result);

} catch (Exception $e) {
    error($e->getMessage(), 500);
}
