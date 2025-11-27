<?php
/**
 * Binance TR URL Test
 * Hangi URL çalışıyor test edelim
 */

header('Content-Type: application/json');

$urls = [
    'https://api.binance.tr/api/v3/time',
    'https://www.binance.tr/api/v3/time',
    'https://api.binance.com/api/v3/time',
    'https://api.binance.cc/api/v3/time',
    'https://api.binance.me/api/v3/time',
];

$results = [];

foreach ($urls as $url) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Geçici test için

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    $results[] = [
        'url' => $url,
        'status' => $httpCode,
        'error' => $error ?: null,
        'response' => $response ? substr($response, 0, 100) : null,
        'working' => ($httpCode == 200 && empty($error))
    ];
}

echo json_encode($results, JSON_PRETTY_PRINT);
