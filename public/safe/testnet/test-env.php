<?php
/**
 * Test ENV Variables
 * Geçici test dosyası - .env değişkenlerini kontrol eder
 */

require_once __DIR__ . '/../core/bootstrap.php';

header('Content-Type: application/json');

echo json_encode([
    'BINANCE_TEST_API_KEY_EXISTS' => !empty($_ENV['BINANCE_TEST_API_KEY']),
    'BINANCE_TEST_API_KEY_LENGTH' => isset($_ENV['BINANCE_TEST_API_KEY']) ? strlen($_ENV['BINANCE_TEST_API_KEY']) : 0,
    'BINANCE_TEST_SECRET_KEY_EXISTS' => !empty($_ENV['BINANCE_TEST_SECRET_KEY']),
    'BINANCE_TEST_SECRET_KEY_LENGTH' => isset($_ENV['BINANCE_TEST_SECRET_KEY']) ? strlen($_ENV['BINANCE_TEST_SECRET_KEY']) : 0,
    'ALL_ENV_KEYS' => array_keys($_ENV),
], JSON_PRETTY_PRINT);
