<?php
/**
 * Binance TR API Helper Fonksiyonları
 *
 * Base URL: https://api.binance.tr
 * Dokümantasyon: https://api.binance.tr/swagger/
 */

require_once __DIR__ . '/config.php';

/**
 * HMAC SHA256 imza oluşturur
 */
function createBinanceSignature($queryString, $secretKey) {
    return hash_hmac('sha256', $queryString, $secretKey);
}

/**
 * Binance TR API'ye imzalı istek gönderir
 */
function binanceRequest($endpoint, $params = [], $method = 'GET') {
    $apiKey = $_ENV['BINANCE_TR_API_KEY'];
    $secretKey = $_ENV['BINANCE_TR_SECRET_KEY'];

    if (empty($apiKey) || empty($secretKey)) {
        throw new Exception('Binance TR API bilgileri .env dosyasında tanımlı değil');
    }

    // Binance TR API URL
    $baseUrl = 'https://api.binance.tr/api/v3';

    // Timestamp ekle (milisaniye)
    $params['timestamp'] = round(microtime(true) * 1000);

    // RecvWindow ekle
    $params['recvWindow'] = 5000;

    // Query string oluştur
    $queryString = http_build_query($params);

    // HMAC SHA256 signature
    $signature = createBinanceSignature($queryString, $secretKey);

    // Signature ekle
    $queryString .= '&signature=' . $signature;

    // Tam URL
    $url = $baseUrl . $endpoint . '?' . $queryString;

    // cURL
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'X-MBX-APIKEY: ' . $apiKey
    ]);

    if ($method !== 'GET') {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    }

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($error) {
        throw new Exception('Binance API bağlantı hatası: ' . $error);
    }

    $data = json_decode($response, true);

    if ($httpCode !== 200) {
        $errorMsg = $data['msg'] ?? 'Bilinmeyen hata';
        $errorCode = $data['code'] ?? $httpCode;
        throw new Exception("Binance API hatası (Code: $errorCode): $errorMsg");
    }

    return $data;
}

/**
 * Spot hesap bakiyesini getirir
 */
function getBinanceSpotBalance() {
    return binanceRequest('/account', [], 'GET');
}

/**
 * Belirli coin'in bakiyesini getirir
 */
function getBinanceCoinBalance($asset) {
    $all = getBinanceSpotBalance();
    $asset = strtoupper($asset);

    foreach ($all['balances'] as $balance) {
        if ($balance['asset'] === $asset) {
            return ['data' => [$balance]];
        }
    }

    return ['data' => []];
}

/**
 * Bakiyeleri frontend için formatlar
 */
function formatBinanceBalances($balances) {
    $formatted = [];

    if (!isset($balances['balances'])) return $formatted;

    foreach ($balances['balances'] as $b) {
        $free = floatval($b['free']);
        $locked = floatval($b['locked']);
        $total = $free + $locked;

        if ($total > 0) {
            $formatted[] = [
                'asset' => $b['asset'],
                'free' => $free,
                'locked' => $locked,
                'total' => $total
            ];
        }
    }

    usort($formatted, fn($a, $b) => $b['total'] <=> $a['total']);

    return $formatted;
}

/**
 * Coin çiftinin anlık fiyatını getirir (API key gerektirmez)
 *
 * @param string $symbol Coin çifti (örn: BTCUSDT, ETHUSDT)
 * @return array Price bilgisi
 */
function getBinanceTickerPrice($symbol = 'BTCUSDT') {
    // Binance TR için alternatif base URL'ler (DNS sorununda fallback için)
    $baseUrls = [
        'https://api.binance.tr/api/v3',
        'https://www.binance.tr/api/v3',
    ];

    $endpoint = '/ticker/price';
    $symbol = strtoupper($symbol);
    $lastError = null;

    // Her URL'yi sırayla dene
    foreach ($baseUrls as $baseUrl) {
        $url = $baseUrl . $endpoint . '?symbol=' . $symbol;

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 5);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        // Başarılı ise dön
        if (!$error && $httpCode === 200) {
            $data = json_decode($response, true);
            if ($data) {
                return $data;
            }
        }

        // Hatayı sakla, bir sonraki URL'yi dene
        $lastError = $error ?: "HTTP $httpCode";
    }

    // Hiçbir URL çalışmadı
    throw new Exception('Binance ticker API hatası (tüm URL\'ler denendi): ' . $lastError);
}

/**
 * Birden fazla coin çiftinin anlık fiyatlarını getirir
 *
 * @param array $symbols Coin çiftleri (örn: ['BTCUSDT', 'ETHUSDT'])
 * @return array Price bilgileri
 */
function getBinanceMultipleTickerPrices($symbols = []) {
    if (empty($symbols)) {
        // Tüm fiyatları getir
        $baseUrl = 'https://api.binance.tr/api/v3';
        $endpoint = '/ticker/price';

        $url = $baseUrl . $endpoint;

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

        $response = curl_exec($ch);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new Exception('Binance ticker API hatası: ' . $error);
        }

        return json_decode($response, true);
    }

    // Belirtilen symboller için tek tek çek
    $prices = [];
    foreach ($symbols as $symbol) {
        try {
            $prices[] = getBinanceTickerPrice($symbol);
        } catch (Exception $e) {
            // Hata varsa atla, devam et
            continue;
        }
    }

    return $prices;
}
