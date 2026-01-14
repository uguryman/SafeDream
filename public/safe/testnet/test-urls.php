<?php
/**
 * Binance Demo Trading Base URL Test
 * Farklı base URL'leri deneyelim
 */

require_once __DIR__ . '/../core/bootstrap.php';

header('Content-Type: text/plain; charset=utf-8');

$apiKey = $_ENV['BINANCE_TEST_API_KEY'] ?? '';
$secretKey = $_ENV['BINANCE_TEST_SECRET_KEY'] ?? '';

echo "🔍 Binance Demo API Base URL Test\n\n";
echo "API Key: " . substr($apiKey, 0, 15) . "...\n";
echo "Secret Key: " . substr($secretKey, 0, 15) . "...\n\n";

// Test edilecek base URL'ler
$baseUrls = [
    'https://testnet.binance.vision',
    'https://testnet.binancefuture.com',
    'https://api.binance.com', // Production (test için)
    'https://api-testnet.binancefuture.com', // Futures testnet
    'https://testnet.binanceops.com', // Alternatif testnet
    'https://api.demo.binance.com', // Demo API
];

foreach ($baseUrls as $baseUrl) {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo "🌐 Testing: $baseUrl\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

    // Signature oluştur
    $timestamp = round(microtime(true) * 1000);
    $params = [
        'timestamp' => $timestamp,
        'recvWindow' => 60000
    ];

    $queryString = http_build_query($params);
    $signature = hash_hmac('sha256', $queryString, $secretKey);
    $params['signature'] = $signature;

    $url = $baseUrl . '/api/v3/account?' . http_build_query($params);

    // cURL request
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_MAXREDIRS, 5);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'X-MBX-APIKEY: ' . $apiKey,
        'Content-Type: application/x-www-form-urlencoded'
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $effectiveUrl = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);
    $error = curl_error($ch);
    curl_close($ch);

    echo "   HTTP Code: $httpCode\n";

    if ($error) {
        echo "   ❌ cURL Error: $error\n";
    }

    if ($effectiveUrl !== $url) {
        echo "   🔄 Redirected to: $effectiveUrl\n";
    }

    $data = json_decode($response, true);

    if ($httpCode === 200) {
        echo "   ✅ SUCCESS!\n";
        echo "   📊 Can Trade: " . ($data['canTrade'] ? 'Yes' : 'No') . "\n";
        echo "   📊 Balances: " . count($data['balances']) . " assets\n";

        // Bakiyesi olan coin'leri göster
        $nonZero = 0;
        foreach ($data['balances'] as $balance) {
            $total = floatval($balance['free']) + floatval($balance['locked']);
            if ($total > 0) {
                $nonZero++;
                echo "      💰 {$balance['asset']}: $total\n";
            }
        }
        if ($nonZero === 0) {
            echo "      ⚠️ No non-zero balances found\n";
        }

        echo "\n   🎉 THIS BASE URL WORKS!\n";
    } else {
        echo "   ❌ FAILED\n";
        if ($data && isset($data['msg'])) {
            echo "   Error Message: {$data['msg']}\n";
            if (isset($data['code'])) {
                echo "   Error Code: {$data['code']}\n";
            }
        }
        echo "   Response: " . substr($response, 0, 200) . "...\n";
    }

    echo "\n";
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "Test tamamlandı!\n";
