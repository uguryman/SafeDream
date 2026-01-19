<?php
/**
 * Binance Klines (Candlestick) Data API
 *
 * Binance'den historical candlestick verilerini alır
 * Grafik çizimi için kullanılır
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// GET parametrelerini al
$symbol = $_GET['symbol'] ?? 'BTCUSDT';
$interval = $_GET['interval'] ?? '1m'; // 1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w, 1M
$limit = intval($_GET['limit'] ?? 100); // Max 1000

// Validasyon
$validIntervals = ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d', '3d', '1w', '1M'];
if (!in_array($interval, $validIntervals)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Geçersiz interval. Geçerli değerler: ' . implode(', ', $validIntervals)
    ]);
    exit;
}

if ($limit < 1 || $limit > 1000) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Limit 1-1000 arasında olmalıdır'
    ]);
    exit;
}

// Binance Mainnet API (Klines public endpoint, gerçek market data)
$baseUrl = 'https://api.binance.com';
$endpoint = '/api/v3/klines';

// Query parametreleri
$params = [
    'symbol' => strtoupper($symbol),
    'interval' => $interval,
    'limit' => $limit
];

$url = $baseUrl . $endpoint . '?' . http_build_query($params);

// cURL ile istek at
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

// cURL hatası
if ($curlError) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Binance API bağlantı hatası: ' . $curlError
    ]);
    exit;
}

// HTTP hata kodu kontrolü
if ($httpCode !== 200) {
    http_response_code($httpCode);
    echo json_encode([
        'success' => false,
        'message' => 'Binance API hatası (HTTP ' . $httpCode . ')',
        'details' => json_decode($response, true)
    ]);
    exit;
}

// Binance'den gelen data array formatında
$data = json_decode($response, true);

if (!is_array($data)) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Binance API geçersiz yanıt döndü'
    ]);
    exit;
}

// Başarılı yanıt
echo json_encode([
    'success' => true,
    'data' => $data,
    'metadata' => [
        'symbol' => strtoupper($symbol),
        'interval' => $interval,
        'count' => count($data),
        'timestamp' => time()
    ]
]);
