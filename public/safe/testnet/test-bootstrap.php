<?php
/**
 * Bootstrap test
 */

try {
    require_once __DIR__ . '/../core/bootstrap.php';

    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'message' => 'Bootstrap yüklendi',
        'env_loaded' => isset($_ENV['BINANCE_TEST_API_KEY']),
        'api_key_length' => isset($_ENV['BINANCE_TEST_API_KEY']) ? strlen($_ENV['BINANCE_TEST_API_KEY']) : 0
    ]);
} catch (Exception $e) {
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
}
