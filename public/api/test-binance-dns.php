<?php
/**
 * Binance TR DNS & Connection Diagnostic Tool
 *
 * Bu script:
 * 1. DNS çözümleme testi yapar
 * 2. Farklı Binance URL'lerini test eder
 * 3. SSL sertifika kontrolü yapar
 * 4. Detaylı hata mesajları verir
 */

header('Content-Type: application/json');

// Test edilecek URL'ler
$urls = [
    'Binance TR API' => 'https://api.binance.tr/api/v3/time',
    'Binance TR Web' => 'https://www.binance.tr/api/v3/time',
    'Binance Global' => 'https://api.binance.com/api/v3/time',
    'Binance CC' => 'https://api.binance.cc/api/v3/time',
    'Binance ME' => 'https://api.binance.me/api/v3/time',
];

$results = [];

// DNS resolution testi
$dnsResults = [];
$domains = ['api.binance.tr', 'www.binance.tr', 'api.binance.com'];

foreach ($domains as $domain) {
    $ips = @dns_get_record($domain, DNS_A);
    $dnsResults[$domain] = [
        'resolved' => !empty($ips),
        'ips' => $ips ? array_column($ips, 'ip') : [],
        'error' => empty($ips) ? 'DNS resolution failed' : null
    ];
}

// Her URL için bağlantı testi
foreach ($urls as $name => $url) {
    $ch = curl_init($url);

    // cURL ayarları
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
    curl_setopt($ch, CURLOPT_VERBOSE, false);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

    $startTime = microtime(true);
    $response = curl_exec($ch);
    $endTime = microtime(true);

    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    $errno = curl_errno($ch);
    $info = curl_getinfo($ch);

    curl_close($ch);

    $results[$name] = [
        'url' => $url,
        'http_code' => $httpCode,
        'response_time' => round(($endTime - $startTime) * 1000, 2) . ' ms',
        'error' => $error ?: null,
        'error_code' => $errno ?: null,
        'success' => ($httpCode == 200 && empty($error)),
        'response_preview' => $response ? substr($response, 0, 150) : null,
        'ssl_verified' => $info['ssl_verify_result'] ?? null,
        'primary_ip' => $info['primary_ip'] ?? null,
        'total_time' => round($info['total_time'] * 1000, 2) . ' ms',
    ];
}

// Test SSL olmadan
$sslDisabledTest = [];
$testUrl = 'https://api.binance.tr/api/v3/time';

$ch = curl_init($testUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

$sslDisabledTest = [
    'url' => $testUrl,
    'http_code' => $httpCode,
    'error' => $error ?: null,
    'success' => ($httpCode == 200 && empty($error)),
    'response' => $response ? substr($response, 0, 150) : null
];

// Server bilgileri
$serverInfo = [
    'php_version' => PHP_VERSION,
    'curl_version' => curl_version()['version'] ?? 'Unknown',
    'openssl_version' => curl_version()['ssl_version'] ?? 'Unknown',
    'server_ip' => $_SERVER['SERVER_ADDR'] ?? 'Unknown',
    'allow_url_fopen' => ini_get('allow_url_fopen') ? 'Enabled' : 'Disabled',
];

// Sonuçları döndür
echo json_encode([
    'timestamp' => date('Y-m-d H:i:s'),
    'dns_resolution' => $dnsResults,
    'url_tests' => $results,
    'ssl_disabled_test' => $sslDisabledTest,
    'server_info' => $serverInfo,
    'recommendation' => determineRecommendation($results, $dnsResults, $sslDisabledTest)
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

function determineRecommendation($results, $dnsResults, $sslTest) {
    $recommendations = [];

    // Hangi URL çalışıyor?
    $workingUrls = [];
    foreach ($results as $name => $result) {
        if ($result['success']) {
            $workingUrls[] = $name . ': ' . $result['url'];
        }
    }

    if (!empty($workingUrls)) {
        $recommendations[] = '✅ Çalışan URL\'ler bulundu: ' . implode(', ', $workingUrls);
    } else {
        $recommendations[] = '❌ Hiçbir URL çalışmıyor!';
    }

    // DNS kontrolü
    if (!$dnsResults['api.binance.tr']['resolved']) {
        $recommendations[] = '⚠️ api.binance.tr DNS çözümlenemiyor - Server DNS ayarlarını kontrol edin';
    }

    // SSL kontrolü
    if ($sslTest['success'] && !$results['Binance TR API']['success']) {
        $recommendations[] = '⚠️ SSL doğrulama kapalıyken çalışıyor - SSL sertifika sorunu olabilir';
    }

    // Alternatif öneri
    if (!$results['Binance TR API']['success'] && $results['Binance Global']['success']) {
        $recommendations[] = '💡 Binance Global API çalışıyor, ancak TR API anahtarlarınız uyumlu olmayabilir';
    }

    return $recommendations;
}
