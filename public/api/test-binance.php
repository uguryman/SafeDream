<?php
/**
 * Binance TR API Test
 * Test endpoint ve base URL kontrolü
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/core/config.php';
require_once __DIR__ . '/core/binance.php';

try {
    echo json_encode([
        'test' => 'Binance TR API Test',
        'apiKey' => substr($_ENV['BINANCE_TR_API_KEY'], 0, 10) . '...',
        'secretKey' => substr($_ENV['BINANCE_TR_SECRET_KEY'], 0, 10) . '...',
        'timestamp' => time(),
        'message' => 'Şimdi bakiye çekmeyi deniyorum...'
    ], JSON_PRETTY_PRINT);

    echo "\n\n--- Bakiye Çekiliyor ---\n\n";

    $balance = getBinanceSpotBalance();

    echo json_encode([
        'success' => true,
        'balance' => $balance
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ], JSON_PRETTY_PRINT);
}
