<?php
/**
 * Binance TR IP Adresi ile Direkt Bağlantı Testi
 *
 * DNS çalışmadığında IP adresi üzerinden bağlantı kurar
 */

header('Content-Type: application/json');

// Binance TR ve Global için bilinen IP adresleri
// Not: Bu IP'ler değişebilir, bu yüzden birden fazla seçenek test ediyoruz
$binanceIPs = [
    // Binance Global IPs (bunlar daha stabil)
    '76.223.70.161',  // api.binance.com
    '76.223.79.161',  // api.binance.com
    '54.89.239.40',   // api.binance.com
];

$results = [];
$testEndpoint = '/api/v3/time';

foreach ($binanceIPs as $ip) {
    $testCases = [
        'without_host_header' => [
            'url' => "https://$ip$testEndpoint",
            'headers' => [],
        ],
        'with_binance_com_host' => [
            'url' => "https://$ip$testEndpoint",
            'headers' => ['Host: api.binance.com'],
        ],
        'with_binance_tr_host' => [
            'url' => "https://$ip$testEndpoint",
            'headers' => ['Host: api.binance.tr'],
        ],
    ];

    foreach ($testCases as $caseName => $testCase) {
        $ch = curl_init($testCase['url']);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // IP kullanırken SSL verify sorun çıkarabilir
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);

        if (!empty($testCase['headers'])) {
            curl_setopt($ch, CURLOPT_HTTPHEADER, $testCase['headers']);
        }

        $startTime = microtime(true);
        $response = curl_exec($ch);
        $endTime = microtime(true);

        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        $info = curl_getinfo($ch);
        curl_close($ch);

        $results[$ip][$caseName] = [
            'url' => $testCase['url'],
            'headers' => $testCase['headers'],
            'http_code' => $httpCode,
            'success' => ($httpCode == 200 && !$error),
            'error' => $error ?: null,
            'response_time' => round(($endTime - $startTime) * 1000, 2) . ' ms',
            'response_preview' => $response ? substr($response, 0, 200) : null,
            'response_data' => $response ? json_decode($response, true) : null,
        ];
    }
}

// Ticker price test (IP ile)
$tickerTest = [];
foreach ($binanceIPs as $ip) {
    $url = "https://$ip/api/v3/ticker/price?symbol=BTCUSDT";

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Host: api.binance.com']);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    $tickerTest[$ip] = [
        'url' => $url,
        'http_code' => $httpCode,
        'success' => ($httpCode == 200 && !$error),
        'error' => $error ?: null,
        'price_data' => $response ? json_decode($response, true) : null,
    ];
}

// Recommendations
$workingIPs = [];
foreach ($results as $ip => $tests) {
    foreach ($tests as $testName => $result) {
        if ($result['success']) {
            $workingIPs[] = [
                'ip' => $ip,
                'method' => $testName,
                'headers' => $result['headers'],
            ];
            break;
        }
    }
}

$recommendations = [];
if (!empty($workingIPs)) {
    $recommendations[] = "✅ IP adresi ile bağlantı başarılı!";
    $recommendations[] = "Çalışan IP'ler: " . json_encode($workingIPs, JSON_PRETTY_PRINT);
    $recommendations[] = "💡 binance.php dosyasını IP kullanacak şekilde güncelleyebiliriz";
} else {
    $recommendations[] = "❌ IP adresleri de çalışmıyor";
    $recommendations[] = "⚠️ Hosting sağlayıcı tüm dış bağlantıları engelliyor olabilir";
    $recommendations[] = "💡 Hosting sağlayıcı ile iletişime geçin";
}

echo json_encode([
    'timestamp' => date('Y-m-d H:i:s'),
    'tested_ips' => $binanceIPs,
    'time_endpoint_tests' => $results,
    'ticker_endpoint_tests' => $tickerTest,
    'working_connections' => $workingIPs,
    'recommendations' => $recommendations,
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
