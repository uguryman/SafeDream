<?php
/**
 * Binance Testnet Emir Oluşturma
 * POST /safe/testnet/create-order.php
 */

require_once __DIR__ . '/../public/api/core/bootstrap.php';
require_once __DIR__ . '/helper.php';

requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error('Sadece POST metodu desteklenir', 405);
}

try {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        error('Geçersiz JSON', 400);
    }

    $symbol = $input['symbol'] ?? null;
    $side = $input['side'] ?? null;
    $type = $input['type'] ?? null;
    $quantity = $input['quantity'] ?? null;

    if (!$symbol || !$side || !$type || !$quantity) {
        error('Eksik parametreler. Gerekli: symbol, side, type, quantity', 400);
    }

    $price = $input['price'] ?? null;
    $timeInForce = $input['timeInForce'] ?? 'GTC';

    if (strtoupper($type) === 'LIMIT' && !$price) {
        error('LIMIT emri için price parametresi gerekli', 400);
    }

    $result = createTestnetOrder($symbol, $side, $type, floatval($quantity), $price ? floatval($price) : null, $timeInForce);

    success($result);

} catch (Exception $e) {
    error($e->getMessage(), 500);
}
