<?php
/**
 * Binance Testnet API Helper Functions
 *
 * Binance Testnet API'ye istek atmak için yardımcı fonksiyonlar
 * Signature (HMAC SHA256) hesaplama ve API istekleri
 */

/**
 * Binance Testnet API'ye istek at
 *
 * @param string $endpoint API endpoint (örn: /api/v3/account)
 * @param array $params Query parametreleri
 * @param string $method HTTP metodu (GET, POST, DELETE)
 * @param bool $signed İmza gerekiyor mu?
 * @return array API yanıtı
 */
function binanceTestnetRequest($endpoint, $params = [], $method = 'GET', $signed = false) {
    $apiKey = $_ENV['BINANCE_TEST_API_KEY'] ?? '';
    $secretKey = $_ENV['BINANCE_TEST_SECRET_KEY'] ?? '';

    if (empty($apiKey) || empty($secretKey)) {
        throw new Exception('Binance Testnet API anahtarları yapılandırılmamış');
    }

    // Binance Demo Trading (Spot Test Network)
    // https://demo.binance.com/en/my/settings/api-management
    $baseUrl = 'https://testnet.binance.vision';

    // İmzalı istek için timestamp ve signature ekle
    if ($signed) {
        $params['timestamp'] = round(microtime(true) * 1000);
        $params['recvWindow'] = 60000; // 60 saniye

        // Query string oluştur
        $queryString = http_build_query($params);

        // HMAC SHA256 signature
        $signature = hash_hmac('sha256', $queryString, $secretKey);
        $params['signature'] = $signature;
    }

    // URL oluştur
    $url = $baseUrl . $endpoint;
    if (!empty($params)) {
        $url .= '?' . http_build_query($params);
    }

    // cURL isteği
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true); // Redirect'leri takip et
    curl_setopt($ch, CURLOPT_MAXREDIRS, 5); // Maksimum 5 redirect

    // Headers
    $headers = [
        'X-MBX-APIKEY: ' . $apiKey,
        'Content-Type: application/x-www-form-urlencoded'
    ];
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

    // HTTP method
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

/**
 * Testnet hesap bakiyesini getir
 */
function getTestnetBalance() {
    return binanceTestnetRequest('/api/v3/account', [], 'GET', true);
}

/**
 * Testnet açık emirleri getir
 *
 * @param string|null $symbol Coin çifti (örn: BTCUSDT)
 */
function getTestnetOpenOrders($symbol = null) {
    $params = [];
    if ($symbol) {
        $params['symbol'] = $symbol;
    }
    return binanceTestnetRequest('/api/v3/openOrders', $params, 'GET', true);
}

/**
 * Testnet tüm emirleri getir
 *
 * @param string $symbol Coin çifti (örn: BTCUSDT)
 * @param int $limit Maksimum kayıt sayısı
 */
function getTestnetAllOrders($symbol, $limit = 500) {
    $params = [
        'symbol' => $symbol,
        'limit' => $limit
    ];
    return binanceTestnetRequest('/api/v3/allOrders', $params, 'GET', true);
}

/**
 * Testnet işlem geçmişi
 *
 * @param string $symbol Coin çifti (örn: BTCUSDT)
 * @param int $limit Maksimum kayıt sayısı
 */
function getTestnetMyTrades($symbol, $limit = 500) {
    $params = [
        'symbol' => $symbol,
        'limit' => $limit
    ];
    return binanceTestnetRequest('/api/v3/myTrades', $params, 'GET', true);
}

/**
 * Testnet yeni emir oluştur
 *
 * @param string $symbol Coin çifti (örn: BTCUSDT)
 * @param string $side Alım/Satım (BUY/SELL)
 * @param string $type Emir tipi (MARKET/LIMIT)
 * @param float $quantity Miktar
 * @param float|null $price Fiyat (LIMIT için gerekli)
 * @param string $timeInForce Zaman sınırı (GTC/IOC/FOK)
 */
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

/**
 * Testnet emir iptal et
 *
 * @param string $symbol Coin çifti (örn: BTCUSDT)
 * @param int $orderId Emir ID
 */
function cancelTestnetOrder($symbol, $orderId) {
    $params = [
        'symbol' => $symbol,
        'orderId' => $orderId
    ];
    return binanceTestnetRequest('/api/v3/order', $params, 'DELETE', true);
}

/**
 * Testnet ticker fiyatı (public endpoint - signature gerektirmez)
 *
 * @param string $symbol Coin çifti (örn: BTCUSDT)
 */
function getTestnetTickerPrice($symbol) {
    $params = ['symbol' => $symbol];
    return binanceTestnetRequest('/api/v3/ticker/price', $params, 'GET', false);
}

/**
 * Testnet 24hr ticker (public endpoint - signature gerektirmez)
 *
 * @param string $symbol Coin çifti (örn: BTCUSDT)
 */
function getTestnet24hrTicker($symbol) {
    $params = ['symbol' => $symbol];
    return binanceTestnetRequest('/api/v3/ticker/24hr', $params, 'GET', false);
}
