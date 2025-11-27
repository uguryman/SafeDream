<?php
/**
 * Refresh Token Endpoint
 * Süresi dolmuş access token'ı yeniler
 *
 * Method: POST
 * Cookie: refresh_token (HTTP-Only)
 * Response: {
 *   "success": true,
 *   "data": {
 *     "accessToken": "new_jwt_token"
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

header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true'); // Cookie için gerekli

// OPTIONS request için
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/core/functions.php';
require_once __DIR__ . '/core/jwt.php';
require_once __DIR__ . '/core/response.php';

// Sadece POST metodunu kabul et
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error('Sadece POST metodu kabul edilir', 405);
}

try {
    // Cookie'den refresh token al
    $refreshToken = getRefreshTokenFromCookie();

    if (!$refreshToken) {
        error('Refresh token bulunamadı. Lütfen tekrar giriş yapın.', 401);
    }

    // Refresh token'ı doğrula
    $decoded = verifyJWT($refreshToken);

    if (!$decoded) {
        // Token geçersiz veya süresi dolmuş
        clearRefreshTokenCookie(); // Cookie'yi temizle
        error('Refresh token geçersiz veya süresi dolmuş. Lütfen tekrar giriş yapın.', 401);
    }

    // Token tipini kontrol et
    if (!isset($decoded->type) || $decoded->type !== 'refresh') {
        error('Geçersiz token tipi', 401);
    }

    // Kullanıcıyı veritabanından al
    $kullanici = dbSelectOne('kullanici', [
        'id' => (int)$decoded->kullaniciid,
        'aktif' => 1
    ]);

    if (!$kullanici) {
        clearRefreshTokenCookie();
        error('Kullanıcı bulunamadı veya aktif değil', 401);
    }

    // Veritabanındaki refresh token ile eşleşiyor mu kontrol et
    if ($kullanici['token'] !== $refreshToken) {
        clearRefreshTokenCookie();
        error('Refresh token geçersiz. Lütfen tekrar giriş yapın.', 401);
    }

    // Yeni access token oluştur
    $accessTokenPayload = [
        'kullaniciadi' => $kullanici['kullaniciadi'],
        'firmaid' => (int)$kullanici['firmaid'],
        'subeid' => (int)$kullanici['subeid'],
        'kullaniciid' => (int)$kullanici['id'],
        'kullanicitipi' => (int)$kullanici['kullanicitipi']
    ];

    $newAccessToken = createAccessToken($accessTokenPayload);

    // Başarılı response
    success(['accessToken' => $newAccessToken], 200);

} catch (Exception $e) {
    error('Bir hata oluştu: ' . $e->getMessage(), 500);
}
