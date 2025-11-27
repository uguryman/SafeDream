<?php
/**
 * file_get_contents ile Binance Bağlantı Testi
 */

header('Content-Type: application/json');

$results = [];

// Test 1: file_get_contents ile direkt istek
$urls = [
    'Binance TR' => 'https://api.binance.tr/api/v3/time',
    'Binance Global' => 'https://api.binance.com/api/v3/time',
    'Google' => 'https://www.google.com',
];

foreach ($urls as $name => $url) {
    $context = stream_context_create([
        'http' => [
            'timeout' => 10,
            'ignore_errors' => true,
        ],
        'ssl' => [
            'verify_peer' => false,
            'verify_peer_name' => false,
        ]
    ]);

    $startTime = microtime(true);
    $response = @file_get_contents($url, false, $context);
    $endTime = microtime(true);

    $results[$name] = [
        'url' => $url,
        'success' => ($response !== false),
        'response_time' => round(($endTime - $startTime) * 1000, 2) . ' ms',
        'response_length' => $response ? strlen($response) : 0,
        'response_preview' => $response ? substr($response, 0, 200) : null,
        'headers' => $http_response_header ?? null,
    ];
}

// Test 2: allow_url_fopen kontrolü
$phpSettings = [
    'allow_url_fopen' => ini_get('allow_url_fopen'),
    'allow_url_include' => ini_get('allow_url_include'),
    'disable_functions' => ini_get('disable_functions'),
];

// Recommendation
$recommendations = [];
if (!$phpSettings['allow_url_fopen']) {
    $recommendations[] = "❌ allow_url_fopen kapalı - Hosting ayarlarından açılması gerekiyor";
} else {
    $recommendations[] = "✅ allow_url_fopen açık";
}

$anySuccess = false;
foreach ($results as $name => $result) {
    if ($result['success']) {
        $anySuccess = true;
        $recommendations[] = "✅ $name ile bağlantı başarılı (file_get_contents)";
    }
}

if (!$anySuccess) {
    $recommendations[] = "❌ file_get_contents de çalışmıyor";
    $recommendations[] = "⚠️ Hosting tamamen dış bağlantıları engelliyor";
    $recommendations[] = "💡 Çözüm 1: Hosting sağlayıcıdan firewall açmasını isteyin";
    $recommendations[] = "💡 Çözüm 2: Frontend'den direkt Binance API'ye istek atın (CORS sorunlu)";
    $recommendations[] = "💡 Çözüm 3: Başka bir sunucu (VPS) üzerinden proxy kurun";
}

echo json_encode([
    'timestamp' => date('Y-m-d H:i:s'),
    'php_settings' => $phpSettings,
    'test_results' => $results,
    'recommendations' => $recommendations,
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
