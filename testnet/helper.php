<?php
/**
 * Binance Testnet API Helper Functions
 */

function binanceTestnetRequest($endpoint, $params = [], $method = 'GET', $signed = false) {
    $apiKey = $_ENV['BINANCE_TEST_API_KEY'] ?? '';
    $secretKey = $_ENV['BINANCE_TEST_SECRET_KEY'] ?? '';

    if (empty($apiKey) || empty($secretKey)) {
        throw new Exception('Binance Testnet API anahtarları yapılandırılmamış');
    }

    $baseUrl = 'https://testnet.binance.vision';

    if ($signed) {
        $params['timestamp'] = round(microtime(true) * 1000);
        $params['recvWindow'] = 60000;

        $queryString = http_build_query($params);
        $signature = hash_hmac('sha256', $queryString, $secretKey);
        $params['signature'] = $signature;
    }

    $url = $baseUrl . $endpoint;
    if (!empty($params)) {
        $url .= '?' . http_build_query($params);
    }

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

    $headers = [
        'X-MBX-APIKEY: ' . $apiKey,
        'Content-Type: application/x-www-form-urlencoded'
    ];
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
    } elseif ($method === 'DELETE') {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
    }

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    if (curl_errno($ch)) {
        $error = curl_error($ch);
        curl_close($ch);
        throw new Exception('cURL hatası: ' . $error);
    }

    curl_close($ch);

    $data = json_decode($response, true);

    if ($httpCode !== 200) {
        $errorMsg = $data['msg'] ?? 'Bilinmeyen hata';
        throw new Exception('Binance API hatası: ' . $errorMsg . ' (HTTP ' . $httpCode . ')');
    }

    return $data;
}

function getTestnetBalance() {
    return binanceTestnetRequest('/api/v3/account', [], 'GET', true);
}

function getTestnetOpenOrders($symbol = null) {
    $params = [];
    if ($symbol) {
        $params['symbol'] = $symbol;
    }
    return binanceTestnetRequest('/api/v3/openOrders', $params, 'GET', true);
}

function getTestnetAllOrders($symbol, $limit = 500) {
    $params = [
        'symbol' => $symbol,
        'limit' => $limit
    ];
    return binanceTestnetRequest('/api/v3/allOrders', $params, 'GET', true);
}

function createTestnetOrder($symbol, $side, $type, $quantity, $price = null, $timeInForce = 'GTC') {
    $params = [
        'symbol' => $symbol,
        'side' => strtoupper($side),
        'type' => strtoupper($type),
        'quantity' => $quantity
    ];

    if ($type === 'LIMIT') {
        if ($price === null) {
            throw new Exception('LIMIT emri için fiyat belirtilmeli');
        }
        $params['price'] = $price;
        $params['timeInForce'] = $timeInForce;
    }

    return binanceTestnetRequest('/api/v3/order', $params, 'POST', true);
}

function cancelTestnetOrder($symbol, $orderId) {
    $params = [
        'symbol' => $symbol,
        'orderId' => $orderId
    ];
    return binanceTestnetRequest('/api/v3/order', $params, 'DELETE', true);
}
