<?php
/**
 * Logout Endpoint
 * Kullanıcı oturumunu kapatır, refresh token'ı invalidate eder
 *
 * Method: POST
 * Headers: Authorization: Bearer <access_token>
 * Cookie: refresh_token
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
    // Access token'dan kullanıcı bilgilerini al
    $user = requireAuth(); // Bearer token kontrolü

    // Veritabanındaki refresh token'ı sil (invalidate)
    dbUpdate('kullanici', [
        'token' => null, // Token'ı null yap
    ], [
        'id' => (int)$user->kullaniciid
    ]);

    // HTTP-Only cookie'yi temizle
    clearRefreshTokenCookie();

    // Başarılı response
    success(['message' => 'Çıkış başarılı'], 200);

} catch (Exception $e) {
    // Hata olsa bile cookie'yi temizle
    clearRefreshTokenCookie();
    error('Bir hata oluştu: ' . $e->getMessage(), 500);
}
