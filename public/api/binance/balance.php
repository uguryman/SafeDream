<?php
/**
 * Binance TR Bakiye Endpoint
 *
 * Kullanıcının Binance TR hesabındaki tüm bakiyelerini getirir
 *
 * Method: GET
 * Headers: Authorization: Bearer <access_token>
 * Response: {
 *   "success": true,
 *   "data": {
 *     "balances": [
 *       {
 *         "asset": "BTC",
 *         "free": 0.5,
 *         "locked": 0,
 *         "total": 0.5
 *       }
 *     ]
 *   }
 * }
 */

// CORS ayarları
$allowedOrigins = [
    'https://livecarwash.com',
    'https://www.livecarwash.com',
    'http://localhost:5173', // Vite dev server
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    header('Access-Control-Allow-Origin: https://livecarwash.com');
}

header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// OPTIONS request için
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../core/jwt.php';
require_once __DIR__ . '/../core/response.php';
require_once __DIR__ . '/../core/binance.php';

// Sadece GET metodunu kabul et
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    error('Sadece GET metodu kabul edilir', 405);
}

try {
    // Token doğrulama - Kullanıcı login olmalı
    $user = requireAuth();

    // Kullanıcı admin mi kontrol et (kullanicitipi = 100)
    if ((int)$user->kullanicitipi !== 100) {
        error('Bu işlem için yetkiniz yok. Sadece admin kullanıcıları bakiye sorgulayabilir.', 403);
    }

    // Binance TR'den bakiye bilgilerini al
    $balanceResponse = getBinanceSpotBalance();

    // Bakiyeleri formatla (sadece bakiyesi olanları al)
    $formattedBalances = formatBinanceBalances($balanceResponse);

    // Toplam varlık sayısı
    $totalAssets = count($formattedBalances);

    // Başarılı response
    success([
        'balances' => $formattedBalances,
        'totalAssets' => $totalAssets,
        'timestamp' => time()
    ], 200);

} catch (Exception $e) {
    // Hata mesajını kontrol et
    $errorMessage = $e->getMessage();

    // Binance API hatası mı?
    if (strpos($errorMessage, 'Binance') !== false) {
        error('Binance bağlantı hatası: ' . $errorMessage, 503);
    }

    // Genel hata
    error('Bir hata oluştu: ' . $errorMessage, 500);
}
